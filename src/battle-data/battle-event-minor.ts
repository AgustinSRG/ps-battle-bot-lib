// Battle minor event

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";
import { BattleEffect, BattleEffectSchema } from "./effect";
import { PokemonIdentTarget, PokemonIdentTargetSchema } from "./ident";
import { StatName, StatNameSchema } from "./stats";
import { BOOLEAN_SCHEMA, POSITIVE_INT_SCHEMA, STRING_SCHEMA } from "../utils/schemas";
import { PokemonCondition, PokemonConditionSchema, PokemonStatus, PokemonStatusSchema } from "./condition";

/**
 * Damage dealt
 */
export interface BattleEvent_Damage {
    type: "Damage";
    pokemon: PokemonIdentTarget;
    condition: PokemonCondition;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_Damage_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Damage']),
    pokemon: PokemonIdentTargetSchema,
    condition: PokemonConditionSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * HP healed
 */
export interface BattleEvent_Heal {
    type: "Heal";
    pokemon: PokemonIdentTarget;
    condition: PokemonCondition;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_Heal_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Heal']),
    pokemon: PokemonIdentTargetSchema,
    condition: PokemonConditionSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * HP set
 */
export interface BattleEvent_SetHP {
    type: "SetHP";
    targets: {
        pokemon: PokemonIdentTarget,
        condition: PokemonCondition,
    }[];
}

export const BattleEvent_SetHP_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['SetHP']),
    targets: ObjectSchema.array(ObjectSchema.object({
        pokemon: PokemonIdentTargetSchema,
        condition: PokemonConditionSchema,
    })),
});

/**
 * Boost increased
 */
export interface BattleEvent_Boost {
    type: "Boost";
    pokemon: PokemonIdentTarget;
    stat: StatName;
    amount: number;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_Boost_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Boost']),
    pokemon: PokemonIdentTargetSchema,
    stat: StatNameSchema,
    amount: POSITIVE_INT_SCHEMA,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Boost decreased
 */
export interface BattleEvent_UnBoost {
    type: "UnBoost";
    pokemon: PokemonIdentTarget;
    stat: StatName;
    amount: number;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_UnBoost_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['UnBoost']),
    pokemon: PokemonIdentTargetSchema,
    stat: StatNameSchema,
    amount: POSITIVE_INT_SCHEMA,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Boost set
 */
export interface BattleEvent_SetBoost {
    type: "SetBoost";
    pokemon: PokemonIdentTarget;
    stat: StatName;
    amount: number;
}

export const BattleEvent_SetBoost_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['SetBoost']),
    pokemon: PokemonIdentTargetSchema,
    stat: StatNameSchema,
    amount: POSITIVE_INT_SCHEMA,
});

/**
 * Boost swap
 */
export interface BattleEvent_SwapBoost {
    type: "SwapBoost";
    pokemon: PokemonIdentTarget;
    target: PokemonIdentTarget;
    stats: StatName[];
}

export const BattleEvent_SwapBoost_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['SwapBoost']),
    pokemon: PokemonIdentTargetSchema,
    target: PokemonIdentTargetSchema,
    stats: ObjectSchema.array(StatNameSchema),
});

/**
 * Boost clear (positive)
 */
export interface BattleEvent_ClearPositiveBoost {
    type: "ClearPositiveBoost";
    pokemon: PokemonIdentTarget;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_ClearPositiveBoost_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['ClearPositiveBoost']),
    pokemon: PokemonIdentTargetSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Boost clear (negative)
 */
export interface BattleEvent_ClearNegativeBoost {
    type: "ClearNegativeBoost";
    pokemon: PokemonIdentTarget;
}

export const BattleEvent_ClearNegativeBoost_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['ClearNegativeBoost']),
    pokemon: PokemonIdentTargetSchema,
});

/**
 * Boost clear (all)
 */
export interface BattleEvent_ClearBoost {
    type: "ClearBoost";
    pokemon: PokemonIdentTarget;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_ClearBoost_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['ClearBoost']),
    pokemon: PokemonIdentTargetSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Boost copy
 */
export interface BattleEvent_CopyBoost {
    type: "CopyBoost";
    pokemon: PokemonIdentTarget;
    fromPokemon: PokemonIdentTarget;
    fromEffect?: BattleEffect;
    stats: StatName[];
}

export const BattleEvent_CopyBoost_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['CopyBoost']),
    pokemon: PokemonIdentTargetSchema,
    fromPokemon: PokemonIdentTargetSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    stats: ObjectSchema.array(StatNameSchema),
});

/**
 * All boost inverted
 */
export interface BattleEvent_InvertBoost {
    type: "InvertBoost";
    pokemon: PokemonIdentTarget;
}

export const BattleEvent_InvertBoost_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['InvertBoost']),
    pokemon: PokemonIdentTargetSchema,
});

/**
 * Clears all boosts (of all pokemon)
 */
export interface BattleEvent_ClearAllBoosts {
    type: "ClearAllBoosts";
}

export const BattleEvent_ClearAllBoosts_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['ClearAllBoosts']),
});

/**
 * Critical hit received
 */
export interface BattleEvent_CriticalHit {
    type: "CriticalHit";
    pokemon: PokemonIdentTarget;
}

export const BattleEvent_CriticalHit_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['CriticalHit']),
    pokemon: PokemonIdentTargetSchema,
});

/**
 * Super effective hit received
 */
export interface BattleEvent_SuperEffectiveHit {
    type: "SuperEffectiveHit";
    pokemon: PokemonIdentTarget;
}

export const BattleEvent_SuperEffectiveHit_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['SuperEffectiveHit']),
    pokemon: PokemonIdentTargetSchema,
});

/**
 * Resisted hit received
 */
export interface BattleEvent_ResistedHit {
    type: "ResistedHit";
    pokemon: PokemonIdentTarget;
}

export const BattleEvent_ResistedHit_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['ResistedHit']),
    pokemon: PokemonIdentTargetSchema,
});

/**
 * Immunity
 */
export interface BattleEvent_Immune {
    type: "Immune";
    pokemon: PokemonIdentTarget;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_Immune_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Immune']),
    pokemon: PokemonIdentTargetSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Move missed
 */
export interface BattleEvent_Miss {
    type: "Miss";
    pokemon: PokemonIdentTarget;
    target: PokemonIdentTarget;
}

export const BattleEvent_Miss_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Miss']),
    pokemon: PokemonIdentTargetSchema,
    target: PokemonIdentTargetSchema,
});

/**
 * Move failed to work
 */
export interface BattleEvent_Fail {
    type: "Fail";
    pokemon: PokemonIdentTarget;
    effect?: BattleEffect;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_Fail_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Fail']),
    pokemon: PokemonIdentTargetSchema,
    effect: ObjectSchema.optional(BattleEffectSchema),
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Move was blocked
 */
export interface BattleEvent_Block {
    type: "Block";
    pokemon: PokemonIdentTarget;
    effect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_Block_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Block']),
    pokemon: PokemonIdentTargetSchema,
    effect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Prepare move (like focus punch)
 */
export interface BattleEvent_PrepareMove {
    type: "PrepareMove";
    pokemon: PokemonIdentTarget;
    move: string;
    target?: PokemonIdentTarget;
}

export const BattleEvent_PrepareMove_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['PrepareMove']),
    pokemon: PokemonIdentTargetSchema,
    move: STRING_SCHEMA,
    target: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Must recharge after using a move
 */
export interface BattleEvent_MustRecharge {
    type: "MustRecharge";
    pokemon: PokemonIdentTarget;
}

export const BattleEvent_MustRecharge_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['MustRecharge']),
    pokemon: PokemonIdentTargetSchema,
});

/**
 * Pokemon status changed
 */
export interface BattleEvent_Status {
    type: "Status";
    pokemon: PokemonIdentTarget;
    status: PokemonStatus;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_Status_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Status']),
    pokemon: PokemonIdentTargetSchema,
    status: PokemonStatusSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Status cured
 */
export interface BattleEvent_CureStatus {
    type: "CureStatus";
    pokemon: PokemonIdentTarget;
    status: PokemonStatus;
    fromEffect?: BattleEffect;
}

export const BattleEvent_CureStatus_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['CureStatus']),
    pokemon: PokemonIdentTargetSchema,
    status: PokemonStatusSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
});

/**
 * Team cured
 */
export interface BattleEvent_CureTeam {
    type: "CureTeam";
    playerIndex: number;
}

export const BattleEvent_CureTeam_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['CureTeam']),
    playerIndex: POSITIVE_INT_SCHEMA,
});

/**
 * Item revealed
 */
export interface BattleEvent_ItemReveal {
    type: "ItemReveal";
    pokemon: PokemonIdentTarget;
    item: string;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_ItemReveal_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['ItemReveal']),
    pokemon: PokemonIdentTargetSchema,
    item: STRING_SCHEMA,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Item removed (stolen, consumed, etc)
 */
export interface BattleEvent_ItemRemove {
    type: "ItemRemove";
    pokemon: PokemonIdentTarget;
    item: string;
    eaten: boolean;
    fromEffect?: BattleEffect;
}

export const BattleEvent_ItemRemove_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['ItemRemove']),
    pokemon: PokemonIdentTargetSchema,
    item: STRING_SCHEMA,
    eaten: BOOLEAN_SCHEMA,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
});

/**
 * Ability revealed
 */
export interface BattleEvent_AbilityReveal {
    type: "AbilityReveal";
    pokemon: PokemonIdentTarget;
    ability: string;
    activationFailed: boolean;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_AbilityReveal_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['AbilityReveal']),
    pokemon: PokemonIdentTargetSchema,
    ability: STRING_SCHEMA,
    activationFailed: BOOLEAN_SCHEMA,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Transformed into other pokemon
 */
export interface BattleEvent_Transform {
    type: "Transform";
    pokemon: PokemonIdentTarget;
    target: PokemonIdentTarget;
    fromEffect?: BattleEffect;
}

export const BattleEvent_Transform_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Transform']),
    pokemon: PokemonIdentTargetSchema,
    target: PokemonIdentTargetSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
});

/**
 * Forme changed
 */
export interface BattleEvent_FormeChange {
    type: "FormeChange";
    pokemon: PokemonIdentTarget;
    species: string;
    fromEffect?: BattleEffect;
}

export const BattleEvent_FormeChange_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['FormeChange']),
    pokemon: PokemonIdentTargetSchema,
    species: STRING_SCHEMA,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
});

/**
 * Mega evolution
 */
export interface BattleEvent_MegaEvolution {
    type: "MegaEvolution";
    pokemon: PokemonIdentTarget;
    species: string;
    stone: string;
}

export const BattleEvent_MegaEvolution_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['MegaEvolution']),
    pokemon: PokemonIdentTargetSchema,
    species: STRING_SCHEMA,
    stone: STRING_SCHEMA,
});


/**
 * Ultra Burst
 */
export interface BattleEvent_UltraBurst {
    type: "UltraBurst";
    pokemon: PokemonIdentTarget;
    species: string;
    item: string;
}

export const BattleEvent_UltraBurst_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['UltraBurst']),
    pokemon: PokemonIdentTargetSchema,
    species: STRING_SCHEMA,
    item: STRING_SCHEMA,
});

/**
 * Terastallize
 */
export interface BattleEvent_Terastallize {
    type: "Terastallize";
    pokemon: PokemonIdentTarget;
    teraType: string;
}

export const BattleEvent_Terastallize_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Terastallize']),
    pokemon: PokemonIdentTargetSchema,
    teraType: STRING_SCHEMA,
});


/**
 * Effect started
 */
export interface BattleEvent_EffectStart {
    type: "EffectStart";
    pokemon: PokemonIdentTarget;
    effect: BattleEffect;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
    extraData?: {
        typeAdded?: string;
        typesChanged?: string[];
        moveDisabled?: string;
        moveMimic?: string;
    };
}

export const BattleEvent_EffectStart_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['EffectStart']),
    pokemon: PokemonIdentTargetSchema,
    effect: BattleEffectSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),

    extraData: ObjectSchema.optional(ObjectSchema.object({
        typeAdded: ObjectSchema.optional(STRING_SCHEMA),
        typesChanged: ObjectSchema.optional(ObjectSchema.array(STRING_SCHEMA)),
        moveDisabled: ObjectSchema.optional(STRING_SCHEMA),
        moveMimic: ObjectSchema.optional(STRING_SCHEMA),
    })),
});

/**
 * Effect ended
 */
export interface BattleEvent_EffectEnd {
    type: "EffectEnd";
    pokemon: PokemonIdentTarget;
    effect: BattleEffect;
    fromEffect?: BattleEffect;
}

export const BattleEvent_EffectEnd_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['EffectEnd']),
    pokemon: PokemonIdentTargetSchema,
    effect: BattleEffectSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
});

/**
 * Single turn status
 */
export interface BattleEvent_TurnStatus {
    type: "TurnStatus";
    pokemon: PokemonIdentTarget;
    effect: BattleEffect;
}

export const BattleEvent_TurnStatus_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['TurnStatus']),
    pokemon: PokemonIdentTargetSchema,
    effect: BattleEffectSchema,
});


/**
 * Single move status
 */
export interface BattleEvent_MoveStatus {
    type: "MoveStatus";
    pokemon: PokemonIdentTarget;
    effect: BattleEffect;
}

export const BattleEvent_MoveStatus_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['MoveStatus']),
    pokemon: PokemonIdentTargetSchema,
    effect: BattleEffectSchema,
});

/**
 * Effect activated
 */
export interface BattleEvent_ActivateEffect {
    type: "ActivateEffect";
    pokemon: PokemonIdentTarget;
    effect: BattleEffect;
    target?: PokemonIdentTarget;

    extraData?: {
        item?: string;
        move?: string;
        number?: number;
        ability?: string;
        ability2?: string;
    };
}


export const BattleEvent_ActivateEffect_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['ActivateEffect']),
    pokemon: PokemonIdentTargetSchema,
    effect: BattleEffectSchema,
    target: ObjectSchema.optional(PokemonIdentTargetSchema),

    extraData: ObjectSchema.optional(ObjectSchema.object({
        item: ObjectSchema.optional(STRING_SCHEMA),
        move: ObjectSchema.optional(STRING_SCHEMA),
        number: ObjectSchema.optional(POSITIVE_INT_SCHEMA),
        ability: ObjectSchema.optional(STRING_SCHEMA),
        ability2: ObjectSchema.optional(STRING_SCHEMA),
    })),
});

/**
 * Side condition started
 */
export interface BattleEvent_SideStart {
    type: "SideStart";
    playerIndex: number;
    effect: BattleEffect;
    persistent: boolean;
}

export const BattleEvent_SideStart_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['SideStart']),
    playerIndex: POSITIVE_INT_SCHEMA,
    effect: BattleEffectSchema,
    persistent: BOOLEAN_SCHEMA,
});


/**
 * Side condition started
 */
export interface BattleEvent_SideEnd {
    type: "SideEnd";
    playerIndex: number;
    effect: BattleEffect;
}

export const BattleEvent_SideEnd_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['SideEnd']),
    playerIndex: POSITIVE_INT_SCHEMA,
    effect: BattleEffectSchema,
});

/**
 * Swap side conditions with the opponents
 * Won't work for more than 2 players
 */
export interface BattleEvent_SwapSideConditions {
    type: "SwapSideConditions";
}

export const BattleEvent_SwapSideConditions_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['SwapSideConditions']),
});

/**
 * Weather changed
 */
export interface BattleEvent_Weather {
    type: "Weather";
    effect: BattleEffect;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_Weather_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['Weather']),
    effect: BattleEffectSchema,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Field started
 */
export interface BattleEvent_FieldStart {
    type: "FieldStart";
    effect: BattleEffect;
    persistent: boolean;
    fromEffect?: BattleEffect;
    ofPokemon?: PokemonIdentTarget;
}

export const BattleEvent_FieldStart_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['FieldStart']),
    effect: BattleEffectSchema,
    persistent: BOOLEAN_SCHEMA,
    fromEffect: ObjectSchema.optional(BattleEffectSchema),
    ofPokemon: ObjectSchema.optional(PokemonIdentTargetSchema),
});

/**
 * Field ended
 */
export interface BattleEvent_FieldEnd {
    type: "FieldEnd";
    effect: BattleEffect;
}

export const BattleEvent_FieldEnd_Schema = ObjectSchema.object({
    type: ObjectSchema.string().withEnumeration(['FieldEnd']),
    effect: BattleEffectSchema,
});


/**
 * Battle minor event
 * Battle knowledge event
 */
export type BattleEventMinor =
    BattleEvent_Damage | BattleEvent_Heal | BattleEvent_SetHP |
    BattleEvent_Boost | BattleEvent_UnBoost | BattleEvent_SetBoost | BattleEvent_SwapBoost | BattleEvent_CopyBoost | BattleEvent_InvertBoost |
    BattleEvent_ClearPositiveBoost | BattleEvent_ClearNegativeBoost | BattleEvent_ClearBoost | BattleEvent_ClearAllBoosts |
    BattleEvent_CriticalHit | BattleEvent_SuperEffectiveHit | BattleEvent_ResistedHit | BattleEvent_Immune |
    BattleEvent_Miss | BattleEvent_Fail | BattleEvent_Block |
    BattleEvent_PrepareMove | BattleEvent_MustRecharge |
    BattleEvent_Status | BattleEvent_CureStatus | BattleEvent_CureTeam |
    BattleEvent_ItemReveal | BattleEvent_ItemRemove |
    BattleEvent_AbilityReveal |
    BattleEvent_Transform | BattleEvent_FormeChange | BattleEvent_MegaEvolution | BattleEvent_UltraBurst | BattleEvent_Terastallize |
    BattleEvent_EffectStart | BattleEvent_EffectEnd | BattleEvent_TurnStatus | BattleEvent_MoveStatus |
    BattleEvent_ActivateEffect |
    BattleEvent_SideStart | BattleEvent_SideEnd | BattleEvent_SwapSideConditions |
    BattleEvent_Weather |
    BattleEvent_FieldStart | BattleEvent_FieldEnd;

export const BattleEventMinorSchema = ObjectSchema.anyOf([
    BattleEvent_Damage_Schema, BattleEvent_Heal_Schema, BattleEvent_SetHP_Schema,
    BattleEvent_Boost_Schema, BattleEvent_UnBoost_Schema, BattleEvent_SetBoost_Schema, BattleEvent_SwapBoost_Schema, BattleEvent_CopyBoost_Schema, BattleEvent_InvertBoost_Schema,
    BattleEvent_ClearPositiveBoost_Schema, BattleEvent_ClearNegativeBoost_Schema, BattleEvent_ClearBoost_Schema, BattleEvent_ClearAllBoosts_Schema,
    BattleEvent_CriticalHit_Schema, BattleEvent_SuperEffectiveHit_Schema, BattleEvent_ResistedHit_Schema, BattleEvent_Immune_Schema,
    BattleEvent_Miss_Schema, BattleEvent_Fail_Schema, BattleEvent_Block_Schema,
    BattleEvent_PrepareMove_Schema, BattleEvent_MustRecharge_Schema,
    BattleEvent_Status_Schema, BattleEvent_CureStatus_Schema, BattleEvent_CureTeam_Schema,
    BattleEvent_ItemReveal_Schema, BattleEvent_ItemRemove_Schema,
    BattleEvent_AbilityReveal_Schema,
    BattleEvent_Transform_Schema, BattleEvent_FormeChange_Schema, BattleEvent_MegaEvolution_Schema, BattleEvent_UltraBurst_Schema, BattleEvent_Terastallize_Schema,
    BattleEvent_EffectStart_Schema, BattleEvent_EffectEnd_Schema, BattleEvent_TurnStatus_Schema, BattleEvent_MoveStatus_Schema,
    BattleEvent_ActivateEffect_Schema,
    BattleEvent_SideStart_Schema, BattleEvent_SideEnd_Schema, BattleEvent_SwapSideConditions_Schema,
    BattleEvent_Weather_Schema,
    BattleEvent_FieldStart_Schema, BattleEvent_FieldEnd_Schema
]).withDefaultSchema(ObjectSchema.null());
