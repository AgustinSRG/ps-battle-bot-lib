// Move data finder

"use strict";

import { GenerationNum, Generations, toID } from "@asanrom/poke-calc";
import { Pokemon } from "@asanrom/poke-calc";
import { LAST_GEN } from "./initializers";

const DEFAULT_POKEMON = "Silvally";

/**
 * Find pokemon data
 * @param gen Generation number
 * @param species The pokemon species name
 * @returns The pokemon data
 */
export function findPokemonData(gen: number, species: string): Pokemon {
    if (gen < 1 || gen > LAST_GEN) {
        gen = LAST_GEN;
    }

    let generationData = Generations.get(gen as GenerationNum);
    let pokeData = generationData.species.get(toID(species));

    if (pokeData) {
        return new Pokemon(generationData.num, pokeData.name);
    }

    // Try with the last gen

    for (let g = LAST_GEN; g >= 1; g--) {
        generationData = Generations.get(g as GenerationNum);
        pokeData = generationData.species.get(toID(species));

        if (pokeData) {
            return new Pokemon(generationData.num, pokeData.name);
        }
    }

    // Unknown pokemon
    generationData = Generations.get(LAST_GEN as GenerationNum);
    pokeData = generationData.species.get(toID(DEFAULT_POKEMON));

    return new Pokemon(generationData.num, pokeData.name, {
        overrides: {
            types: ['???']
        },
    });
}

