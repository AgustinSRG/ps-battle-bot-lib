// Top damage decision algorithm

"use strict";

import { getActiveSize } from "../../../battle-data";
import { randomlyChoose } from "../../../utils/random";
import { SwitchSubDecision, MoveSubDecision, ShiftSubDecision, ActiveSubDecision } from "../../active-decision";
import { DecisionAlgorithm } from "../../algorithm";
import { DecisionMakeContext, DecisionSlot } from "../../context";
import { BattleDecision } from "../../decision";
import { DecisionMaker, makeDecisionsSimple } from "../../decision-make";
import { ReviveSubDecision } from "../../force-switch-decision";
import { TeamDecision } from "../../team-decision";
import { evaluateMoveDecision } from "./evaluate-move";
import { evaluatePokemonForceSwitch, evaluatePokemonTeamPreview } from "./evaluate-pokemon";

/**
 * Top damage decision algorithm
 */
export class TopDamageDecisionAlgorithm implements DecisionAlgorithm, DecisionMaker {
    public async chooseTeam(context: DecisionMakeContext, availableTeamDecisions: TeamDecision[]): Promise<TeamDecision> {
        const battle = context.battle;
        const activeLength = getActiveSize(battle.status.gameType);

        let chosenDecisions: TeamDecision[] = [];
        let bestEvaluation = 0;

        // Evaluate every pokemon

        const evaluations = new Map<number, number>();

        for (let requestIndex = 0; requestIndex < battle.request.side.pokemon.length; requestIndex++) {
            const value = evaluatePokemonTeamPreview(battle, requestIndex);
            context.analyzer.debug(`Evaluated pokemon [${requestIndex}] - Value: ${value}`);
            evaluations.set(requestIndex, value);
        }

        // Check decisions

        for (const des of availableTeamDecisions) {
            let val = 0;

            for (let i = 0; i < activeLength && i < des.teamOrder.length; i++) {
                val += (evaluations.get(des.teamOrder[i]) || 0);
            }

            if (val > bestEvaluation) {
                chosenDecisions = [des];
                bestEvaluation = val;
            } else if (val === bestEvaluation) {
                chosenDecisions.push(des);
            }
        }

        if (chosenDecisions.length > 0) {
            return randomlyChoose(chosenDecisions);
        } else {
            return randomlyChoose(availableTeamDecisions);
        }
    }

    public async chooseForceSwitch(context: DecisionMakeContext, activeSlot: DecisionSlot, availableSwitchDecisions: SwitchSubDecision[]): Promise<SwitchSubDecision> {
        const battle = context.battle;

        let chosenDecisions: SwitchSubDecision[] = [];
        let bestEvaluation = 0;

        for (const des of availableSwitchDecisions) {
            const val = evaluatePokemonForceSwitch(battle, des.pokemonIndex);

            context.analyzer.debug(`Evaluated switch [${des.pokemonIndex}] - Value: ${val}`);

            if (val > bestEvaluation) {
                chosenDecisions = [des];
                bestEvaluation = val;
            } else if (val === bestEvaluation) {
                chosenDecisions.push(des);
            }
        }

        if (chosenDecisions.length > 0) {
            return randomlyChoose(chosenDecisions);
        } else {
            return randomlyChoose(availableSwitchDecisions);
        }
    }

    public async chooseRevival(context: DecisionMakeContext, availableRevivals: ReviveSubDecision[]): Promise<ReviveSubDecision> {
        return randomlyChoose(availableRevivals);
    }

    public async chooseActive(context: DecisionMakeContext, activeSlot: DecisionSlot, availableMoveDecisions: MoveSubDecision[], availableSwitchDecisions: SwitchSubDecision[], availableShiftDecisions: ShiftSubDecision[]): Promise<ActiveSubDecision> {
        const battle = context.battle;

        let chosenDecisions: MoveSubDecision[] = [];
        let bestEvaluation = -Infinity;

        for (const moveDecision of availableMoveDecisions) {
            const evaluation = evaluateMoveDecision(context.analyzer, battle, activeSlot, moveDecision);

            context.analyzer.debug(`Evaluated move [${moveDecision.moveIndex}:${moveDecision.gimmick || "normal"}] - Value: ${evaluation}`);

            if (bestEvaluation < evaluation) {
                chosenDecisions = [moveDecision];
                bestEvaluation = evaluation;
            } else if (bestEvaluation === evaluation) {
                chosenDecisions.push(moveDecision);
            }
        }

        if (bestEvaluation <= 0 && availableSwitchDecisions.length > 0) {
            return this.chooseForceSwitch(context, activeSlot, availableSwitchDecisions);
        }

        if (chosenDecisions.length > 0) {
            return randomlyChoose(chosenDecisions);
        } else {
            return randomlyChoose(availableMoveDecisions);
        }
    }

    public async decide(context: DecisionMakeContext): Promise<BattleDecision> {
        return makeDecisionsSimple(context, this, null, true);
    }
}
