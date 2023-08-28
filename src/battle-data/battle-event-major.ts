// Battle major event

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";
import { PokemonCondition, PokemonConditionSchema } from "./condition";
import { PokemonDetails, PokemonDetailsSchema } from "./details";
import { BattleEffect, BattleEffectSchema } from "./effect";
import { PokemonIdentTarget, PokemonIdentTargetSchema } from "./ident";
import { BattleRequest, BattleRequestSchema } from "./request";
import { BOOLEAN_SCHEMA, POSITIVE_INT_SCHEMA, STRING_SCHEMA } from "../utils/schemas";
import { BattleGameType, BattleGameTypeSchema } from "./battle-status";

/**
 * Battle request received
 */
export interface BattleEvent_Request {
    type: "Request";
    request: BattleRequest;
}

export const BattleEvent_Request_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Request']),
    request: BattleRequestSchema,
});

/**
 * The battle is in team preview turn.
 */
export interface BattleEvent_TeamPreview {
    type: "TeamPreview";
    maxTeamSize?: number;
}

export const BattleEvent_TeamPreview_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['TeamPreview']),
    maxTeamSize: ObjectSchema.optional(POSITIVE_INT_SCHEMA),
});


/**
 * The battle has started
 */
export interface BattleEvent_Start {
    type: "Start";
}

export const BattleEvent_Start_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Start']),
});

/**
 * The pokemon is trapped (now it was revealed) and cannot switch
 * The player must send another decision
 */
export interface BattleEvent_CallbackTrapped {
    type: "CallbackTrapped";
    slot: number;
}

export const BattleEvent_CallbackTrapped_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['CallbackTrapped']),
    slot: POSITIVE_INT_SCHEMA,
});

/**
 * The move is disabled (now it was revealed)
 * The player must send another decision
 */
export interface BattleEvent_CallbackCannotUseMove {
    type: "CallbackCannotUseMove";
    slot: number;
    move: string;
}

export const BattleEvent_CallbackCannotUseMove_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['CallbackCannotUseMove']),
    slot: POSITIVE_INT_SCHEMA,
    move: STRING_SCHEMA,
});

/**
 * Specified game type
 * Eg: singles, doubles
 */
export interface BattleEvent_GameType {
    type: "GameType";
    gameType: BattleGameType;
}

export const BattleEvent_GameType_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['GameType']),
    gameType: BattleGameTypeSchema,
});

/**
 * Specified generation
 */
export interface BattleEvent_Gen {
    type: "Gen";
    gen: number;
}

export const BattleEvent_Gen_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Gen']),
    gen: POSITIVE_INT_SCHEMA,
});

/**
 * Specified tier / format
 */
export interface BattleEvent_Tier {
    type: "Tier";
    tier: string;
}

export const BattleEvent_Tier_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Tier']),
    tier: STRING_SCHEMA,
});

/**
 * Battle rule specified
 */
export interface BattleEvent_Rule {
    type: "Rule";
    name: string;
    description: string;
}

export const BattleEvent_Rule_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Rule']),
    name: STRING_SCHEMA,
    description: STRING_SCHEMA,
});

/**
 * Registered player
 */
export interface BattleEvent_Player {
    type: "Player";
    playerIndex: number;
    playerName: string;
    playerAvatar: string;
}

export const BattleEvent_Player_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Player']),
    playerIndex: POSITIVE_INT_SCHEMA,
    playerName: STRING_SCHEMA,
    playerAvatar: STRING_SCHEMA,
});

/**
 * Specified player team size
 */
export interface BattleEvent_TeamSize {
    type: "TeamSize";
    playerIndex: number;
    teamSize: number;
}

export const BattleEvent_TeamSize_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['TeamSize']),
    playerIndex: POSITIVE_INT_SCHEMA,
    teamSize: POSITIVE_INT_SCHEMA,
});

/**
 * Clear all known info about all player's team
 */
export interface BattleEvent_ClearPokemon {
    type: "ClearPokemon";
}

export const BattleEvent_ClearPokemon_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['ClearPokemon']),
});

/**
 * Pokemon revealed during team preview
 */
export interface BattleEvent_RevealTeamPreviewPokemon {
    type: "RevealTeamPreviewPokemon";
    playerIndex: number;
    details: PokemonDetails;
}

export const BattleEvent_RevealTeamPreviewPokemon_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['RevealTeamPreviewPokemon']),
    playerIndex: POSITIVE_INT_SCHEMA,
    details: PokemonDetailsSchema,
});


/**
 * Specified turn number
 */
export interface BattleEvent_Turn {
    type: "Turn";
    turn: number;
}

export const BattleEvent_Turn_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Turn']),
    turn: POSITIVE_INT_SCHEMA,
});

/**
 * A switch made by the player
 */
export interface BattleEvent_Switch {
    type: "Switch";
    pokemon: PokemonIdentTarget;
    details: PokemonDetails;
    condition: PokemonCondition;
}

export const BattleEvent_Switch_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Switch']),
    pokemon: PokemonIdentTargetSchema,
    details: PokemonDetailsSchema,
    condition: PokemonConditionSchema,
});

/**
 * Another pokemon is dragged
 * For example: Red card roar, etc
 */
export interface BattleEvent_Drag {
    type: "Drag";
    pokemon: PokemonIdentTarget;
    details: PokemonDetails;
    condition: PokemonCondition;
}

export const BattleEvent_Drag_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Drag']),
    pokemon: PokemonIdentTargetSchema,
    details: PokemonDetailsSchema,
    condition: PokemonConditionSchema,
});

/**
 * Pokemon was replaced (Illusion)
 */
export interface BattleEvent_Replace {
    type: "Replace";
    pokemon: PokemonIdentTarget;
    details: PokemonDetails;
    condition?: PokemonCondition;
}

export const BattleEvent_Replace_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Replace']),
    pokemon: PokemonIdentTargetSchema,
    details: PokemonDetailsSchema,
    condition: ObjectSchema.optional(PokemonConditionSchema),
});

/**
 * For changed, mega evolved, etc
 */
export interface BattleEvent_DetailsChange {
    type: "DetailsChange";
    pokemon: PokemonIdentTarget;
    details: PokemonDetails;
}

export const BattleEvent_DetailsChange_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['DetailsChange']),
    pokemon: PokemonIdentTargetSchema,
    details: PokemonDetailsSchema,
});

/**
 * Pokemon fainted
 */
export interface BattleEvent_Faint {
    type: "Faint";
    pokemon: PokemonIdentTarget;
}

export const BattleEvent_Faint_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Faint']),
    pokemon: PokemonIdentTargetSchema,
});

/**
 * Swap (Ally switch or similar effects)
 */
export interface BattleEvent_Swap {
    type: "Swap";
    pokemon: PokemonIdentTarget;
    slot: number;
}

export const BattleEvent_Swap_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Swap']),
    pokemon: PokemonIdentTargetSchema,
    slot: POSITIVE_INT_SCHEMA,
});

/**
 * Move used
 */
export interface BattleEvent_Move {
    type: "Move";
    pokemon: PokemonIdentTarget;
    move: string;
    target: PokemonIdentTarget;
    fromEffect?: BattleEffect;
    spread?: PokemonIdentTarget[];
}

export const BattleEvent_Move_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Move']),
    pokemon: PokemonIdentTargetSchema,
    move: STRING_SCHEMA,
    target: PokemonIdentTargetSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    spread: ObjectSchema.optional(ObjectSchema.array(PokemonIdentTargetSchema)),
});

/**
 * Move could not be used
 * Example: Taunt in the same turn
 */
export interface BattleEvent_MoveCannotUse {
    type: "MoveCannotUse";
    pokemon: PokemonIdentTarget;
    move: string;
    effect: BattleEffect;
}

export const BattleEvent_MoveCannotUse_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['MoveCannotUse']),
    pokemon: PokemonIdentTargetSchema,
    move: STRING_SCHEMA,
    effect: BattleEffectSchema,
});

/**
 * Battle ended
 */
export interface BattleEvent_BattleEnded {
    type: "BattleEnded";
    tie: boolean;
    winner?: string;
}

export const BattleEvent_BattleEnded_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['BattleEnded']),
    tie: BOOLEAN_SCHEMA,
    winner: ObjectSchema.optional(STRING_SCHEMA),
});

/**
 * Battle event (major)
 * Represents a major step in the battle
 */
export type BattleEventMajor =
    BattleEvent_Request |
    BattleEvent_TeamPreview | BattleEvent_Start |
    BattleEvent_CallbackTrapped | BattleEvent_CallbackCannotUseMove |
    BattleEvent_GameType | BattleEvent_Gen | BattleEvent_Tier | BattleEvent_Rule |
    BattleEvent_Player |
    BattleEvent_TeamSize | BattleEvent_ClearPokemon | BattleEvent_RevealTeamPreviewPokemon |
    BattleEvent_Turn |
    BattleEvent_Switch | BattleEvent_Drag | BattleEvent_Replace |
    BattleEvent_DetailsChange |
    BattleEvent_Faint |
    BattleEvent_Swap |
    BattleEvent_Move |
    BattleEvent_MoveCannotUse |
    BattleEvent_BattleEnded;

export const BattleEventMajorSchema = ObjectSchema.anyOf([
    BattleEvent_Request_Schema,
    BattleEvent_TeamPreview_Schema, BattleEvent_Start_Schema,
    BattleEvent_CallbackTrapped_Schema, BattleEvent_CallbackCannotUseMove_Schema,
    BattleEvent_GameType_Schema, BattleEvent_Gen_Schema, BattleEvent_Tier_Schema, BattleEvent_Rule_Schema,
    BattleEvent_Player_Schema,
    BattleEvent_TeamSize_Schema, BattleEvent_ClearPokemon_Schema, BattleEvent_RevealTeamPreviewPokemon_Schema,
    BattleEvent_Turn_Schema,
    BattleEvent_Switch_Schema, BattleEvent_Drag_Schema, BattleEvent_Replace_Schema,
    BattleEvent_DetailsChange_Schema,
    BattleEvent_Faint_Schema,
    BattleEvent_Swap_Schema,
    BattleEvent_Move_Schema,
    BattleEvent_MoveCannotUse_Schema,
    BattleEvent_BattleEnded_Schema,
]).withDefaultSchema(ObjectSchema.null());
