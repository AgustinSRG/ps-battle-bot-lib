// Major events analyzer

"use strict";

import { DefaultBattleAnalyzer } from ".";
import { Battle, BattleActivePokemon, BattleEventMajor, BattleEvent_BattleEnded, BattleEvent_CallbackCannotUseMove, BattleEvent_CallbackTrapped, BattleEvent_ClearPokemon, BattleEvent_DetailsChange, BattleEvent_Drag, BattleEvent_Faint, BattleEvent_GameType, BattleEvent_Gen, BattleEvent_Move, BattleEvent_MoveCannotUse, BattleEvent_Player, BattleEvent_Replace, BattleEvent_Request, BattleEvent_RevealTeamPreviewPokemon, BattleEvent_Rule, BattleEvent_Start, BattleEvent_Swap, BattleEvent_Switch, BattleEvent_TeamPreview, BattleEvent_TeamSize, BattleEvent_Tier, BattleEvent_Turn, PokemonMove, SideConditions, SingleTurnStatuses, VolatileStatuses, VolatilesNotBatonPassing, requestIndexByActiveSlot } from "../../battle-data";
import { createActiveFromSide, createPlayer, findPokemonInBattle, findSidePokemonOrCreateIt } from "../../battle-helpers";
import { abilityIsEnabled, unknownAbility } from "../../battle-helpers/ability";
import { unknownItem } from "../../battle-helpers/item";
import { getStatRangeFromDetails, updateStatsOnSpeciesChange } from "../../battle-helpers/pokemon";
import { getMaxPPFromBasePP, getMoveBasePP } from "../../battle-helpers/move-pp-data";
import { compareIds, toId } from "../../utils/id";
import { clone } from "../../utils/clone";
import { syncActiveWithSide } from "./active-side-sync";
import { applyRequestKnowledge } from "./request-knowledge";
import { PokemonWithIllusion } from "./illusion";

export const MajorEventsAnalyzer: { [eventType in BattleEventMajor["type"]]: (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEventMajor & { type: eventType }) => void } = {
    Request: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Request & { type: "Request"; }): void {
        // Update request
        battle.request = event.request;

        // Set main player
        battle.mainPlayer = battle.request.side.playerIndex;
    },
    TeamPreview: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_TeamPreview & { type: "TeamPreview"; }): void {
        battle.status.teamPreview = true;
        battle.status.teamPreviewSize = event.maxTeamSize || 0;
    },
    Start: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Start & { type: "Start"; }): void {
        if (battle.status.teamPreview) {
            for (const player of battle.players.values()) {
                if (!battle.status.teamPreviewSize || player.teamSize <= battle.status.teamPreviewSize) {
                    // We can know the team from the team preview

                    if (player.team.length === 0) {
                        for (const tpPoke of player.teamPreview) {
                            player.team.push({
                                index: player.team.length,
                                active: false,
                                revealed: true,
                                ident: {
                                    playerIndex: player.index,
                                    name: tpPoke.details.species,
                                },
                                details: clone(tpPoke.details),
                                condition: {
                                    hp: 100,
                                    maxHP: 100,
                                    status: "",
                                    fainted: false,
                                },
                                stats: getStatRangeFromDetails(battle.status.gen, tpPoke.details),
                                item: unknownItem(),
                                ability: unknownAbility(),
                                timesHit: 0,
                                totalBurnedSleepTurns: 0,
                                sleptByRest: false,
                                moves: new Map(),
                            });
                        }
                    } else {
                        // Main player, just mark them as revealed
                        for (const poke of player.team) {
                            poke.revealed = true;
                        }
                    }
                }
            }
        }
    },
    CallbackTrapped: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_CallbackTrapped & { type: "CallbackTrapped"; }): void {
        if (!battle.request || !battle.request.active || battle.mainPlayer === undefined) {
            return;
        }

        const mainPlayer = battle.players.get(battle.mainPlayer);

        if (!mainPlayer) {
            return;
        }

        const reqIndex = requestIndexByActiveSlot(mainPlayer, event.slot);

        const reqActive = battle.request.active[reqIndex];

        if (!reqActive) {
            return;
        }

        reqActive.trapped = true;
    },
    CallbackCannotUseMove: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_CallbackCannotUseMove & { type: "CallbackCannotUseMove"; }): void {
        if (!battle.request || !battle.request.active || battle.mainPlayer === undefined) {
            return;
        }

        const mainPlayer = battle.players.get(battle.mainPlayer);

        if (!mainPlayer) {
            return;
        }

        const reqIndex = requestIndexByActiveSlot(mainPlayer, event.slot);

        const reqActive = battle.request.active[reqIndex];

        if (!reqActive) {
            return;
        }

        for (const move of reqActive.moves) {
            if (compareIds(move.id, event.move)) {
                move.disabled = true;
            }
        }
    },
    GameType: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_GameType & { type: "GameType"; }): void {
        battle.status.gameType = event.gameType;
    },
    Gen: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Gen & { type: "Gen"; }): void {
        battle.status.gen = event.gen;
    },
    Tier: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Tier & { type: "Tier"; }): void {
        battle.status.tier = event.tier;
    },
    Rule: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Rule & { type: "Rule"; }): void {
        battle.status.rules.add(toId(event.name));

        if (compareIds(event.name, "Sleep Clause Mod")) {
            battle.status.isSleepClause = true;
        } else if (compareIds(event.name, "Inverse Mod")) {
            battle.status.inverse = true;
        }
    },
    Player: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Player & { type: "Player"; }): void {
        const newPlayer = createPlayer(event.playerIndex, event.playerName, event.playerAvatar);

        if (battle.players.has(newPlayer.index)) {
            const player = battle.players.get(newPlayer.index);

            player.name = event.playerName;
            player.avatar = event.playerAvatar;
            return;
        }

        battle.players.set(newPlayer.index, newPlayer);
    },
    TeamSize: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_TeamSize & { type: "TeamSize"; }): void {
        if (!battle.players.has(event.playerIndex)) {
            return;
        }

        const player = battle.players.get(event.playerIndex);

        player.teamSize = event.teamSize;
    },
    ClearPokemon: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_ClearPokemon & { type: "ClearPokemon"; }): void {
        for (const player of battle.players.values()) {
            player.teamPreview = [];
        }
    },
    RevealTeamPreviewPokemon: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_RevealTeamPreviewPokemon & { type: "RevealTeamPreviewPokemon"; }): void {
        if (!battle.players.has(event.playerIndex)) {
            return;
        }

        const player = battle.players.get(event.playerIndex);

        player.teamPreview.push({
            details: event.details,
        });
    },
    Turn: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Turn & { type: "Turn"; }): void {
        // Update turn number
        battle.turn = event.turn;

        // Clear single turn statuses
        for (const player of battle.players.values()) {
            for (const active of player.active.values()) {
                active.singleTurnStatuses.clear();
            }
        }

        // Clear side conditions
        for (const player of battle.players.values()) {
            const sideConsToDelete: string[] = [];

            for (const [id, sideCon] of player.sideConditions) {
                if (id === SideConditions.Wish) {
                    // Wish will always end the next turn
                    if (battle.turn - sideCon.turn > 1) {
                        sideConsToDelete.push(id);
                    }
                } else if ([SideConditions.HealingWish, SideConditions.LunarDance].includes(id)) {
                    // In generation 8 or less, Healing wish or Lunar Dance will work only on the same turn
                    if (battle.status.gen <= 8) {
                        sideConsToDelete.push(id);
                    }
                }
            }

            for (const toDelete of sideConsToDelete) {
                player.sideConditions.delete(toDelete);
            }
        }

        // Clear current move
        analyzer.currentMove = null;

        // Apply request
        applyRequestKnowledge(battle);
    },
    Switch: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Switch & { type: "Switch"; }): void {
        const player = battle.players.get(event.pokemon.playerIndex);

        if (!player) {
            return;
        }

        const activeSwitchingOut = player.active.get(event.pokemon.slot);

        if (activeSwitchingOut) {
            // Reset ability changes
            activeSwitchingOut.ability.ability = activeSwitchingOut.ability.baseAbility;

            // Reset sleep turns
            if (battle.status.gen > 2 && battle.status.gen < 6) {
                activeSwitchingOut.totalBurnedSleepTurns = 0;
            }

            syncActiveWithSide(player, activeSwitchingOut);
        }

        const newPokemon = findSidePokemonOrCreateIt(battle, player, event.pokemon.name, event.details, event.condition);

        // Create active

        const newActive = createActiveFromSide(newPokemon, event.pokemon.slot, battle.turn);

        if (newActive.index === -1) {
            // Mark as possible fake
            newActive.volatilesData.possibleFake = true;

            // Find possible faker
            for (const poke of player.team) {
                if (PokemonWithIllusion.has(toId(poke.details.species))) {
                    newActive.volatilesData.fakeGuess = poke.details.species;
                    break;
                }
            }

            if (!newActive.volatilesData.fakeGuess) {
                newActive.volatilesData.fakeGuess = toId("Zoroark");
            }
        }

        player.active.set(event.pokemon.slot, newActive);

        if (activeSwitchingOut && activeSwitchingOut.singleTurnStatuses.has(SingleTurnStatuses.BatonPass)) {
            // Pass boosts
            newActive.boosts = clone(activeSwitchingOut.boosts);

            // Pass volatiles

            for (const volatile of activeSwitchingOut.volatiles) {
                if (VolatilesNotBatonPassing.has(volatile)) {
                    continue;
                }

                newActive.volatiles.add(volatile);
            }

            newActive.volatilesData.perishTurnsLeft = activeSwitchingOut.volatilesData.perishTurnsLeft;
        } else if (activeSwitchingOut && activeSwitchingOut.singleTurnStatuses.has(SingleTurnStatuses.ShedTail)) {
            // Pass substitute
            newActive.volatiles.add(VolatileStatuses.Substitute);
        }

        // Set old pokemon not active
        if (activeSwitchingOut) {
            const sideSwitch = player.team[activeSwitchingOut.index];
            if (sideSwitch) {
                sideSwitch.active = false;
            }
        }

        // Set new pokemon active
        newPokemon.active = true;
        newPokemon.activeSlot = event.pokemon.slot;
    },
    Drag: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Drag & { type: "Drag"; }): void {
        const player = battle.players.get(event.pokemon.playerIndex);

        if (!player) {
            return;
        }

        const activeSwitchingOut = player.active.get(event.pokemon.slot);

        if (activeSwitchingOut) {
            // Reset ability changes
            activeSwitchingOut.ability.ability = activeSwitchingOut.ability.baseAbility;

            // Reset sleep turns
            if (battle.status.gen > 2 && battle.status.gen < 6) {
                activeSwitchingOut.totalBurnedSleepTurns = 0;
            }

            syncActiveWithSide(player, activeSwitchingOut);
        }

        const newPokemon = findSidePokemonOrCreateIt(battle, player, event.pokemon.name, event.details, event.condition);

        // Create active

        const newActive = createActiveFromSide(newPokemon, event.pokemon.slot, battle.turn);

        if (newActive.index === -1) {
            // Mark as possible fake
            newActive.volatilesData.possibleFake = true;

            // Find possible faker
            for (const poke of player.team) {
                if (PokemonWithIllusion.has(toId(poke.details.species))) {
                    newActive.volatilesData.fakeGuess = poke.details.species;
                    break;
                }
            }

            if (!newActive.volatilesData.fakeGuess) {
                newActive.volatilesData.fakeGuess = toId("Zoroark");
            }
        }

        player.active.set(event.pokemon.slot, newActive);

        // Set old pokemon not active
        if (activeSwitchingOut) {
            const sideSwitch = player.team[activeSwitchingOut.index];
            if (sideSwitch) {
                sideSwitch.active = false;
            }
        }

        // Set new pokemon active
        newPokemon.active = true;
        newPokemon.activeSlot = event.pokemon.slot;
    },
    Replace: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Replace & { type: "Replace"; }): void {
        // End of illusion

        const player = battle.players.get(event.pokemon.playerIndex);

        if (!player) {
            return;
        }

        const activeBeingReplaced = player.active.get(event.pokemon.slot);

        if (!activeBeingReplaced) {
            return;
        }

        const newPokemon = findSidePokemonOrCreateIt(battle, player, event.pokemon.name, event.details, event.condition || activeBeingReplaced.condition);

        // Set new pokemon active
        newPokemon.active = true;
        newPokemon.activeSlot = event.pokemon.slot;

        if (activeBeingReplaced.index !== newPokemon.index) {
            const sidePoke = player.team[activeBeingReplaced.index];

            if (sidePoke) {
                sidePoke.active = false;
            }
        }

        activeBeingReplaced.index = newPokemon.index;

        activeBeingReplaced.ident.name = event.pokemon.name;
        activeBeingReplaced.details = clone(event.details);

        if (event.condition) {
            activeBeingReplaced.condition = clone(event.condition);
        }

        delete activeBeingReplaced.volatilesData.possibleFake; // Revealed
        delete activeBeingReplaced.volatilesData.fake;
    },
    DetailsChange: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_DetailsChange & { type: "DetailsChange"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke) {
            return;
        }

        if (poke.active) {
            poke.active.details = event.details;

            updateStatsOnSpeciesChange(battle, poke.active);

            syncActiveWithSide(poke.player, poke.active);
        } else if (poke.pokemon) {
            poke.pokemon.details = event.details;

            updateStatsOnSpeciesChange(battle, poke.pokemon);
        }
    },
    Faint: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Faint & { type: "Faint"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke) {
            return;
        }

        if (poke.player) {
            poke.player.timesFainted++;
        }

        if (poke.active) {
            poke.active.condition.status = "";
            poke.active.condition.hp = 0;
            poke.active.condition.fainted = true;

            poke.active.volatiles.clear();
            poke.active.volatilesData = {};

            syncActiveWithSide(poke.player, poke.active);
        }

        if (poke.pokemon) {
            poke.pokemon.condition.status = "";
            poke.pokemon.condition.hp = 0;
            poke.pokemon.condition.fainted = true;

            poke.pokemon.active = false;
        }
    },
    Swap: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Swap & { type: "Swap"; }): void {
        const player = battle.players.get(event.pokemon.playerIndex);

        if (!player) {
            return;
        }

        const slotA = event.pokemon.slot;
        const slotB = event.slot;

        const activeA = player.active.get(slotA);
        const activeB = player.active.get(slotB);

        if (activeA) {
            activeA.slot = slotB;

            const sidePoke = player.team[activeA.index];

            if (sidePoke) {
                sidePoke.activeSlot = activeA.slot;
            }

            player.active.set(slotB, activeA);
        } else {
            player.active.delete(slotB);
        }

        if (activeB) {
            activeB.slot = slotA;

            const sidePoke = player.team[activeB.index];

            if (sidePoke) {
                sidePoke.activeSlot = activeB.slot;
            }

            player.active.set(slotA, activeB);
        } else {
            player.active.delete(slotA);
        }
    },
    Move: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Move & { type: "Move"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        // Reset single move statuses
        poke.active.singleMoveStatuses.clear();

        const moveName = event.move;
        const moveId = toId(moveName);

        const fromEffect = event.fromEffect;

        let move: PokemonMove;

        if (poke.active.volatiles.has(VolatileStatuses.Transform)) {
            if (poke.active.volatilesData.transformedInfo && moveId) {
                if (poke.active.volatilesData.transformedInfo.moves.has(moveId)) {
                    move = poke.active.volatilesData.transformedInfo.moves.get(moveId);
                } else {
                    move = {
                        id: moveId,
                        revealed: true,
                        pp: 5,
                        maxPP: 5,
                        disabled: false,
                    };
                    poke.active.volatilesData.transformedInfo.moves.set(moveId, move);
                }
            } else {
                move = {
                    id: moveId,
                    revealed: true,
                    pp: 5,
                    maxPP: 5,
                    disabled: false,
                };
            }
        } else if (!poke.active.moves.has(moveId)) {
            const pp = getMaxPPFromBasePP(getMoveBasePP(battle.status.gen, moveId));

            move = {
                id: moveId,
                revealed: true,
                pp: pp,
                maxPP: pp,
                disabled: false,
            };

            if (!fromEffect || compareIds(fromEffect.id, "Sleep Talk")) {
                // Remember move
                poke.active.moves.set(moveId, move);
            }
        } else {
            move = poke.active.moves.get(moveId);
        }

        move.revealed = true;

        const target = findPokemonInBattle(battle, event.target);
        const spreadTargets = (event.spread || []).map(t => {
            return findPokemonInBattle(battle, event.target);
        });

        const actualTargetsToHit: BattleActivePokemon[] = [];

        if (target && target.active && target.active !== poke.active) {
            actualTargetsToHit.push(target.active);
        }

        for (const st of spreadTargets) {
            if (st && st.active && st.active !== poke.active) {
                actualTargetsToHit.push(st.active);
            }
        }

        // Deduct pp
        move.pp = Math.max(0, move.pp - 1);

        for (const th of actualTargetsToHit) {
            if (compareIds(th.ability.ability, "Pressure") && abilityIsEnabled(battle, th)) {
                // Deduct extra PP
                move.pp = Math.max(0, move.pp - 1);
            }
        }

        if (poke.active.lastMove !== move.id) {
            poke.active.timesUsedMoveInARow = 1;
        } else {
            poke.active.timesUsedMoveInARow * (poke.active.timesUsedMoveInARow || 0) + 1;
        }

        poke.active.lastMove = move.id;

        if (compareIds(move.id, "Wish")) {
            poke.player.sideConditions.set(SideConditions.Wish, {
                id: SideConditions.Wish,
                turn: battle.turn,
                setBy: event.pokemon,
                estimatedDuration: 1,
                counter: 1,
            });
        } else if (compareIds(move.id, "Healing Wish")) {
            poke.player.sideConditions.set(SideConditions.HealingWish, {
                id: SideConditions.HealingWish,
                turn: battle.turn,
                setBy: event.pokemon,
                estimatedDuration: 1,
                counter: 1,
            });
        } else if (compareIds(move.id, "Lunar Dance")) {
            poke.player.sideConditions.set(SideConditions.LunarDance, {
                id: SideConditions.LunarDance,
                turn: battle.turn,
                setBy: event.pokemon,
                estimatedDuration: 1,
                counter: 1,
            });
        } else if (compareIds(move.id, "Baton Pass")) {
            poke.active.singleTurnStatuses.add(SingleTurnStatuses.BatonPass);
        } else if (compareIds(move.id, "Shed Tail")) {
            poke.active.singleTurnStatuses.add(SingleTurnStatuses.ShedTail);
        }

        analyzer.currentMove = move;
        analyzer.currentMoveUser = poke.active;
        analyzer.currentMoveTargets = actualTargetsToHit;

        analyzer.currentMoveTargetsDamage.clear();

        for (const targetToHit of actualTargetsToHit) {
            analyzer.currentMoveTargetsDamage.set(`p${targetToHit.ident.playerIndex}-${targetToHit.slot}`, {
                receivedMove: false,
                immune: false,
                crit: false,
                miss: false,
                damageDealt: 0
            });
        }
    },
    MoveCannotUse: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_MoveCannotUse & { type: "MoveCannotUse"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        // Reset single move statuses
        poke.active.singleMoveStatuses.clear();

        if (event.effect.id === "slp") {
            poke.active.volatilesData.burnedSleepTurns = (poke.active.volatilesData.burnedSleepTurns || 0) + 1;
            poke.active.totalBurnedSleepTurns++;
        }

        const moveId = toId(event.move);

        if (poke.active.volatiles.has(VolatileStatuses.Transform)) {
            if (poke.active.volatilesData.transformedInfo && moveId && !poke.active.volatilesData.transformedInfo.moves.has(moveId)) {
                poke.active.volatilesData.transformedInfo.moves.set(moveId, {
                    id: moveId,
                    revealed: true,
                    pp: 5,
                    maxPP: 5,
                    disabled: false,
                });
            }
        } else if (moveId && !poke.active.moves.has(moveId)) {
            const pp = getMaxPPFromBasePP(getMoveBasePP(battle.status.gen, moveId));

            poke.active.moves.set(moveId, {
                id: moveId,
                revealed: true,
                pp: pp,
                maxPP: pp,
                disabled: false,
            });
        }
    },
    BattleEnded: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_BattleEnded & { type: "BattleEnded"; }): void {
        battle.ended = true;

        // Determine winner
        if (!event.tie && event.winner) {
            for (const player of battle.players.values()) {
                if (compareIds(player.name, event.winner)) {
                    battle.winner = player.index;
                    break;
                }
            }
        }
    }
};
