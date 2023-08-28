// Side helpers

"use strict";

import { Battle, BattleActivePokemon, BattlePlayer, SideConditions, getCombinedEffectivenessMultiplier, getTypeChart } from "../battle-data";
import { playersAreAllies } from "../battle-decision";
import { compareIds } from "../utils/id";
import { abilityIsEnabled } from "./ability";
import { isSunny } from "./global-status";
import { itemIsEnabled } from "./item";
import { findPokemonData } from "./poke-data-find";
import { applyIllusion, applyTransform, isGrounded } from "./pokemon";
import { applyTypeChanges } from "./pokemon";

/**
 * Checks if flower gift is enabled
 * @param battle The battle
 * @param player The player
 * @param slot Slot affected
 * @returns True if flower gift is enabled
 */
export function checkFlowerGift(battle: Battle, player: BattlePlayer, slot: number): boolean {
    if (!isSunny(battle)) {
        return false;
    }

    for (const [s, active] of player.active) {
        if (s === slot) {
            continue;
        }

        if (!compareIds(active.ability.ability, "Flower Gift")) {
            continue;
        }

        if (abilityIsEnabled(battle, active)) {
            return true;
        }
    }

    return false;
}

/**
 * Checks if friend guard is enabled
 * @param battle The battle
 * @param player The player
 * @param slot Slot affected
 * @returns True if friend guard is enabled
 */
export function checkFriendGuard(battle: Battle, player: BattlePlayer, slot: number): boolean {
    for (const [s, active] of player.active) {
        if (s === slot) {
            continue;
        }

        if (!compareIds(active.ability.ability, "Friend Guard")) {
            continue;
        }

        if (abilityIsEnabled(battle, active)) {
            return true;
        }
    }

    return false;
}


/**
 * Checks if Battery is enabled
 * @param battle The battle
 * @param player The player
 * @param slot Slot affected
 * @returns True if Battery is enabled
 */
export function checkBattery(battle: Battle, player: BattlePlayer, slot: number): boolean {
    for (const [s, active] of player.active) {
        if (s === slot) {
            continue;
        }

        if (!compareIds(active.ability.ability, "Battery")) {
            continue;
        }

        if (abilityIsEnabled(battle, active)) {
            return true;
        }
    }

    return false;
}


/**
 * Checks if Power Spot is enabled
 * @param battle The battle
 * @param player The player
 * @param slot Slot affected
 * @returns True if Power Spot is enabled
 */
export function checkPowerSpot(battle: Battle, player: BattlePlayer, slot: number): boolean {
    for (const [s, active] of player.active) {
        if (s === slot) {
            continue;
        }

        if (!compareIds(active.ability.ability, "Power Spot")) {
            continue;
        }

        if (abilityIsEnabled(battle, active)) {
            return true;
        }
    }

    return false;
}

/**
 * Calculates hazards damage
 * @param battle The battle
 * @param player The player
 * @param pokemon The pokemon
 * @returns The hazards damage
 */
export function calcHazardsDamage(battle: Battle, player: BattlePlayer, pokemon: BattleActivePokemon): number {
    if (compareIds(pokemon.ability.ability, "Magic Guard") && abilityIsEnabled(battle, pokemon)) {
        return 0;
    }

    if (compareIds(pokemon.item.item, "Heavy-Duty Boots") && itemIsEnabled(battle, pokemon)) {
        return 0;
    }

    const typeChart = getTypeChart(battle.status.gen);

    const pokeData = findPokemonData(battle.status.gen, pokemon.details.species);
    applyIllusion(battle, pokeData, pokemon);
    applyTransform(battle, pokeData, pokemon, "avg");
    applyTypeChanges(pokeData, pokemon);

    let res = 0;

    if (player.sideConditions.has(SideConditions.StealthRock)) {
        res += (100 / 8) * getCombinedEffectivenessMultiplier(typeChart, ["Rock"], pokeData.types, battle.status.inverse);
    }

    if (player.sideConditions.has(SideConditions.Spikes) && isGrounded(battle, pokemon)) {
        const counter = player.sideConditions.get(SideConditions.Spikes).counter;
        res += (100 / 24) * counter;
    }

    return res;
}

/**
 * Checks if any foe players made any switched in the previous turn
 * @param battle The battle
 * @returns True if the foe player made a switch
 */
export function checkFoeSwitchedLastTurn(battle: Battle): boolean {
    if (battle.turn <= 1) {
        return;
    }
    for (const player of battle.players.values()) {
        if (player.index === battle.mainPlayer) {
            continue;
        }

        if (playersAreAllies(battle.status.gameType, player.index, battle.mainPlayer)) {
            continue;
        }

        for (const active of player.active.values()) {
            if (active.switchedOnTurn === battle.turn - 1) {
                return true;
            }
        }
    }

    return false;
}


