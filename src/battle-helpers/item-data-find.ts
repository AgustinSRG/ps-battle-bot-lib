// Item data finder

"use strict";

import { GenerationNum, Generations, toID } from "@asanrom/poke-calc";
import { Item } from "@asanrom/poke-calc/dist/data/interface";
import { LAST_GEN } from "./initializers";

const DEFAULT_ITEM = "Poke Ball";

/**
 * Find item data
 * @param gen Generation number
 * @param item The item name
 * @returns The item data
 */
export function findItemData(gen: number, item: string): Item {
    if (gen < 1 || gen > LAST_GEN) {
        gen = LAST_GEN;
    }

    let generationData = Generations.get(gen as GenerationNum);
    let itemData = generationData.items.get(toID(item));

    if (itemData) {
        return itemData;
    }

    // Try with the last gen
    for (let g = LAST_GEN; g >= 1; g--) {
        generationData = Generations.get(g as GenerationNum);
        itemData = generationData.items.get(toID(item));

        if (itemData) {
            return itemData;
        }
    }

    // Unknown item
    generationData = Generations.get(LAST_GEN as GenerationNum);
    return generationData.items.get(toID(DEFAULT_ITEM));
}

