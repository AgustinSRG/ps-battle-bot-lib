// Active decision

"use strict";

import { Battle, BattleActivePokemon, BattleGameType, MoveTarget, VolatileStatuses, findActiveByRequestIndex, findActiveSlotByRequestIndex } from "../battle-data";
import { toId } from "../utils";
import { randomlyChoose } from "../utils/random";
import { DecisionSlot } from "./context";
import { PASS_DECISION, SHIFT_DECISION } from "./static-decisions";

/**
 * Active decision
 */
export interface ActiveDecision {
    type: "active";

    /**
     * One sub decision for each active slot
     */
    subDecisions: ActiveSubDecision[];
}

/**
 * Sub decision for each active
 */
export type ActiveSubDecision = MoveSubDecision | SwitchSubDecision | ShiftSubDecision | PassSubDecision;

/**
 * Battle gimmicks
 */
export type MoveGimmick = "mega" | "ultra" | "z-move" | "dynamax" | "max-move" | "tera";

/**
 * Target for the move decision
 */
export interface MoveSubDecisionTarget {
    /**
     * Player to target
     */
    playerIndex: number;

    /**
     * Slot to target
     */
    slot: number;
}

/**
 * Use a move
 */
export interface MoveSubDecision {
    type: "move";

    /**
     * Move to use. Index in the request
     */
    moveIndex: number;

    /**
     * Target
     */
    target?: MoveSubDecisionTarget;

    /**
     * Gimmick to use
     */
    gimmick?: MoveGimmick;
}

/**
 * Switch
 */
export interface SwitchSubDecision {
    type: "switch";

    /**
     * Index of the pokemon to switch (index in the request)
     */
    pokemonIndex: number;
}

/**
 * Shift pokemon with the ally
 */
export interface ShiftSubDecision {
    type: "shift";
}

/**
 * Do nothing
 */
export interface PassSubDecision {
    type: "pass";
}


/**
 * Generates list of available decisions for a given active of the main player in the battle
 * @param battle The Battle
 * @param requestIndex The request index
 * @param forceMegaEvolution Force mega evolution
 * @returns The list of available decisions
 */
export function generateActiveSubDecisions(battle: Battle, requestIndex: number, forceMegaEvolution?: boolean): ActiveSubDecision[] {
    if (battle.mainPlayer === undefined || !battle.request || !battle.request.active || !battle.request.active[requestIndex]) {
        return [];
    }

    const mainPlayer = battle.players.get(battle.mainPlayer);

    if (!mainPlayer) {
        return [];
    }

    const activeRequest = battle.request.active[requestIndex];
    const sideRequest = battle.request.side.pokemon[requestIndex];

    if (!sideRequest || sideRequest.commanding || sideRequest.condition.fainted) {
        return [PASS_DECISION];
    }

    const active = findActiveByRequestIndex(mainPlayer, requestIndex);

    if (!active || active.condition.fainted) {
        return [PASS_DECISION];
    }

    const activeSlot = findActiveSlotByRequestIndex(mainPlayer, requestIndex);

    const result: ActiveSubDecision[] = [];

    // Moves

    for (let moveIndex = 0; moveIndex < activeRequest.moves.length; moveIndex++) {
        const requestMove = activeRequest.moves[moveIndex];

        if (requestMove.disabled || ("pp" in requestMove && requestMove.pp <= 0)) {
            continue; // Cannot use the move
        }

        if (active.volatiles.has(VolatileStatuses.Dynamax)) {
            // The pokemon is dynamaxed, we can only use max moves

            if (!requestMove.maxMove) {
                continue; // Not max move
            }

            const targets = findDecisionTargets(battle, requestMove.maxMove.target, activeSlot);

            for (const target of targets) {
                result.push({
                    type: "move",
                    moveIndex: moveIndex,
                    target: target,
                    gimmick: "max-move",
                });
            }

            continue;
        }

        if (requestMove.maxMove) {
            // Can dynamax

            const targets = findDecisionTargets(battle, requestMove.maxMove.target, activeSlot);

            for (const target of targets) {
                result.push({
                    type: "move",
                    moveIndex: moveIndex,
                    target: target,
                    gimmick: "dynamax",
                });
            }
        }

        if (requestMove.zMove) {
            // Can use Z-Move

            const targets = findDecisionTargets(battle, requestMove.zMove.target, activeSlot);

            for (const target of targets) {
                result.push({
                    type: "move",
                    moveIndex: moveIndex,
                    target: target,
                    gimmick: "z-move",
                });
            }
        }

        const targets = findDecisionTargets(battle, requestMove.target, activeSlot);

        for (const target of targets) {
            // Regular move (No Gimmick)
            if (!forceMegaEvolution || !activeRequest.canMegaEvo) {
                result.push({
                    type: "move",
                    moveIndex: moveIndex,
                    target: target,
                });
            }

            // Terastal
            if (activeRequest.canTerastallize) {
                result.push({
                    type: "move",
                    moveIndex: moveIndex,
                    target: target,
                    gimmick: "tera",
                });
            }

            // Ultra burst
            if (activeRequest.canUltraBurst) {
                result.push({
                    type: "move",
                    moveIndex: moveIndex,
                    target: target,
                    gimmick: "ultra",
                });
            }

            // Mega evolution
            if (activeRequest.canMegaEvo) {
                result.push({
                    type: "move",
                    moveIndex: moveIndex,
                    target: target,
                    gimmick: "mega",
                });
            }
        }
    }

    // Switches

    if (!activeRequest.trapped) {
        for (let pokemonIndex = 0; pokemonIndex < battle.request.side.pokemon.length; pokemonIndex++) {
            const pokemon = battle.request.side.pokemon[pokemonIndex];

            if (pokemon.active || pokemon.condition.fainted) {
                continue; // We cannot switch into an active or fainted pokemon
            }

            result.push({
                type: "switch",
                pokemonIndex: pokemonIndex,
            });
        }
    }

    // Shift

    if (battle.status.gameType === "triples") {
        result.push(SHIFT_DECISION);
    }

    return result;
}

/**
 * Checks if the target is too far away
 * @param gameType The battle game type
 * @param player Player index
 * @param pokeSlot Pokemon slot
 * @param targetPlayer Target player
 * @param targetSlot Target slot 
 * @returns True if the target is too far away
 */
export function targetIsFarAway(gameType: BattleGameType, player: number, pokeSlot: number, targetPlayer: number, targetSlot: number): boolean {
    if (gameType === "triples") {
        if (player === targetPlayer) {
            return Math.abs(pokeSlot - targetSlot) > 0;
        } else {
            return (pokeSlot === 0 && targetSlot === 0) || (pokeSlot === 2 && targetSlot === 2);
        }
    }

    return false;
}

/**
 * Checks if the players are allies
 * @param gameType The game type
 * @param player The player
 * @param targetPlayer The target player
 * @returns True if they are allies
 */
export function playersAreAllies(gameType: BattleGameType, player: number, targetPlayer: number): boolean {
    if (gameType === "multi") {
        const teamA = player % 2;
        const teamB = targetPlayer % 2;

        return teamA === teamB;
    }

    return false;
}


/**
 * Checks if the players are in the4 same side (for free for all or multi game types)
 * @param gameType The game type
 * @param player The player
 * @param targetPlayer The target player
 * @returns True if they are allies
 */
export function playersAreAdjacent(gameType: BattleGameType, player: number, targetPlayer: number): boolean {
    if (gameType === "multi" || gameType === "freeforall") {
        const teamA = player % 2;
        const teamB = targetPlayer % 2;

        return teamA === teamB;
    }

    return false;
}

/**
 * Finds list of available targets
 * @param battle The battle
 * @param target The target type of the move
 * @param activeSlot The slot of the pokemon using the move
 * @returns The list of targets
 */
export function findDecisionTargets(battle: Battle, target: MoveTarget, activeSlot: number): (MoveSubDecisionTarget | null)[] {
    // Normal target moves
    if (target === "normal") {
        const result: MoveSubDecisionTarget[] = [];
        let fallbackTarget: MoveSubDecisionTarget;

        for (const [playerIndex, player] of battle.players) {
            for (const [slot, active] of player.active) {
                if (playerIndex === battle.mainPlayer) {
                    // Target our own pokemon
                    if (slot === activeSlot) {
                        continue; // Normal moves cannot target self
                    }
                }

                if (targetIsFarAway(battle.status.gameType, battle.mainPlayer, activeSlot, playerIndex, slot)) {
                    continue; // Too far away
                }

                if (!fallbackTarget) {
                    fallbackTarget = {
                        playerIndex: playerIndex,
                        slot: slot,
                    };
                }

                if (active.condition.fainted) {
                    continue; // We cannot target fainted pokemon
                }

                result.push({
                    playerIndex: playerIndex,
                    slot: slot,
                });
            }
        }

        if (result.length === 0 && fallbackTarget) {
            // If every single target is fainted, we can target a fainted slot
            // This always fails, but progresses the battle as it consumes PP
            result.push(fallbackTarget);
        }

        return result;
    }

    // Target adjacent foe
    if (target === "adjacentFoe") {
        const result: MoveSubDecisionTarget[] = [];
        let fallbackTarget: MoveSubDecisionTarget;

        for (const [playerIndex, player] of battle.players) {
            for (const [slot, active] of player.active) {
                if (playerIndex === battle.mainPlayer) {
                    continue; // We cannot target our own pokemon with this move
                }

                if (playersAreAllies(battle.status.gameType, playerIndex, battle.mainPlayer)) {
                    continue; // We cannot target allies with this move
                }

                if (targetIsFarAway(battle.status.gameType, battle.mainPlayer, activeSlot, playerIndex, slot)) {
                    continue; // Too far away
                }

                if (!fallbackTarget) {
                    fallbackTarget = {
                        playerIndex: playerIndex,
                        slot: slot,
                    };
                }

                if (active.condition.fainted) {
                    continue; // We cannot target fainted pokemon
                }

                result.push({
                    playerIndex: playerIndex,
                    slot: slot,
                });
            }
        }

        if (result.length === 0 && fallbackTarget) {
            // If every single target is fainted, we can target a fainted slot
            // This always fails, but progresses the battle as it consumes PP
            result.push(fallbackTarget);
        }

        return result;
    }


    // Target adjacent ally
    if (target === "adjacentAlly") {
        const result: MoveSubDecisionTarget[] = [];
        let fallbackTarget: MoveSubDecisionTarget;

        for (const [playerIndex, player] of battle.players) {
            for (const [slot, active] of player.active) {
                if (playerIndex === battle.mainPlayer) {
                    // Target our own pokemon
                    if (slot === activeSlot) {
                        continue; // adjacentAlly moves cannot target self
                    }
                }

                if (!playersAreAllies(battle.status.gameType, playerIndex, battle.mainPlayer) && battle.status.gameType === "freeforall") {
                    continue; // Not ally (Note: In Free for all, we can target other players as they were allies)
                }

                if (targetIsFarAway(battle.status.gameType, battle.mainPlayer, activeSlot, playerIndex, slot)) {
                    continue; // Too far away
                }

                if (!fallbackTarget) {
                    fallbackTarget = {
                        playerIndex: playerIndex,
                        slot: slot,
                    };
                }

                if (active.condition.fainted) {
                    continue; // We cannot target fainted pokemon
                }

                result.push({
                    playerIndex: playerIndex,
                    slot: slot,
                });
            }
        }

        if (result.length === 0 && fallbackTarget) {
            // If every single target is fainted, we can target a fainted slot
            // This always fails, but progresses the battle as it consumes PP
            result.push(fallbackTarget);
        }

        return result;
    }


    // Target adjacent ally or self
    if (target === "adjacentAllyOrSelf") {
        const result: MoveSubDecisionTarget[] = [];

        for (const [playerIndex, player] of battle.players) {
            for (const [slot, active] of player.active) {
                if (active.condition.fainted) {
                    continue; // We cannot target fainted pokemon
                }

                if (!playersAreAllies(battle.status.gameType, playerIndex, battle.mainPlayer) && battle.status.gameType === "freeforall") {
                    continue; // Not ally (Note: In Free for all, we can target other players as they were allies)
                }

                if (targetIsFarAway(battle.status.gameType, battle.mainPlayer, activeSlot, playerIndex, slot)) {
                    continue; // Too far away
                }

                result.push({
                    playerIndex: playerIndex,
                    slot: slot,
                });
            }
        }

        return result;
    }

    // Target any pokemon in the field
    if (target === "any") {
        const result: MoveSubDecisionTarget[] = [];

        for (const [playerIndex, player] of battle.players) {
            for (const [slot, active] of player.active) {
                if (active.condition.fainted) {
                    continue; // We cannot target fainted pokemon
                }

                if (playerIndex === battle.mainPlayer) {
                    // Target our own pokemon
                    if (slot === activeSlot) {
                        continue; // Any target moves cannot target self
                    }
                }

                result.push({
                    playerIndex: playerIndex,
                    slot: slot,
                });
            }
        }

        return result;
    }

    return [null]; // No need to specify the target
}

/**
 * Move targets that require setting a specific target
 */
export const MoveTargetsRequireSpecificTarget = new Set<MoveTarget>([
    "normal",
    "any",
    "adjacentAlly",
    "adjacentAllyOrSelf",
    "adjacentFoe",
]);

/**
 * Moves with target = all, but they do not target any pokemon, they set a battle status condition
 * Examples: Weather, terrains
 */
export const BattleConditionMoves = new Set<string>([
    "Chilly Reception",
    "Electric Terrain",
    "Grassy Terrain",
    "Gravity",
    "Hail",
    "Magic Room",
    "Misty Terrain",
    "Mud Sport",
    "Psychic Terrain",
    "Rain Dance",
    "Sandstorm",
    "Snowscape",
    "Sunny Day",
    "Trick Room",
    "Water Sport",
    "Wonder Room",
].map(toId));

/**
 * Finds targets for a move decision
 * @param battle The battle
 * @param activeSlot The active slot
 * @param decision The decision
 * @returns The list of targets
 */
export function findMoveDecisionTargets(battle: Battle, activeSlot: DecisionSlot, decision: MoveSubDecision): BattleActivePokemon[] {
    if (!battle.request || !battle.request.active) {
        return [];
    }

    const active = battle.request.active[activeSlot.requestIndex];

    if (!active) {
        return [];
    }

    const move = active.moves[decision.moveIndex];

    if (!move) {
        return [];
    }

    let target = move.target;

    if (decision.gimmick === "dynamax" || decision.gimmick === "max-move") {
        if (move.maxMove) {
            target = move.maxMove.target;
        }
    } else if (decision.gimmick === "z-move") {
        if (move.zMove) {
            target = move.zMove.target;
        }
    }

    if (MoveTargetsRequireSpecificTarget.has(target)) {
        if (decision.target) {
            const targetPlayer = battle.players.get(decision.target.playerIndex);

            if (!targetPlayer) {
                return [];
            }

            const targetActive = targetPlayer.active.get(decision.target.slot);

            if (!targetActive) {
                return [];
            }

            return [targetActive];
        } else {
            const defaultTarget = getDefaultTarget(battle, activeSlot, decision);

            if (defaultTarget) {
                return [defaultTarget];
            } else {
                return [];
            }
        }
    }

    if (target === "allAdjacentFoes") {
        const result: BattleActivePokemon[] = [];

        for (const targetPlayer of battle.players.values()) {
            if (targetPlayer.index === battle.mainPlayer) {
                continue;
            }

            if (playersAreAllies(battle.status.gameType, battle.mainPlayer, targetPlayer.index)) {
                continue;
            }

            for (const targetActive of targetPlayer.active.values()) {
                if (targetActive.condition.fainted) {
                    continue;
                }

                if (targetIsFarAway(battle.status.gameType, battle.mainPlayer, activeSlot.activeSlot, targetPlayer.index, targetActive.slot)) {
                    continue;
                }

                result.push(targetActive);
            }
        }

        return result;
    }

    if (target === "allAdjacent") {
        const result: BattleActivePokemon[] = [];

        for (const targetPlayer of battle.players.values()) {
            const isSelf = targetPlayer.index === battle.mainPlayer;

            for (const targetActive of targetPlayer.active.values()) {
                if (isSelf && targetActive.slot === activeSlot.activeSlot) {
                    continue;
                }

                if (targetActive.condition.fainted) {
                    continue;
                }

                if (targetIsFarAway(battle.status.gameType, battle.mainPlayer, activeSlot.activeSlot, targetPlayer.index, targetActive.slot)) {
                    continue;
                }

                result.push(targetActive);
            }
        }

        return result;
    }


    if (target === "all") {
        if (BattleConditionMoves.has(toId(move.id))) {
            return [];
        }

        const result: BattleActivePokemon[] = [];

        for (const targetPlayer of battle.players.values()) {
            const isSelf = targetPlayer.index === battle.mainPlayer;

            for (const targetActive of targetPlayer.active.values()) {
                if (isSelf && targetActive.slot === activeSlot.activeSlot) {
                    continue;
                }

                if (targetActive.condition.fainted) {
                    continue;
                }

                result.push(targetActive);
            }
        }

        return result;
    }

    if (target === "randomNormal" || target === "scripted") {
        const result: BattleActivePokemon[] = [];

        for (const targetPlayer of battle.players.values()) {
            if (targetPlayer.index === battle.mainPlayer) {
                continue;
            }

            if (playersAreAllies(battle.status.gameType, battle.mainPlayer, targetPlayer.index)) {
                continue;
            }

            for (const targetActive of targetPlayer.active.values()) {
                if (targetActive.condition.fainted) {
                    continue;
                }

                if (targetIsFarAway(battle.status.gameType, battle.mainPlayer, activeSlot.activeSlot, targetPlayer.index, targetActive.slot)) {
                    continue;
                }

                result.push(targetActive);
            }
        }

        if (result.length > 0) {
            return [randomlyChoose(result)];
        } else {
            return [];
        }
    }

    return [];
}

/**
 * Gets default target for a decision
 * @param battle The battle 
 * @param activeSlot The active slot
 * @param decision The decision
 * @returns The default target
 */
export function getDefaultTarget(battle: Battle, activeSlot: DecisionSlot, decision: MoveSubDecision): BattleActivePokemon | null {
    if (!battle.request || !battle.request.active) {
        return null;
    }

    const active = battle.request.active[activeSlot.requestIndex];

    if (!active) {
        return null;
    }

    const move = active.moves[decision.moveIndex];

    if (!move) {
        return null;
    }

    let target = move.target;

    if (decision.gimmick === "dynamax" || decision.gimmick === "max-move") {
        if (move.maxMove) {
            target = move.maxMove.target;
        }
    } else if (decision.gimmick === "z-move") {
        if (move.zMove) {
            target = move.zMove.target;
        }
    }

    if (!MoveTargetsRequireSpecificTarget.has(target)) {
        return null;
    }

    if (target === "adjacentAlly") {
        for (const player of battle.players.values()) {
            if (player.index !== battle.mainPlayer) {
                continue;
            }

            for (const active of player.active.values()) {
                if (active.condition.fainted || active.slot === activeSlot.activeSlot) {
                    continue;
                }

                if (targetIsFarAway(battle.status.gameType, player.index, activeSlot.activeSlot, player.index, active.slot)) {
                    continue;
                }

                return active;
            }
        }

        return null;
    } else if (target === "adjacentAllyOrSelf") {
        for (const player of battle.players.values()) {
            if (player.index !== battle.mainPlayer) {
                continue;
            }

            for (const active of player.active.values()) {
                if (active.condition.fainted) {
                    continue;
                }

                return active;
            }
        }

        return null;
    } else {
        // There should be just one foe active
        for (const player of battle.players.values()) {
            if (player.index === battle.mainPlayer) {
                continue;
            }

            for (const active of player.active.values()) {
                if (active.condition.fainted) {
                    continue;
                }

                return active;
            }
        }

        return null;
    }
}
