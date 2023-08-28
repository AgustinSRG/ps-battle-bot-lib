// Force-switch decision

"use strict";

import { Battle } from "../battle-data";
import { PassSubDecision, SwitchSubDecision } from "./active-decision";
import { PASS_DECISION } from "./static-decisions";

/**
 * Force-switch decision
 */
export interface ForceSwitchDecision {
    type: "force-switch";

    /**
     * One sub decision for each active slot
     */
    subDecisions: ForceSwitchSubDecision[];
}

/**
 * Sub decision for each active
 */
export type ForceSwitchSubDecision =  SwitchSubDecision | ReviveSubDecision | PassSubDecision;

/**
 * Revive
 */
export interface ReviveSubDecision {
    type: "revive";

    /**
     * Index of the pokemon to revive (index in the request)
     */
    pokemonIndex: number;
}

/**
 * Generates list of available decisions in a force-switch situation
 * @param battle The Battle
 * @param requestIndex The request index
 * @returns The list of available decisions
 */
export function generateForceSwitchSubDecisions(battle: Battle, requestIndex: number): ForceSwitchSubDecision[] {
    if (battle.mainPlayer === undefined || !battle.request || !battle.request.forceSwitch) {
        return [];
    }

    if (!battle.request.forceSwitch[requestIndex]) {
        return [PASS_DECISION];
    }

    const sidePokemon = battle.request.side.pokemon[requestIndex];

    if (!sidePokemon) {
        return [PASS_DECISION];
    }

    const result: ForceSwitchSubDecision[] = [];

    if (sidePokemon.reviving) {
        for (let pokemonIndex = 0; pokemonIndex < battle.request.side.pokemon.length; pokemonIndex++) {
            const pokemon = battle.request.side.pokemon[pokemonIndex];

            if (pokemon.active || !pokemon.condition.fainted) {
                continue; // We cannot revive an active pokemon or if the pokemon is already alive
            }

            result.push({
                type: "revive",
                pokemonIndex: pokemonIndex,
            });
        }
    } else {
        for (let pokemonIndex = 0; pokemonIndex < battle.request.side.pokemon.length; pokemonIndex++) {
            const pokemon = battle.request.side.pokemon[pokemonIndex];

            if (pokemon.active || pokemon.condition.fainted) {
                continue; // We cannot switch into an active or fainted pokemon
            }

            result.push({
                type: "switch",
                pokemonIndex: pokemonIndex,
            });
        }
    }

    return result;
}
