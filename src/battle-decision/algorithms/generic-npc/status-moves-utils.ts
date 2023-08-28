// Utilities for status moves handlers

"use strict";

import { TypeName } from "@asanrom/poke-calc/dist/data/interface";
import { Battle, BattleActivePokemon, BattleEvent_Turn_Schema, BattleFields, BattlePlayer, PokemonStatus, SideConditions, StatName } from "../../../battle-data";
import { abilityIsEnabled, applyIllusion, applyTransform, applyTypeChanges, calcDamage, findPokemonData, getPokemonCurrentTypes, isGrounded, itemIsEnabled, moveBreaksAbility } from "../../../battle-helpers";
import { getHPPercent } from "../../../showdown-battle-parser/parser-utils";
import { compareIds, toId } from "../../../utils";
import { playersAreAllies, targetIsFarAway } from "../../active-decision";
import { StatusMoveContext } from "./status-moves";
import { Move } from "@asanrom/poke-calc";

/**
 * Checks if stat can be boosted
 * @param active The pokemon
 * @param stat The stat
 * @returns True if the stat can be boosted
 */
export function canBoost(active: BattleActivePokemon, stat: StatName): boolean {
    if (!active.boosts.has(stat)) {
        return true;
    }

    return active.boosts.get(stat) < 6;
}

/**
 * Checks if the pokemon is in good condition for an offensive boost
 * @param active The active
 * @returns True if the pokemon is in good condition
 */
export function checkOffensiveBoostViability(active: BattleActivePokemon): boolean {
    return getHPPercent(active.condition) >= 75;
}

/**
 * Finds adjacent ally
 * @param battle The battle
 * @param mainPlayer The main player
 * @param mainActive The active using the move
 * @returns The adjacent ally
 */
export function findAdjacentAlly(battle: Battle, mainPlayer: BattlePlayer, mainActive: BattleActivePokemon): BattleActivePokemon | null {
    for (const [playerIndex, player] of battle.players) {
        for (const [slot, active] of player.active) {
            if (playerIndex === mainPlayer.index) {
                if (slot === mainActive.slot) {
                    continue;
                }
            }

            if (!playersAreAllies(battle.status.gameType, playerIndex, mainPlayer.index)) {
                continue;
            }

            if (targetIsFarAway(battle.status.gameType, mainPlayer.index, mainActive.slot, playerIndex, slot)) {
                continue; // Too far away
            }

            return active;
        }
    }

    return null;
}


/**
 * Checks if stat can be de-boosted
 * @param context The context
 * @param stat The stat
 * @returns True if the stat can be de-boosted
 */
export function canUnBoostTarget(context: StatusMoveContext, stat: StatName): boolean {
    if (compareIds(context.target.item.item, "Clear Amulet") && itemIsEnabled(context.battle, context.target)) {
        return false;
    }

    if (compareIds(context.target.ability.ability, "Clear Body") || compareIds(context.target.ability.ability, "White Smoke")) {
        if (abilityIsEnabled(context.battle, context.target) && !moveBreaksAbility(context.battle, context.active, context.target, context.move)) {
            return false;
        }
    }

    if (!context.target.boosts.has(stat)) {
        return true;
    }

    return context.target.boosts.get(stat) > (-6);
}

/**
 * List of stall moves
 * Stall moves will fail if used multiple times in a row
 */
export const StallMoves = new Set([
    "Protect",
    "Baneful Bunker",
    "Detect",
    "Endure",
    "King's Shield",
    "Max Guard",
    "Obstruct",
    "Silk Trap",
    "Spiky Shield",
    "Ally Switch"
].map(toId));

/**
 * Checks if the target can be type changed
 * @param battle The battle
 * @param pokemon The pokemon
 * @param types The types
 * @returns true if it can be type changed
 */
export function canBeTypeChanged(battle: Battle, pokemon: BattleActivePokemon, types: TypeName[]): boolean {
    if (pokemon.details.terastallized) {
        return false;
    }

    const pokeData = findPokemonData(battle.status.gen, pokemon.details.species);

    applyIllusion(battle, pokeData, pokemon);
    applyTransform(battle, pokeData, pokemon, "max");

    if (toId(pokeData.species.name).startsWith(toId("Arceus"))) {
        return false;
    }

    if (toId(pokeData.species.name).startsWith(toId("Silvally"))) {
        return false;
    }

    applyTypeChanges(pokeData, pokemon);

    if (pokeData.types.length !== types.length) {
        return true;
    }

    for (const t of types) {
        if (!pokeData.types.includes(t)) {
            return true;
        }
    }

    return false;
}

/**
 * Checks if the target can be type added
 * @param battle The battle
 * @param pokemon The pokemon
 * @param type The type
 * @returns true if it can be type added
 */
export function canBeTypeAdded(battle: Battle, pokemon: BattleActivePokemon, type: TypeName): boolean {
    if (pokemon.details.terastallized) {
        return false;
    }

    const pokeData = findPokemonData(battle.status.gen, pokemon.details.species);

    applyIllusion(battle, pokeData, pokemon);
    applyTransform(battle, pokeData, pokemon, "max");

    if (toId(pokeData.species.name).startsWith(toId("Arceus"))) {
        return false;
    }

    if (toId(pokeData.species.name).startsWith(toId("Silvally"))) {
        return false;
    }
    
    applyTypeChanges(pokeData, pokemon);

    return !pokeData.types.includes(type);
}

/**
 * Checks if hazards move will be bounced
 * @param battle The battle
 * @param player The player
 * @param pokemon The pokemon using the move
 * @param move The move
 * @returns True if the move is bounced
 */
export function hazardsMoveWillBeBounced(battle: Battle, player: BattlePlayer, pokemon: BattleActivePokemon, move: Move): boolean {
    for (const targetPlayer of battle.players.values()) {
        if (targetPlayer.index === player.index) {
            continue;
        }

        if (playersAreAllies(battle.status.gameType, targetPlayer.index, player.index)) {
            continue;
        }

        for (const target of targetPlayer.active.values()) {
            if (compareIds(target.ability.ability, "Magic Bounce") && abilityIsEnabled(battle, target) && !moveBreaksAbility(battle, pokemon, target, move)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Checks if hazards move is viable
 * @param battle The battle
 * @param player The player
 * @param condition The condition ID
 * @param maxCount Max number of instances of the condition that can be stacked
 * @param requiresSwitch True if the condition requires a switch to take affect
 * @returns True if the condition is viable
 */
export function hazardsMoveViable(battle: Battle, player: BattlePlayer, condition: string, maxCount: number, requiresSwitch: boolean): boolean {
    for (const targetPlayer of battle.players.values()) {
        if (targetPlayer.index === player.index) {
            continue;
        }

        if (playersAreAllies(battle.status.gameType, targetPlayer.index, player.index)) {
            continue;
        }

        if (requiresSwitch) {
            let teamSize = targetPlayer.teamSize;

            if (battle.status.teamPreviewSize) {
                teamSize = Math.min(teamSize, battle.status.teamPreviewSize);
            }

            let alivePokemon = Math.max(0, teamSize - targetPlayer.team.length);

            for (const poke of targetPlayer.team) {
                if (!poke.condition.fainted && !poke.active) {
                    alivePokemon++;
                }
            }

            if (alivePokemon === 0) {
                continue;
            }
        }

        // Check if the side condition is already in effect
        if (targetPlayer.sideConditions.has(condition)) {
            return targetPlayer.sideConditions.get(condition).counter < maxCount;
        } else {
            return true;
        }
    }

    return false;
}

/**
 * Checks if move does damage
 * @param context The context
 * @param overrideBasePower Override base power
 * @returns True if the move does any damage to the target
 */
export function moveDoesDamage(context: StatusMoveContext, overrideBasePower?: number): boolean {
    const damage = calcDamage(context.battle, context.mainPlayer, context.active, context.targetPlayer, context.target, context.move.name, {
        considerStatsAttacker: "max",
        considerStatsDefender: "max",
        usePercent: true,
        useMax: context.decision.gimmick === "dynamax" || context.decision.gimmick === "max-move",
        useZMove: context.decision.gimmick === "z-move",
        overrideBasePower: overrideBasePower,
    });

    return damage.max > 0;
}

/**
 * Count hazards for hazard removal moves
 * @param player The player
 * @return The hazards count
 */
export function countHazards(player: BattlePlayer): number {
    let count = 0;

    if (player.sideConditions.has(SideConditions.StealthRock)) {
        count += 30;
    }

    if (player.sideConditions.has(SideConditions.StickyWeb)) {
        count += 20;
    }

    if (player.sideConditions.has(SideConditions.ToxicSpikes)) {
        count += player.sideConditions.get(SideConditions.ToxicSpikes).counter * 15;
    }

    if (player.sideConditions.has(SideConditions.Spikes)) {
        count += player.sideConditions.get(SideConditions.Spikes).counter * 10;
    }

    if (player.sideConditions.has(SideConditions.Reflect)) {
        count -= 20;
    }

    if (player.sideConditions.has(SideConditions.LightScreen)) {
        count -= 20;
    }

    if (player.sideConditions.has(SideConditions.Reflect)) {
        count -= 20;
    }

    return count;
}

/**
 * Checks if the target can be applied a status and it's viability
 * @param context The context
 * @param status The status
 * @returns True if the status is viable
 */
export function isStatusViable(context: StatusMoveContext, status: PokemonStatus): boolean {
    // If the status move is bounced against us, that's bad
    if (hazardsMoveWillBeBounced(context.battle, context.mainPlayer, context.active, context.move)) {
        return false;
    }

    if (compareIds(context.target.ability.ability, "Purifying Salt") && abilityIsEnabled(context.battle, context.target) && !moveBreaksAbility(context.battle, context.active, context.target, context.move)) {
        return false; // Purifying Salt grants immunity
    }

    if (isGrounded(context.battle, context.target) && context.battle.status.fields.has(BattleFields.MistyTerrain)) {
        return false;
    }

    const pokemonTypes = getPokemonCurrentTypes(context.battle, context.target);

    if (status === "BRN") {
        if (pokemonTypes.includes("Fire")) {
            return false;
        }

        if (["Thermal Exchange", "Water Bubble", "Water Veil"].map(toId).includes(toId(context.target.ability.ability))) {
            if (abilityIsEnabled(context.battle, context.target) && !moveBreaksAbility(context.battle, context.active, context.target, context.move)) {
                return false;
            }
        }
    } else if (status === "FRZ") {
        if (pokemonTypes.includes("Ice")) {
            return false;
        }
    } else if (status === "PSN" || status === "TOX") {
        if (pokemonTypes.includes("Poison") || pokemonTypes.includes("Steel")) {
            if (!compareIds(context.active.ability.ability, "Corrosion") || !abilityIsEnabled(context.battle, context.active)) {
                return false;
            }
        }

        if (["Immunity"].map(toId).includes(toId(context.target.ability.ability))) {
            if (abilityIsEnabled(context.battle, context.target) && !moveBreaksAbility(context.battle, context.active, context.target, context.move)) {
                return false;
            }
        }

        if (["Poison Heal", "Magic Guard"].map(toId).includes(toId(context.target.ability.ability))) {
            if (abilityIsEnabled(context.battle, context.target)) {
                return false;
            }
        }
    } else if (status === "PAR") {
        if (context.battle.status.gen > 5 && pokemonTypes.includes("Electric")) {
            return false;
        }

        if (["Limber"].map(toId).includes(toId(context.target.ability.ability))) {
            if (abilityIsEnabled(context.battle, context.target) && !moveBreaksAbility(context.battle, context.active, context.target, context.move)) {
                return false;
            }
        }
    } else if (status === "SLP") {
        if (["Vital Spirit", "Insomnia"].map(toId).includes(toId(context.target.ability.ability))) {
            if (abilityIsEnabled(context.battle, context.target) && !moveBreaksAbility(context.battle, context.active, context.target, context.move)) {
                return false;
            }
        }

        if (isGrounded(context.battle, context.target) && context.battle.status.fields.has(BattleFields.ElectricTerrain)) {
            return false;
        }

        // Find sweet veil
        for (const player of context.battle.players.values()) {
            if (player.index !== context.targetPlayer.index && !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, player.index)) {
                continue;
            }
    
            for (const active of player.active.values()) {
                if (active.condition.fainted) {
                    continue;
                }

                if (compareIds(active.ability.ability, "Sweet Veil") && abilityIsEnabled(context.battle, active)) {
                    return false;
                }
            }
        }

        // Sleep clause
        if (context.battle.status.isSleepClause) {
            for (const poke of context.targetPlayer.team) {
                if (poke.condition.status === "SLP") {
                    return false;
                }
            }
        }
    }

    return !context.target.condition.status;
}

/**
 * Counts boosts
 * @param pokemon The pokemon
 * @param stats The stats to count
 * @returns The boost count
 */
export function countBoosts(pokemon: BattleActivePokemon, stats: StatName[]): number {
    let count = 0;

    for (const stat of stats) {
        if (pokemon.boosts.has(stat)) {
            count += (pokemon.boosts.get(stat) || 0);
        }
    }

    return count;
}
