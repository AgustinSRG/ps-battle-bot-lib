// Decision context

"use strict";

import { BattleAnalyzer } from "../battle-analyzer";
import { Battle, BattleEvent } from "../battle-data";
import { BattleDecision } from "./decision";

/**
 * Context in order to make decisions
 */
export interface DecisionMakeContext {
    /**
     * The battle
     */
    battle: Battle;

    /**
     * The battle analyzer
     */
    analyzer: BattleAnalyzer;

    /**
     * The full battle log
     * (List of battle events)
     */
    battleLog: BattleEvent[];

    /**
     * Previous scenarios (for more context)
     */
    previousScenarios: BattleDecisionScenario[];
}

/**
 * Scenario in the battle when a decision was made
 */
export interface BattleDecisionScenario {
    /**
     * The battle status for that scenario
     */
    battle: Battle;

    /**
     * The decision made
     */
    decision?: BattleDecision;
}

export interface DecisionSlot {
    /**
     * Active slot, when accessing player.active
     */
    activeSlot: number;

    /**
     * Request index, when checking in the request active or side.pokemon
     */
    requestIndex: number;
}
