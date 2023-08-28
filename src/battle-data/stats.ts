// Stats related interfaces

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";
import { POSITIVE_INT_SCHEMA } from "../utils/schemas";

/**
 * Pokemon stats
 */
export interface PokemonStats {
    /**
     * Attack
     */
    atk: number;

    /**
     * Defense
     */
    def: number;

    /**
     * Special attack
     */
    spa: number;

    /**
     * Special defense
     */
    spd: number;

    /**
     * Speed
     */
    spe: number;
}

export const PokemonStatsSchema = ObjectSchema.object({
    atk: POSITIVE_INT_SCHEMA,
    def: POSITIVE_INT_SCHEMA,
    spa: POSITIVE_INT_SCHEMA,
    spd: POSITIVE_INT_SCHEMA,
    spe: POSITIVE_INT_SCHEMA,
});

/**
 * Battle stat name
 */
export type StatName = "atk" | "def" | "spa" | "spd" | "spe" | "evasion" | "accuracy";

export const StatNameSchema = ObjectSchema.string().withEnumeration(['atk', 'def', 'spa', 'spd', 'spe', 'evasion', 'accuracy']).withDefaultValue("atk");

/**
 * Knowledge of a stat of a pokemon
 */
export interface StatKnowledge {
    /**
     * True means the stat is known by the request, so we know the exact stat value
     */
    known: boolean;

    /**
     * Min possible value
     */
    min: number;

    /**
     * Max possible value
     */
    max: number;
}

/**
 * Pokemon known stats
 */
export interface PokemonKnownStats {
    /**
     * HP
     */
    hp: StatKnowledge;

    /**
     * Attack
     */
    atk: StatKnowledge;

    /**
     * Defense
     */
    def: StatKnowledge;

    /**
     * Special attack
     */
    spa: StatKnowledge;

    /**
     * Special defense
     */
    spd: StatKnowledge;

    /**
     * Speed
     */
    spe: StatKnowledge;
}


/**
 * Pokemon known stats (transform)
 */
export interface PokemonKnownStatsTransform {
    /**
     * Attack
     */
    atk: StatKnowledge;

    /**
     * Defense
     */
    def: StatKnowledge;

    /**
     * Special attack
     */
    spa: StatKnowledge;

    /**
     * Special defense
     */
    spd: StatKnowledge;

    /**
     * Speed
     */
    spe: StatKnowledge;
}
