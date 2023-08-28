// Battle bot battle status

"use strict";

import { BattleFormatDetails } from "./config";
import { BattleAnalyzer } from "../battle-analyzer";
import { Battle, BattleEvent } from "../battle-data";
import { BattleDecisionScenario, DecisionAlgorithm, BattleDecision } from "../battle-decision";
import { CancellablePromise } from "../utils/cancellable-promise";

/**
 * Internal status of a battle
 */
export interface BattleBotBattleStatus {
    /**
     * Battle current status
     */
    battle: Battle;

    /**
     * Full battle log
     */
    log: BattleEvent[];

    /**
     * Format details
     */
    formatDetails: BattleFormatDetails;

    /**
     * Previous scenarios (for more context)
     */
    previousScenarios: BattleDecisionScenario[];

    /**
     * Max number of previous scenarios to keep
     */
    scenariosMaxKeep: number;

    /**
     * Timeout to make a decision
     */
    decisionTimeout?: NodeJS.Timeout;

    /**
     * True if playing
     */
    playing: boolean;

    /**
     * Analyzer
     */
    analyzer?: BattleAnalyzer;

    /**
     * Decision algorithm
     */
    decisionAlgorithm?: DecisionAlgorithm;

    /**
     * Decision promise
     */
    decisionPromise?: CancellablePromise<BattleDecision>;
}
