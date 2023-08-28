// Ability knowledge

"use strict";

/**
 * Ability knowledge
 */
export interface AbilityKnowledge {
    /**
     * True if known
     */
    known: boolean;

    /**
     * True if revealed
     */
    revealed: boolean;

    /**
     * Current ability
     */
    ability: string;

    /**
     * Base ability
     */
    baseAbility: string;

    /**
     * Number of times the ability effect was activated
     */
    activationCount: number;

    /**
     * True if the ability cannot be swapped
     */
    cannotBeSwapped?: boolean;

    /**
     * True if the ability cannot be changed by another one
     */
    cannotBeChanged?: boolean;

    /**
     * True if the ability cannot be disabled
     */
    cannotBeDisabled?: boolean;
}