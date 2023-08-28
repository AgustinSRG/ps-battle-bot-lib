// Battle status helpers

"use strict";

import { AbilityEffects, Battle, Weathers } from "../battle-data";

/**
 * Checks if the weather is sunny
 * @param battle The battle
 * @returns True if the weather is sunny
 */
export function isSunny(battle: Battle): boolean {
    if (!battle.status.weather) {
        return false;
    }

    if (battle.status.abilityEffects.has(AbilityEffects.AirLock)) {
        return false;
    }

    return [Weathers.SunnyDay, Weathers.DesolateLand].includes(battle.status.weather.id);
}

/**
 * Checks if the weather is rainy
 * @param battle The battle
 * @returns True if the weather is rainy
 */
export function isRainy(battle: Battle): boolean {
    if (!battle.status.weather) {
        return false;
    }

    if (battle.status.abilityEffects.has(AbilityEffects.AirLock)) {
        return false;
    }

    return [Weathers.RainDance, Weathers.PrimordialSea].includes(battle.status.weather.id);
}

/**
 * Checks if the weather is snowy
 * @param battle The battle
 * @returns True if the weather is snowy
 */
export function isSnowy(battle: Battle): boolean {
    if (!battle.status.weather) {
        return false;
    }

    if (battle.status.abilityEffects.has(AbilityEffects.AirLock)) {
        return false;
    }

    return [Weathers.Snow, Weathers.Hail].includes(battle.status.weather.id);
}

/**
 * Checks if the weather is sand storm
 * @param battle The battle
 * @returns True if the weather is sand storm
 */
export function isSandStorm(battle: Battle): boolean {
    if (!battle.status.weather) {
        return false;
    }

    if (battle.status.abilityEffects.has(AbilityEffects.AirLock)) {
        return false;
    }

    return [Weathers.Sandstorm].includes(battle.status.weather.id);
}
