// Pokemon ident

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";
import { BOOLEAN_SCHEMA, POSITIVE_INT_SCHEMA, STRING_SCHEMA } from "../utils/schemas";

/**
 * Pokemon ident
 */
export interface PokemonIdent {
    /**
     * Player index
     */
    playerIndex: number;

    /**
     * Pokemon name
     */
    name: string;
}

export const PokemonIdentSchema = ObjectSchema.object({
    playerIndex: POSITIVE_INT_SCHEMA,
    name: STRING_SCHEMA,
});

/**
 * Pokemon target ident
 */
export interface PokemonIdentTarget {
    /**
     * Player index
     */
    playerIndex: number;

    /**
     * Pokemon name
     */
    name: string;

    /**
     * The target is an active target?
     */
    active: boolean;

    /**
     * If active = true, index of the active pokemon
     */
    slot?: number;
}

export const PokemonIdentTargetSchema = ObjectSchema.object({
    playerIndex: POSITIVE_INT_SCHEMA,
    name: STRING_SCHEMA,
    active: BOOLEAN_SCHEMA,
    slot: ObjectSchema.optional(POSITIVE_INT_SCHEMA),
});