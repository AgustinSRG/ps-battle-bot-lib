// Random decision algorithm

"use strict";

import { randomlyChoose } from "../../../utils/random";
import { SwitchSubDecision, MoveSubDecision, ShiftSubDecision, ActiveSubDecision } from "../../active-decision";
import { DecisionAlgorithm } from "../../algorithm";
import { DecisionMakeContext, DecisionSlot } from "../../context";
import { BattleDecision } from "../../decision";
import { DecisionMaker, makeDecisionsSimple } from "../../decision-make";
import { ReviveSubDecision } from "../../force-switch-decision";
import { TeamDecision } from "../../team-decision";

/**
 * Random decision algorithm configuration
 */
export interface RandomDecisionAlgorithmConfig {
    /**
     * Switch chance (0 - 1)
     */
    switchChance?: number;
}

/**
 * Random decision algorithm
 */
export class RandomDecisionAlgorithm implements DecisionAlgorithm, DecisionMaker {
    /**
     * Switch chance (0 - 1)
     */
    public switchChance: number;

    /**
     * Instantiates the algorithm
     * @param config Configuration
     */
    constructor(config?: RandomDecisionAlgorithmConfig) {
        this.switchChance = 0;

        if (config) {
            this.switchChance = config.switchChance || 0;
        }
    }

    public async chooseTeam(context: DecisionMakeContext, availableTeamDecisions: TeamDecision[]): Promise<TeamDecision> {
        return randomlyChoose(availableTeamDecisions);
    }

    public async chooseForceSwitch(context: DecisionMakeContext, activeSlot: DecisionSlot, availableSwitchDecisions: SwitchSubDecision[]): Promise<SwitchSubDecision> {
        return randomlyChoose(availableSwitchDecisions);
    }

    public async chooseRevival(context: DecisionMakeContext, availableRevivals: ReviveSubDecision[]): Promise<ReviveSubDecision> {
        return randomlyChoose(availableRevivals);
    }

    public async chooseActive(context: DecisionMakeContext, activeSlot: DecisionSlot, availableMoveDecisions: MoveSubDecision[], availableSwitchDecisions: SwitchSubDecision[], availableShiftDecisions: ShiftSubDecision[]): Promise<ActiveSubDecision> {
        if (availableSwitchDecisions.length > 0 && Math.random() < this.switchChance) {
            // Switch
            return randomlyChoose(availableSwitchDecisions);
        } else {
            return randomlyChoose(availableMoveDecisions);
        }
    }

    public async decide(context: DecisionMakeContext): Promise<BattleDecision> {
        return makeDecisionsSimple(context, this);
    }
}