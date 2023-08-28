// Pokemon details

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";
import { BOOLEAN_SCHEMA, STRING_SCHEMA } from "../utils/schemas";
import { compareIds } from "../utils/id";

/**
 * Pokemon details
 */
export interface PokemonDetails {
    /**
     * Name of the pokemon species
     */
    species: string;

    /**
     * The level of the pokemon
     * Default: 100
     */
    level: number;

    /**
     * True if the pokemon is shiny
     */
    shiny: boolean;

    /**
     * Pokemon gender, can be male (M), female (F) or none (N)
     */
    gender: "M" | "F" | "N";

    /**
     * Terastallized condition
     */
    terastallized: string;
}

export const PokemonDetailsSchema = ObjectSchema.object({
    species: STRING_SCHEMA,
    level: ObjectSchema.integer().withMin(1).withDefaultValue(100),
    shiny: BOOLEAN_SCHEMA,
    gender: ObjectSchema.string().withEnumeration(['M', 'F', 'N']).withDefaultValue("N"),
    terastallized: STRING_SCHEMA,
});

/**
 * Compares 2 pokemon by their details
 * @param poke1 Pokemon 1
 * @param poke2 Pokemon 2
 * @returns True if they are the same
 */
export function compareDetails(poke1: PokemonDetails, poke2: PokemonDetails): boolean {
    return compareIds(poke1.species, poke2.species) && poke1.level === poke2.level && poke1.shiny === poke2.shiny && poke1.gender === poke2.gender && compareIds(poke1.terastallized, poke2.terastallized);
}
