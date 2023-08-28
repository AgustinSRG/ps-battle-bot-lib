// Battle request definition

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";
import { PokemonCondition, PokemonConditionSchema } from "./condition";
import { PokemonDetails, PokemonDetailsSchema } from "./details";
import { PokemonIdent, PokemonIdentSchema } from "./ident";
import { PokemonStats, PokemonStatsSchema } from "./stats";
import { BOOLEAN_SCHEMA, POSITIVE_INT_SCHEMA, STRING_SCHEMA } from "../utils/schemas";

/**
 * Move target
 * normal = One adjacent Pokemon
 * self = User
 * adjacentAlly = One Ally
 * adjacentAllyOrSelf = User or ally
 * adjacentFoe = One Adjacent Opposing Pokemon
 * allAdjacentFoes = All Adjacent Opponents
 * foeSide = Opposing Side
 * allySide = User's Side
 * allyTeam = User's Side
 * allAdjacent = All adjacent Pokemon
 * any = Any Pokemon
 * all = All Pokemon
 * scripted = Auto
 * randomNormal = Auto (Random)
 * allies = User and allies
 */
export type MoveTarget = "normal" |
    "self" |
    "adjacentAlly" |
    "adjacentAllyOrSelf" |
    "adjacentFoe" |
    "allAdjacentFoes" |
    "foeSide" |
    "allySide" |
    "allyTeam" |
    "allAdjacent" |
    "any" |
    "all" |
    "scripted" |
    "randomNormal" |
    "allies";

export const MoveTargetSchema = ObjectSchema.string().withEnumeration([
    "normal",
    "self",
    "adjacentAlly",
    "adjacentAllyOrSelf",
    "adjacentFoe",
    "allAdjacentFoes",
    "foeSide",
    "allySide",
    "allyTeam",
    "allAdjacent",
    "any",
    "all",
    "scripted",
    "randomNormal",
    "allies"
]).withDefaultValue("scripted");

/**
 * Move of an active pokemon
 */
export interface BattleRequestActivePokemonMove {
    /**
     * Move ID
     */
    id: string;

    /**
     * Remaining PP
     */
    pp?: number;

    /**
     * Max PP
     */
    maxPP?: number;

    /**
     * Move target
     */
    target: MoveTarget;

    /**
     * True if the move is disabled
     */
    disabled: boolean;

    /**
     * Z move info (if it can use Z move)
     */
    zMove?: {
        id: string;
        target: MoveTarget;
    };

    /**
     * Max move info (if it can use the max move)
     */
    maxMove?: {
        id: string;
        target: MoveTarget;
    };
}

export const BattleRequestActivePokemonMoveSchema = ObjectSchema.object({
    id: STRING_SCHEMA,
    pp: ObjectSchema.optional(POSITIVE_INT_SCHEMA),
    maxPP: ObjectSchema.optional(POSITIVE_INT_SCHEMA),
    target: MoveTargetSchema,
    disabled: BOOLEAN_SCHEMA,
    zMove: ObjectSchema.optional(ObjectSchema.object({
        id: STRING_SCHEMA,
        target: MoveTargetSchema,
    })),
    maxMove: ObjectSchema.optional(ObjectSchema.object({
        id: STRING_SCHEMA,
        target: MoveTargetSchema,
    })),
});


/**
 * Active pokemon information
 */
export interface BattleRequestActivePokemon {
    /**
     * List of moves
     */
    moves: BattleRequestActivePokemonMove[];

    /**
     * True if trapped
     */
    trapped?: boolean;

    /**
     * The type it can terastallize into
     * Empty string means it cannot do it
     */
    canTerastallize?: string;

    /**
     * True if it can mega evolve
     */
    canMegaEvo?: boolean;

    /**
     * True if it can ultra burst
     */
    canUltraBurst?: boolean;
}

export const BattleRequestActivePokemonSchema = ObjectSchema.object({
    moves: ObjectSchema.array(BattleRequestActivePokemonMoveSchema),
    trapped: ObjectSchema.optional(BOOLEAN_SCHEMA),
    canTerastallize: ObjectSchema.optional(STRING_SCHEMA),
    canMegaEvo: ObjectSchema.optional(BOOLEAN_SCHEMA),
    canUltraBurst: ObjectSchema.optional(BOOLEAN_SCHEMA),
});

/**
 * Side pokemon information
 */
export interface BattleRequestSidePokemon {
    /**
     * Identifier
     */
    ident: PokemonIdent;

    /**
     * Details
     */
    details: PokemonDetails,

    /**
     * Condition
     */
    condition: PokemonCondition,

    /**
     * Is active?
     */
    active: boolean;

    /**
     * Stats
     */
    stats: PokemonStats;

    /**
     * Moves it knows
     */
    moves: string[];

    /**
     * Item hold
     */
    item: string;

    /**
     * Name of the pokemon ball it's in
     */
    ball: string;

    /**
     * Current ability
     */
    ability: string;

    /**
     * Base ability
     */
    baseAbility: string;

    /**
     * True if commanding
     */
    commanding?: boolean;

    /**
     * True if reviving
     */
    reviving?: boolean;

    /**
     * Tera type the pokemon has
     */
    teraType?: string;

    /**
     * Type terastallized
     */
    terastallized?: string;
}

export const BattleRequestSidePokemonSchema = ObjectSchema.object({
    ident: PokemonIdentSchema,
    details: PokemonDetailsSchema,
    condition: PokemonConditionSchema,
    active: BOOLEAN_SCHEMA,
    stats: PokemonStatsSchema,
    moves: ObjectSchema.array(STRING_SCHEMA),
    item: STRING_SCHEMA,
    ball: STRING_SCHEMA,
    ability: STRING_SCHEMA,
    baseAbility: STRING_SCHEMA,
    commanding: ObjectSchema.optional(BOOLEAN_SCHEMA),
    reviving: ObjectSchema.optional(BOOLEAN_SCHEMA),
    teraType: ObjectSchema.optional(STRING_SCHEMA),
    terastallized: ObjectSchema.optional(STRING_SCHEMA),
});

/**
 * Main player side
 */
export interface BattleRequestSide {
    /**
     * Player name
     */
    name: string;

    /**
     * Player index: 1, 2, 3, 4
     */
    playerIndex: number;

    /**
     * List of pokemon in the party
     */
    pokemon: BattleRequestSidePokemon[];
}

export const BattleRequestSideSchema = ObjectSchema.object({
    name: STRING_SCHEMA,
    playerIndex: POSITIVE_INT_SCHEMA,
    pokemon: ObjectSchema.array(BattleRequestSidePokemonSchema),
});


/**
 * Battle request
 * 
 */
export interface BattleRequest {
    /**
     * Request ID
     */
    id: number;

    /**
     * True if it's a wait turn
     */
    wait?: boolean;

    /**
     * True if it's team preview
     */
    teamPreview?: boolean;

    /**
     * True if it's a forced switch
     */
    forceSwitch?: boolean[];

    /**
     * List of active pokemon
     */
    active?: BattleRequestActivePokemon[];

    /**
     * Main player side
     */
    side: BattleRequestSide;
}

export const BattleRequestSchema = ObjectSchema.object({
    id: POSITIVE_INT_SCHEMA,
    wait: ObjectSchema.optional(ObjectSchema.boolean()),
    teamPreview: ObjectSchema.optional(ObjectSchema.boolean()),
    forceSwitch: ObjectSchema.optional(ObjectSchema.array(ObjectSchema.boolean())),
    active: ObjectSchema.optional(ObjectSchema.array(BattleRequestActivePokemonSchema)),
    side: BattleRequestSideSchema,
});
