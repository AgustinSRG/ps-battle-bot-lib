// Utilities for items

"use strict";

import { Battle, BattleActivePokemon, BattleFields, ItemKnowledge, VolatileStatuses } from "../battle-data";

/**
 * Checks if item is enabled
 * @param battle The battle
 * @param pokemon The pokemon holding the item
 * @returns True if the item is enabled
 */
export function itemIsEnabled(battle: Battle, pokemon: BattleActivePokemon): boolean {
    if (battle.status.fields.has(BattleFields.MagicRoom)) {
        // Items are disabled
        return false;
    }

    if (pokemon.volatiles.has(VolatileStatuses.Embargo)) {
        // Embargo is on
        return false;
    }

    return true;
}

/**
 * Gets unknown item
 * @returns Unknown item
 */
export function unknownItem(): ItemKnowledge {
    return {
        known: false,
        revealed: false,
        item: "",
    };
}
