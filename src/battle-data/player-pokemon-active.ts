// Active pokemon

"use strict";

import { AbilityKnowledge } from "./ability";
import { PokemonCondition } from "./condition";
import { PokemonDetails } from "./details";
import { PokemonIdent } from "./ident";
import { ItemKnowledge } from "./item";
import { PokemonMove } from "./move";
import { PokemonKnownStats, PokemonKnownStatsTransform, StatName } from "./stats";

/**
 * Active pokemon
 */
export interface BattleActivePokemon {
    /**
     * Slot
     */
    slot: number;

    /**
     * Ident
     */
    ident: PokemonIdent;

    /**
     * Index of the pokemon in the team
     */
    index: number;

    /**
     * Details
     */
    details: PokemonDetails;

    /**
     * Condition
     */
    condition: PokemonCondition;

    /**
     * Stats
     */
    stats: PokemonKnownStats;

    /**
     * Boosts
     */
    boosts: Map<StatName, number>;

    /**
     * Moves
     */
    moves: Map<string, PokemonMove>;

    /**
     * Item
     */
    item: ItemKnowledge;

    /**
     * Ability
     */
    ability: AbilityKnowledge;

    /**
     * List of active volatiles
     */
    volatiles: Set<string>;

    /**
     * Arguments for the volatiles
     */
    volatilesData: {
        /**
         * Type added
         */
        typeAdded?: string;

        /**
         * Types changed
         */
        typesChanged?: string[];

        /**
         * Move disabled
         */
        moveDisabled?: string;

        /**
         * Move mimicking
         */
        moveMimic?: string;

        /**
         * Number of stockpile levels (0 - 3)
         */
        stockpileLevel?: number,

        /**
         * Number of fallen pokemon (Boosting Supreme Overlord)
         */
        fallenLevel?: number;

        /**
         * Boosted stat for ProtoSynthesis and Quark Drive
         */
        boostedStat?: StatName;

        /**
         * Number of perish song turns left
         */
        perishTurnsLeft?: number;

        /**
         * Details of the pokemon transformed into
         */
        transformedInfo?: {
            playerIndex: number;
            pokemonIndex: number;
            details: PokemonDetails;
            stats: PokemonKnownStatsTransform;
            moves: Map<string, PokemonMove>;
        },

        /**
         * Index of the pokemon being impersonated
         */
        impersonating?: number;

        /**
         * Burned sleep turns since switch in
         */
        burnedSleepTurns?: number;

        /**
         * The number of times the TOX status took effect
         * Each time, the damage doubles
         */
        toxDamageTimes?: number;

        /**
         * This pokemon could be a fake (Illusion)
         */
        possibleFake?: boolean;

        /**
         * This pokemon is an illusion for sure
         */
        fake?: boolean;

        /**
         * Guess of the pokemon species this could be
         */
        fakeGuess?: string;
    },

    /**
     * List of single turn statuses
     */
    singleTurnStatuses: Set<string>;

    /**
     * Single move statuses
     */
    singleMoveStatuses: Set<string>;

    /**
     * Turn the when pokemon was switched
     */
    switchedOnTurn: number;

    /**
     * Last move used (for encore, disabled, etc)
     */
    lastMove?: string;

    /**
     * Times used the last move in a row
     */
    timesUsedMoveInARow?: number;

    /**
     * Number of times the pokemon was hit by a move
     */
    timesHit: number;

    /**
     * Total number of burned sleep turns
     */
    totalBurnedSleepTurns: number;

    /**
     * True if slept by rest
     */
    sleptByRest: boolean;
}
