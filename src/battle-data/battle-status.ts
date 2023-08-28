// Battle status

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";
import { PokemonIdentTarget } from "./ident";
import { toId } from "../utils/id";

/**
 * Game type
 */
export type BattleGameType = "singles" | "doubles" | "triples" | "multi" | "freeforall"

export const BattleGameTypeSchema = ObjectSchema.string().withEnumeration(['singles', 'doubles', 'triples', 'multi', 'freeforall']);

const BattleGameTypeActiveSizes = {
    singles: 1,
    doubles: 2,
    triples: 3,
    multi: 1,
    freeforall: 1,
};

/**
 * Gets the size for the active for each game type
 * @param gameType The game type
 * @returns The active size
 */
export function getActiveSize(gameType: BattleGameType) {
    return BattleGameTypeActiveSizes[gameType] || 1;
}

/**
 * Global condition of the battle
 */
export interface BattleGlobalCondition {
    /**
     * Field id
     */
    id: string;

    /**
     * Turn the field was set on
     */
    turn: number;

    /**
     * Estimated duration of the field (in turns)
     */
    estimatedDuration: number;

    /**
     * Pokemon who set the field
     */
    setBy?: PokemonIdentTarget;
}

/**
 * Global status of the battle
 */
export interface BattleGlobalStatus {
    /**
     * Generation
     */
    gen: number;

    /**
     * Game type
     */
    gameType: BattleGameType;

    /**
     * Tier
     */
    tier: string;

    /**
     * Active rules
     */
    rules: Set<string>;

    /**
     * True if sleep clause active
     */
    isSleepClause: boolean;

    /**
     * True if inverse type chart
     */
    inverse: boolean;

    /**
     * True if the battle format has team preview
     */
    teamPreview: boolean;

    /**
     * Team preview size
     * 0 = Full team
     */
    teamPreviewSize: number;

    /**
     * Active weather
     */
    weather?: BattleGlobalCondition;

    /**
     * Active fields
     */
    fields: Map<string, BattleGlobalCondition>;

    /**
     * Active ability effects
     * For example Neutralizing gas, sword of ruin, etc
     */
    abilityEffects: Set<string>;
}

/**
 * List of weathers
 */
export const Weathers = {
    None: toId("none"),
    RainDance: toId("RainDance"),
    PrimordialSea: toId("PrimordialSea"),
    SunnyDay: toId("SunnyDay"),
    DesolateLand: toId("DesolateLand"),
    Sandstorm: toId("Sandstorm"),
    Hail: toId("Hail"),
    Snow: toId("Snow"),
    DeltaStream: toId("DeltaStream"),
};

/**
 * List of battle fields
 */
export const BattleFields = {
    ElectricTerrain: toId("Electric Terrain"),
    GrassyTerrain: toId("Grassy Terrain"),
    MistyTerrain: toId("Misty Terrain"),
    PsychicTerrain: toId("Psychic Terrain"),
    MudSport: toId("Mud Sport"),
    WaterSport: toId("Water Sport"),
    Gravity: toId("Gravity"),
    MagicRoom: toId("Magic Room"),
    TrickRoom: toId("Trick Room"),
    WonderRoom: toId("Wonder Room"),
};

export const AbilityEffects = {
    AirLock: toId("Air Lock"),
    AuraBreak: toId("Aura Break"),
    DarkAura: toId("Dark Aura"),
    FairyAura: toId("Fairy Aura"),
    NeutralizingGas: toId("Neutralizing Gas"),
    BeadsOfRuin: toId("Beads of Ruin"),
    TabletsOfRuin: toId("Tablets of Ruin"),
    SwordOfRuin: toId("Sword of Ruin"),
    VesselOfRuin: toId("Vessel of Ruin"),
};
