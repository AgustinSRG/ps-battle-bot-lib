// Ability data finder

"use strict";

import { GenerationNum, Generations, toID } from "@asanrom/poke-calc";
import { Ability } from "@asanrom/poke-calc/dist/data/interface";
import { LAST_GEN } from "./initializers";

const DEFAULT_ABILITY = "Illuminate";

/**
 * Find ability data
 * @param gen Generation number
 * @param ability The ability name
 * @returns The ability data
 */
export function findAbilityData(gen: number, ability: string): Ability {
    if (gen < 1 || gen > LAST_GEN) {
        gen = LAST_GEN;
    }

    let generationData = Generations.get(gen as GenerationNum);
    let abilityData = generationData.abilities.get(toID(ability));

    if (abilityData) {
        return abilityData;
    }

    // Try with the last gen
    for (let g = LAST_GEN; g >= 1; g--) {
        generationData = Generations.get(LAST_GEN as GenerationNum);
        abilityData = generationData.abilities.get(toID(ability));

        if (abilityData) {
            return abilityData;
        }
    }

    // Unknown ability
    generationData = Generations.get(LAST_GEN as GenerationNum);
    return generationData.abilities.get(toID(DEFAULT_ABILITY));
}

