// Pokemon condition

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";
import { BOOLEAN_SCHEMA, NUMBER_SCHEMA, POSITIVE_INT_SCHEMA, STRING_SCHEMA } from "../utils/schemas";

export type PokemonStatus = "" | "BRN" | "PSN" | "TOX" | "PAR" | "SLP" | "FRZ";

export const PokemonStatusSchema = ObjectSchema.string().withEnumeration(["" , "BRN" , "PSN" , "TOX" , "PAR" , "SLP" , "FRZ"]).withDefaultValue("");

/**
 * Pokemon condition
 */
export interface PokemonCondition {
    /**
     * Current HP
     */
    hp: number;

    /**
     * Max HP
     */
    maxHP: number;

    /**
     * Status.
     * Empty string means no status
     * Examples: BRN, PSN, TOX, SLP, PAR, FRZ
     */
    status: PokemonStatus;

    /**
     * True if fainted
     */
    fainted: boolean;
}

export const PokemonConditionSchema = ObjectSchema.object({
    hp: NUMBER_SCHEMA,
    maxHP: NUMBER_SCHEMA,
    status: PokemonStatusSchema,
    fainted: BOOLEAN_SCHEMA,
});
