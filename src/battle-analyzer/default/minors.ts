// Minor events analyzer

"use strict";

import { DefaultBattleAnalyzer } from ".";
import { Battle, BattleEventMinor, BattleEvent_AbilityReveal, BattleEvent_ActivateEffect, BattleEvent_Block, BattleEvent_Boost, BattleEvent_ClearAllBoosts, BattleEvent_ClearBoost, BattleEvent_ClearNegativeBoost, BattleEvent_ClearPositiveBoost, BattleEvent_CopyBoost, BattleEvent_CriticalHit, BattleEvent_CureStatus, BattleEvent_CureTeam, BattleEvent_Damage, BattleEvent_EffectEnd, BattleEvent_EffectStart, BattleEvent_Fail, BattleEvent_FieldEnd, BattleEvent_FieldStart, BattleEvent_FormeChange, BattleEvent_Heal, BattleEvent_Immune, BattleEvent_InvertBoost, BattleEvent_ItemRemove, BattleEvent_ItemReveal, BattleEvent_MegaEvolution, BattleEvent_Miss, BattleEvent_MoveStatus, BattleEvent_MustRecharge, BattleEvent_PrepareMove, BattleEvent_ResistedHit, BattleEvent_SetBoost, BattleEvent_SetHP, BattleEvent_SideEnd, BattleEvent_SideStart, BattleEvent_Status, BattleEvent_SuperEffectiveHit, BattleEvent_SwapBoost, BattleEvent_SwapSideConditions, BattleEvent_Terastallize, BattleEvent_Transform, BattleEvent_TurnStatus, BattleEvent_UltraBurst, BattleEvent_UnBoost, BattleEvent_Weather, PokemonStatus, SideConditions, SingleMoveStatuses, SingleTurnStatuses, VolatileStatuses } from "../../battle-data";
import { findPokemonInBattle } from "../../battle-helpers";
import { abilityIsEnabled, moveBreaksAbility } from "../../battle-helpers/ability";
import { findMove } from "../../battle-helpers/move-data-find";
import { getPokemonCurrentTypes, updateStatsOnSpeciesChange } from "../../battle-helpers/pokemon";
import { getHPPercent } from "../../showdown-battle-parser/parser-utils";
import { clone } from "../../utils/clone";
import { compareIds, toId } from "../../utils/id";
import { detectIllusionFromDamageMoveImmunity, detectIllusionFromPrankster } from "./illusion";

export const MinorEventsAnalyzer: { [eventType in BattleEventMinor["type"]]: (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEventMinor & { type: eventType }) => void } = {
    Damage: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Damage & { type: "Damage"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke) {
            return;
        }

        if (poke.active) {
            const hpDiff = getHPPercent(poke.active.condition) - getHPPercent(event.condition);

            poke.active.condition = clone(event.condition);

            if (event.fromEffect) {
                if (compareIds(event.fromEffect.id, "psn")) {
                    poke.active.volatilesData.toxDamageTimes = (poke.active.volatilesData.toxDamageTimes || 0) + 1;
                }
            } else if (analyzer.currentMove) {
                poke.active.timesHit++;
                delete poke.active.volatilesData.possibleFake; // Cannot be fake (Illusion breaks on hit)
                delete poke.active.volatilesData.fake; // Cannot be fake (Illusion breaks on hit)

                const targetId = `p${event.pokemon.playerIndex}-${event.pokemon.slot}`;

                if (analyzer.currentMove && analyzer.currentMoveTargetsDamage.has(targetId)) {
                    const hitData = analyzer.currentMoveTargetsDamage.get(targetId);

                    if (!hitData.receivedMove) {
                        hitData.receivedMove = true;
                        hitData.damageDealt = hpDiff;
                    }
                }
            }
        } else if (poke.pokemon) {
            poke.pokemon.condition = clone(event.condition);
        }
    },
    Heal: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Heal & { type: "Heal"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke) {
            return;
        }

        if (poke.active) {
            poke.active.condition = clone(event.condition);

            if (event.fromEffect) {
                if (compareIds(event.fromEffect.id, "Lunar Dance")) {
                    // Also restores all PP
                    for (const move of poke.active.moves.values()) {
                        move.pp = move.maxPP;
                    }
                    poke.player.sideConditions.delete(SideConditions.LunarDance);
                } else if (compareIds(event.fromEffect.id, "Healing Wish")) {
                    poke.player.sideConditions.delete(SideConditions.HealingWish);
                } else if (compareIds(event.fromEffect.id, "Wish")) {
                    poke.player.sideConditions.delete(SideConditions.Wish);
                }
            }
        } else if (poke.pokemon) {
            poke.pokemon.condition = clone(event.condition);
        }
    },
    SetHP: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_SetHP & { type: "SetHP"; }): void {
        for (const target of event.targets) {
            const poke = findPokemonInBattle(battle, target.pokemon);

            if (!poke) {
                continue;
            }

            if (poke.active) {
                poke.active.condition = clone(target.condition);
            } else if (poke.pokemon) {
                poke.pokemon.condition = clone(target.condition);
            }
        }
    },
    Boost: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Boost & { type: "Boost"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        const currentBoost = poke.active.boosts.get(event.stat) || 0;

        poke.active.boosts.set(event.stat, currentBoost + event.amount);
    },
    UnBoost: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_UnBoost & { type: "UnBoost"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        const currentBoost = poke.active.boosts.get(event.stat) || 0;

        poke.active.boosts.set(event.stat, currentBoost - event.amount);
    },
    SetBoost: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_SetBoost & { type: "SetBoost"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.boosts.set(event.stat, event.amount);
    },
    SwapBoost: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_SwapBoost & { type: "SwapBoost"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        const target = findPokemonInBattle(battle, event.target);

        if (!target || !target.active) {
            return;
        }

        event.stats.forEach(stat => {
            const statPoke = poke.active.boosts.get(stat) || 0;
            const statTarget = target.active.boosts.get(stat) || 0;

            // Swap boosts
            poke.active.boosts.set(stat, statTarget);
            target.active.boosts.set(stat, statPoke);
        });
    },
    CopyBoost: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_CopyBoost & { type: "CopyBoost"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        const target = findPokemonInBattle(battle, event.fromPokemon);

        if (!target || !target.active) {
            return;
        }

        event.stats.forEach(stat => {
            const statTarget = target.active.boosts.get(stat) || 0;

            // Copy boost
            poke.active.boosts.set(stat, statTarget);
        });
    },
    InvertBoost: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_InvertBoost & { type: "InvertBoost"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.boosts.forEach((val, stat) => {
            // Invert boost
            poke.active.boosts.set(stat, (-1) * val);
        });
    },
    ClearPositiveBoost: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_ClearPositiveBoost & { type: "ClearPositiveBoost"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.boosts.forEach((val, stat) => {
            // Clear boost if positive
            if (val > 0) {
                poke.active.boosts.set(stat, 0);
            }
        });
    },
    ClearNegativeBoost: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_ClearNegativeBoost & { type: "ClearNegativeBoost"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.boosts.forEach((val, stat) => {
            // Clear boost if negative
            if (val < 0) {
                poke.active.boosts.set(stat, 0);
            }
        });
    },
    ClearBoost: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_ClearBoost & { type: "ClearBoost"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.boosts.clear();
    },
    ClearAllBoosts: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_ClearAllBoosts & { type: "ClearAllBoosts"; }): void {
        for (const player of battle.players.values()) {
            for (const active of player.active.values()) {
                active.boosts.clear();
            }
        }
    },
    CriticalHit: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_CriticalHit & { type: "CriticalHit"; }): void {
        const targetId = `p${event.pokemon.playerIndex}-${event.pokemon.slot}`;

        if (analyzer.currentMove && analyzer.currentMoveTargetsDamage.has(targetId)) {
            const hitData = analyzer.currentMoveTargetsDamage.get(targetId);

            if (!hitData.receivedMove) {
                hitData.crit = true;
            }
        }
    },
    SuperEffectiveHit: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_SuperEffectiveHit & { type: "SuperEffectiveHit"; }): void {
        return;
    },
    ResistedHit: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_ResistedHit & { type: "ResistedHit"; }): void {
        return;
    },
    Immune: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Immune & { type: "Immune"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        const targetId = `p${event.pokemon.playerIndex}-${event.pokemon.slot}`;

        if (analyzer.currentMove && analyzer.currentMoveTargetsDamage.has(targetId)) {
            const hitData = analyzer.currentMoveTargetsDamage.get(targetId);

            if (!hitData.receivedMove) {
                hitData.receivedMove = true;
                hitData.immune = true;

                // This can be used to test for Illusion

                const moveData = findMove(battle.status.gen, analyzer.currentMove.id);

                if (event.fromEffect) {
                    if (event.fromEffect.kind === "ability") {
                        if (!abilityIsEnabled(battle, poke.active) || moveBreaksAbility(battle, analyzer.currentMoveUser, poke.active, moveData)) {
                            // This user is holding an ability shield
                            analyzer.debug(`Ability Shield detected on Player[${poke.player.index}] - Active[${poke.active.slot}]`);
                            poke.active.item.known = true;
                            poke.active.item.item = toId("Ability Shield");
                        }
                    }
                } else if (moveData.category !== "Status") {
                    detectIllusionFromDamageMoveImmunity(
                        analyzer,
                        battle,
                        battle.players.get(analyzer.currentMoveUser.ident.playerIndex),
                        analyzer.currentMoveUser,
                        poke.player,
                        poke.active,
                        analyzer.currentMove.id,
                    );
                } else {
                    // Detect illusion from some status immune interactions
                    // Example: Prankster + Zoroark
                    if (compareIds(poke.active.ability.ability, "Prankster") && abilityIsEnabled(battle, poke.active)) {
                        // Status move has priority
                        detectIllusionFromPrankster(
                            analyzer,
                            battle,
                            battle.players.get(analyzer.currentMoveUser.ident.playerIndex),
                            analyzer.currentMoveUser,
                            poke.player,
                            poke.active,
                            analyzer.currentMove.id,
                        );
                    }
                }
            }
        }
    },
    Miss: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Miss & { type: "Miss"; }): void {
        const targetId = `p${event.target.playerIndex}-${event.target.slot}`;

        if (analyzer.currentMove && analyzer.currentMoveTargetsDamage.has(targetId)) {
            const hitData = analyzer.currentMoveTargetsDamage.get(targetId);

            if (!hitData.receivedMove) {
                hitData.receivedMove = true;
                hitData.miss = true;
            }
        }
    },
    Fail: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Fail & { type: "Fail"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        if (!event.fromEffect && analyzer.currentMove && analyzer.currentMoveTargets.length === 1) {
            switch (toId(analyzer.currentMove.id)) {
                case "trick":
                case "switcheroo":
                case "corrosivegas":
                    poke.active.item.trickMoveFailed = true;
                    break;
                case "poltergeist":
                    poke.active.item.known = true;
                    poke.active.item.revealed = true;
                    poke.active.item.item = "";
                    break;
                case "skillswap":
                    poke.active.ability.cannotBeSwapped = true;
                    break;
                case "entrainment":
                case "simplebeam":
                case "worryseed":
                    poke.active.ability.cannotBeChanged = true;
                    break;
                case "gastroacid":
                    poke.active.ability.cannotBeDisabled = true;
                    break;
            }
        }
    },
    Block: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Block & { type: "Block"; }): void {
        if (event.effect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.effect);
        }
    },
    PrepareMove: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_PrepareMove & { type: "PrepareMove"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        // Move revealed
        analyzer.rememberMove(poke.active, event.move);
    },
    MustRecharge: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_MustRecharge & { type: "MustRecharge"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.singleMoveStatuses.add(SingleMoveStatuses.MustRecharge);
    },
    Status: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Status & { type: "Status"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.condition.status = event.status;

        if (event.status === "SLP") {
            poke.active.volatilesData.burnedSleepTurns = 0;
            poke.active.totalBurnedSleepTurns = 0;
            poke.active.sleptByRest = event.fromEffect && event.fromEffect.id === "rest";
        } else if (event.status === "PSN" || event.status === "TOX") {
            poke.active.volatilesData.toxDamageTimes = 0;
        }
    },
    CureStatus: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_CureStatus & { type: "CureStatus"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke) {
            return;
        }

        if (poke.active) {
            if (event.status === ("CONFUSION" as PokemonStatus)) {
                poke.active.volatiles.delete(VolatileStatuses.Confusion);
            } else {
                poke.active.condition.status = "";
            }
        } else if (poke.pokemon) {
            poke.pokemon.condition.status = "";
        }
    },
    CureTeam: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_CureTeam & { type: "CureTeam"; }): void {
        const player = battle.players.get(event.playerIndex);

        if (!player) {
            return;
        }

        for (const poke of player.team) {
            poke.condition.status = "";
        }

        for (const active of player.active.values()) {
            active.condition.status = "";
        }
    },
    ItemReveal: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_ItemReveal & { type: "ItemReveal"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.item.known = true;
        poke.active.item.revealed = true;
        poke.active.item.item = event.item;

        if (compareIds(event.item, VolatileStatuses.AirBalloon)) {
            poke.active.volatiles.add(VolatileStatuses.AirBalloon);
        }

        if (event.fromEffect) {
            switch (event.fromEffect.id) {
                case 'thief':
                case 'covet':
                    if (event.ofPokemon) {
                        const target = findPokemonInBattle(battle, event.ofPokemon);

                        if (target && target.active) {
                            target.active.item = {
                                known: true,
                                revealed: true,
                                item: '',
                                itemLostCause: "stolen",
                                previousItem: event.item,
                            };
                        }
                    }
                    break;
            }
        }
    },
    ItemRemove: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_ItemRemove & { type: "ItemRemove"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.item.known = true;
        poke.active.item.revealed = true;
        poke.active.item.item = '';
        poke.active.item.previousItem = event.item;

        poke.active.volatiles.delete(VolatileStatuses.AirBalloon);

        if (event.eaten) {
            poke.active.item.itemLostCause = "eaten";
        } else if (event.fromEffect) {
            switch (event.fromEffect.id) {
                case 'fling':
                    poke.active.item.itemLostCause = 'flung';
                    break;
                case 'knockoff':
                    poke.active.item.itemLostCause = 'knocked off';
                    break;
                case 'stealeat':
                    poke.active.item.itemLostCause = 'stolen';
                    break;
                case 'gem':
                    poke.active.item.itemLostCause = 'consumed';
                    break;
                case 'incinerate':
                    poke.active.item.itemLostCause = 'incinerated';
                    break;
            }
        } else {
            switch (toId(event.item)) {
                case 'airballoon':
                    poke.active.item.itemLostCause = "popped";
                    break;
                case 'focusband':
                    break;
                case 'redcard':
                    poke.active.item.itemLostCause = "held up";
                    break;
                default:
                    poke.active.item.itemLostCause = "consumed";
            }
        }
    },
    AbilityReveal: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_AbilityReveal & { type: "AbilityReveal"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.ability.known = true;
        poke.active.ability.revealed = true;
        poke.active.ability.ability = event.ability;

        if (!poke.active.ability.baseAbility) {
            poke.active.ability.baseAbility = event.ability;
        }

        poke.active.ability.activationCount++;
    },
    Transform: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Transform & { type: "Transform"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        const target = findPokemonInBattle(battle, event.target);

        if (!target || !target.active) {
            return;
        }

        poke.active.boosts = clone(target.active.boosts);

        if (target.active.ability.known) {
            poke.active.ability.known = true;
            poke.active.ability.revealed = true;
            poke.active.ability.ability = target.active.ability.ability;
        }

        poke.active.volatiles.add(VolatileStatuses.Transform);

        poke.active.volatilesData.transformedInfo = {
            playerIndex: target.player.index,
            pokemonIndex: target.active.index,
            details: clone(target.active.details),
            stats: clone(target.active.stats),
            moves: clone(target.active.moves),
        };
    },
    FormeChange: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_FormeChange & { type: "FormeChange"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.details.species = event.species;

        updateStatsOnSpeciesChange(battle, poke.active);
    },
    MegaEvolution: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_MegaEvolution & { type: "MegaEvolution"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.item.known = true;
        poke.active.item.revealed = true;
        poke.active.item.item = event.stone;
    },
    UltraBurst: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_UltraBurst & { type: "UltraBurst"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.item.known = true;
        poke.active.item.revealed = true;
        poke.active.item.item = event.item;
    },
    Terastallize: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Terastallize & { type: "Terastallize"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.details.terastallized = toId(event.teraType);
    },
    EffectStart: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_EffectStart & { type: "EffectStart"; }): void {
        analyzer.markItemOrAbility(event.pokemon, event.effect);

        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.ofPokemon || event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        const effect = event.effect;

        if (effect.id !== 'typechange' || !poke.active.details.terastallized) {
            switch (effect.id) {
                case 'typechange':
                    if (event.ofPokemon && event.fromEffect && event.fromEffect.id === "reflecttype") {
                        const target = findPokemonInBattle(battle, event.ofPokemon);

                        if (target && target.active) {
                            poke.active.volatilesData.typesChanged = getPokemonCurrentTypes(battle, target.active);
                        }
                    } else if (event.extraData.typesChanged) {
                        poke.active.volatilesData.typesChanged = event.extraData.typesChanged.slice();
                    }
                    poke.active.volatiles.add(effect.id);
                    break;
                case 'typeadd':
                    poke.active.volatilesData.typeAdded = event.extraData.typeAdded;
                    poke.active.volatiles.add(effect.id);
                    break;
                case 'mimic':
                    poke.active.volatilesData.moveMimic = event.extraData.moveMimic;
                    poke.active.volatiles.add(effect.id);
                    break;
                case 'disable':
                    poke.active.volatilesData.moveDisabled = event.extraData.moveDisabled;
                    poke.active.volatiles.add(effect.id);
                    break;
                case 'stockpile1':
                    poke.active.volatilesData.stockpileLevel = 1;
                    poke.active.volatiles.add(VolatileStatuses.Stockpile);
                    break;
                case 'stockpile2':
                    poke.active.volatilesData.stockpileLevel = 2;
                    poke.active.volatiles.add(VolatileStatuses.Stockpile);
                    break;
                case 'stockpile3':
                    poke.active.volatilesData.stockpileLevel = 3;
                    poke.active.volatiles.add(VolatileStatuses.Stockpile);
                    break;
                case 'perish0':
                    poke.active.volatilesData.perishTurnsLeft = 0;
                    poke.active.volatiles.add(VolatileStatuses.PerishSong);
                    break;
                case 'perish1':
                    poke.active.volatilesData.perishTurnsLeft = 1;
                    poke.active.volatiles.add(VolatileStatuses.PerishSong);
                    break;
                case 'perish2':
                    poke.active.volatilesData.perishTurnsLeft = 2;
                    poke.active.volatiles.add(VolatileStatuses.PerishSong);
                    break;
                case 'perish3':
                    poke.active.volatilesData.perishTurnsLeft = 3;
                    poke.active.volatiles.add(VolatileStatuses.PerishSong);
                    break;
                case 'smackdown':
                    poke.active.volatiles.delete(VolatileStatuses.MagnetRise);
                    poke.active.volatiles.delete(VolatileStatuses.Telekinesis);
                    poke.active.volatiles.add(effect.id);
                    break;
                case 'protosynthesisatk':
                    poke.active.volatilesData.boostedStat = 'atk';
                    poke.active.volatiles.add(VolatileStatuses.ProtoSynthesis);
                    break;
                case 'protosynthesisdef':
                    poke.active.volatilesData.boostedStat = 'def';
                    poke.active.volatiles.add(VolatileStatuses.ProtoSynthesis);
                    break;
                case 'protosynthesisspa':
                    poke.active.volatilesData.boostedStat = 'spa';
                    poke.active.volatiles.add(VolatileStatuses.ProtoSynthesis);
                    break;
                case 'protosynthesisspd':
                    poke.active.volatilesData.boostedStat = 'spd';
                    poke.active.volatiles.add(VolatileStatuses.ProtoSynthesis);
                    break;
                case 'protosynthesisspe':
                    poke.active.volatilesData.boostedStat = 'spe';
                    poke.active.volatiles.add(VolatileStatuses.ProtoSynthesis);
                    break;
                case 'quarkdriveatk':
                    poke.active.volatilesData.boostedStat = 'atk';
                    poke.active.volatiles.add(VolatileStatuses.QuarkDrive);
                    break;
                case 'quarkdrivedef':
                    poke.active.volatilesData.boostedStat = 'def';
                    poke.active.volatiles.add(VolatileStatuses.QuarkDrive);
                    break;
                case 'quarkdrivespa':
                    poke.active.volatilesData.boostedStat = 'spa';
                    poke.active.volatiles.add(VolatileStatuses.QuarkDrive);
                    break;
                case 'quarkdrivespd':
                    poke.active.volatilesData.boostedStat = 'spd';
                    poke.active.volatiles.add(VolatileStatuses.QuarkDrive);
                    break;
                case 'quarkdrivespe':
                    poke.active.volatilesData.boostedStat = 'spe';
                    poke.active.volatiles.add(VolatileStatuses.QuarkDrive);
                    break;
                case 'doomdesire':
                    poke.player.sideConditions.set(SideConditions.DoomDesire, {
                        id: SideConditions.DoomDesire,
                        counter: 1,
                        turn: battle.turn,
                        estimatedDuration: 2,
                        setBy: event.pokemon,
                    });
                    break;
                case 'futuresight':
                    poke.player.sideConditions.set(SideConditions.FutureSight, {
                        id: SideConditions.FutureSight,
                        counter: 1,
                        turn: battle.turn,
                        estimatedDuration: 2,
                        setBy: event.pokemon,
                    });
                    break;
                default:
                    if ((/^fallen[0-9]+$/).test(effect.id)) {
                        poke.active.volatilesData.fallenLevel = parseInt(effect.id.substring(6), 10) || 0;
                        poke.active.volatiles.add(VolatileStatuses.Fallen);
                    } else {
                        poke.active.volatiles.add(effect.id);
                    }
            }
        }
    },
    EffectEnd: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_EffectEnd & { type: "EffectEnd"; }): void {
        if (event.fromEffect) {
            analyzer.markItemOrAbility(event.pokemon, event.fromEffect);
        }

        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        const effect = event.effect;

        switch (effect.id) {
            case "stockpile":
                poke.active.volatiles.delete(VolatileStatuses.Stockpile);
                break;
            case "perishsong":
                poke.active.volatiles.delete(VolatileStatuses.PerishSong);
                break;
            case 'doomdesire':
                poke.player.sideConditions.delete(SideConditions.DoomDesire);
                break;
            case 'futuresight':
                poke.player.sideConditions.delete(SideConditions.FutureSight);
                break;
            default:
                poke.active.volatiles.delete(effect.id);
        }
    },
    TurnStatus: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_TurnStatus & { type: "TurnStatus"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.singleTurnStatuses.add(event.effect.id);
    },
    MoveStatus: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_MoveStatus & { type: "MoveStatus"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        poke.active.singleMoveStatuses.add(event.effect.id);
    },
    ActivateEffect: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_ActivateEffect & { type: "ActivateEffect"; }): void {
        const poke = findPokemonInBattle(battle, event.pokemon);

        if (!poke || !poke.active) {
            return;
        }

        const effect = event.effect;
        const target = event.target ? findPokemonInBattle(battle, event.target) : null;

        analyzer.markItemOrAbility(event.pokemon, effect);

        switch (effect.id) {
            case 'poltergeist':
                if (event.extraData.item) {
                    poke.active.item.known = true;
                    poke.active.item.revealed = true;
                    poke.active.item.item = event.extraData.item;
                }
                break;
            case "grudge":
                if (event.extraData.move) {
                    const move = analyzer.rememberMove(poke.active, event.extraData.move);
                    move.pp = 0;
                }
                break;
            case 'brickbreak':
                if (target && target.player) {
                    target.player.sideConditions.delete(SideConditions.Reflect);
                    target.player.sideConditions.delete(SideConditions.LightScreen);
                }
                break;
            case 'hyperdrill':
            case 'hyperspacefury':
            case 'hyperspacehole':
            case 'phantomforce':
            case 'shadowforce':
            case 'feint':
                poke.active.singleTurnStatuses.delete(SingleTurnStatuses.Protect);
                for (const active of poke.player.active.values()) {
                    active.singleTurnStatuses.delete(SingleTurnStatuses.WideGuard);
                    active.singleTurnStatuses.delete(SingleTurnStatuses.QuickGuard);
                    active.singleTurnStatuses.delete(SingleTurnStatuses.CraftyShield);
                    active.singleTurnStatuses.delete(SingleTurnStatuses.MatBlock);
                }
                break;
            case 'eeriespell':
            case 'gmaxdepletion':
            case 'spite':
                if (event.extraData.move) {
                    const move = analyzer.rememberMove(poke.active, event.extraData.move);
                    move.pp = Math.max(0, move.pp - (event.extraData.number || 4));
                }
                break;
            case 'gravity':
                poke.active.volatiles.delete(VolatileStatuses.MagnetRise);
                poke.active.volatiles.delete(VolatileStatuses.Telekinesis);
                break;
            case 'skillswap':
            case 'wanderingspirit':
                if (battle.status.gen > 4) {
                    const pokeAbility = event.extraData.ability || ((target && target.active) ? target.active.ability.ability : "");
                    const targetAbility = event.extraData.ability2 || poke.active.ability.ability;

                    if (pokeAbility) {
                        poke.active.ability.known = true;
                        poke.active.ability.revealed = true;
                        poke.active.ability.ability = pokeAbility;

                        if (target && target.active && !target.active.ability.baseAbility) {
                            target.active.ability.baseAbility = pokeAbility;
                        }
                    }

                    if (targetAbility) {
                        if (target && target.active) {
                            target.active.ability.known = true;
                            target.active.ability.revealed = true;
                            target.active.ability.ability = targetAbility;
                        }

                        if (!poke.active.ability.baseAbility) {
                            poke.active.ability.baseAbility = targetAbility;
                        }
                    }
                }
                break;
            case 'electromorphosis':
            case 'windpower':
                poke.active.singleMoveStatuses.add(SingleMoveStatuses.Charge);
                break;
            case 'forewarn':
                if (event.extraData.move) {
                    if (target && target.active) {
                        analyzer.rememberMove(poke.active, event.extraData.move);
                    }
                }
                break;
            case 'lingeringaroma':
            case 'mummy':
                if (event.extraData.ability) {
                    if (target && target.active) {
                        target.active.ability.known = true;
                        target.active.ability.revealed = true;
                        target.active.ability.ability = effect.id;

                        if (!target.active.ability.baseAbility) {
                            target.active.ability.baseAbility = event.extraData.ability;
                        }
                    }
                }
                break;
            case 'leppaberry':
                if (event.extraData.move) {
                    const move = analyzer.rememberMove(poke.active, event.extraData.move);
                    move.pp = Math.min(move.maxPP, move.pp + 10);
                }
                break;
            case 'mysteryberry':
                if (event.extraData.move) {
                    const move = analyzer.rememberMove(poke.active, event.extraData.move);
                    move.pp = Math.min(move.maxPP, move.pp + 5);
                }
                break;
        }
    },
    SideStart: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_SideStart & { type: "SideStart"; }): void {
        const player = battle.players.get(event.playerIndex);

        if (!player) {
            return;
        }

        if (player.sideConditions.has(event.effect.id)) {
            player.sideConditions.get(event.effect.id).counter++;
        } else {

            let estimatedDuration = 0;

            switch (event.effect.id) {
                case 'auroraveil':
                case 'reflect':
                case 'safeguard':
                case 'lightscreen':
                case 'mist':
                case 'luckychant':
                    estimatedDuration = 5;
                    break;
                case 'tailwind':
                case 'gmaxwildfire':
                case 'gmaxvolcalith':
                case 'gmaxvinelash':
                case 'gmaxcannonade':
                case 'grasspledge':
                case 'waterpledge':
                case 'firepledge':
                    estimatedDuration = 4;
                    break;
            }

            if (event.persistent) {
                estimatedDuration += 2;
            }

            player.sideConditions.set(event.effect.id, {
                id: event.effect.id,
                counter: 1,
                turn: battle.turn,
                estimatedDuration: estimatedDuration,
            });
        }


    },
    SideEnd: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_SideEnd & { type: "SideEnd"; }): void {
        const player = battle.players.get(event.playerIndex);

        if (!player) {
            return;
        }

        if (player.sideConditions.has(event.effect.id)) {
            player.sideConditions.delete(event.effect.id);
        }
    },
    SwapSideConditions: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_SwapSideConditions & { type: "SwapSideConditions"; }): void {
        const players = Array.from(battle.players.values());

        if (players.length !== 2) {
            return;
        }

        [
            'mist',
            'lightscreen',
            'reflect',
            'spikes',
            'safeguard',
            'tailwind',
            'toxicspikes',
            'stealthrock',
            'waterpledge',
            'firepledge',
            'grasspledge',
            'stickyweb',
            'auroraveil',
            'gmaxsteelsurge',
            'gmaxcannonade',
            'gmaxvinelash',
            'gmaxwildfire'
        ].forEach(condition => {
            const sideConditionP1 = players[0].sideConditions.get(condition);
            const sideConditionP2 = players[1].sideConditions.get(condition);

            if (sideConditionP1 && sideConditionP2) {
                players[0].sideConditions.set(condition, clone(sideConditionP2));
                players[1].sideConditions.set(condition, clone(sideConditionP1));
            } else if (sideConditionP1) {
                players[0].sideConditions.delete(condition);
                players[1].sideConditions.set(condition, clone(sideConditionP1));
            } else if (sideConditionP2) {
                players[0].sideConditions.set(condition, clone(sideConditionP2));
                players[1].sideConditions.delete(condition);
            }
        });
    },
    Weather: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_Weather & { type: "Weather"; }): void {
        if (event.fromEffect && event.ofPokemon) {
            analyzer.markItemOrAbility(event.ofPokemon, event.fromEffect);
        }

        if (!event.effect.id || event.effect.id === "none") {
            delete battle.status.weather;
        } else {
            battle.status.weather = {
                id: event.effect.id,
                turn: battle.turn,
                setBy: event.ofPokemon,
                estimatedDuration: 5,
            };
        }
    },
    FieldStart: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_FieldStart & { type: "FieldStart"; }): void {
        if (event.fromEffect && event.ofPokemon) {
            analyzer.markItemOrAbility(event.ofPokemon, event.fromEffect);
        }

        let estimatedTime = 5;

        if (event.effect.id.endsWith("terrain") && battle.status.gen > 6) {
            estimatedTime = 8;
        }

        if (event.persistent) {
            estimatedTime += 2;
        }

        battle.status.fields.set(event.effect.id, {
            id: event.effect.id,
            turn: battle.turn,
            estimatedDuration: estimatedTime,
            setBy: event.ofPokemon,
        });
    },
    FieldEnd: function (analyzer: DefaultBattleAnalyzer, battle: Battle, event: BattleEvent_FieldEnd & { type: "FieldEnd"; }): void {
        battle.status.fields.delete(event.effect.id);
    }
};
