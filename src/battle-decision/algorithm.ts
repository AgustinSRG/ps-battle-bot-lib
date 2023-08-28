// Decision algorithm definition

"use strict";

import { DecisionMakeContext } from "./context";
import { BattleDecision } from "./decision";

/**
 * Decision algorithm
 */
export interface DecisionAlgorithm {
    /**
     * Makes a decision given the context
     * @param context The context
     * @returns The battle decision 
     */
    decide(context: DecisionMakeContext): Promise<BattleDecision>;
}
