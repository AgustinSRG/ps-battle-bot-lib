// Side pokemon

"use strict";

import { AbilityKnowledge } from "./ability";
import { PokemonCondition } from "./condition";
import { PokemonDetails } from "./details";
import { PokemonIdent } from "./ident";
import { ItemKnowledge } from "./item";
import { PokemonMove } from "./move";
import { PokemonKnownStats } from "./stats";

/**
 * Battle side pokemon status
 */
export interface BattleSidePokemon {
    /**
     * Index in the team
     */
    index: number;

    /**
     * Ident
     */
    ident: PokemonIdent;

    /**
     * True if revealed
     */
    revealed: boolean;

    /**
     * Is active
     */
    active: boolean;

    /**
     * If active, the slot
     */
    activeSlot?: number;

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
