// Generic NPC decision algorithm

"use strict";

import { VolatileStatuses } from "../../../battle-data";
import { calcHazardsDamage, checkFoeSwitchedLastTurn, findMove } from "../../../battle-helpers";
import { getHPPercent } from "../../../showdown-battle-parser/parser-utils";
import { randomlyChoose } from "../../../utils/random";
import { SwitchSubDecision, MoveSubDecision, ShiftSubDecision, ActiveSubDecision } from "../../active-decision";
import { DecisionAlgorithm } from "../../algorithm";
import { DecisionMakeContext, DecisionSlot } from "../../context";
import { BattleDecision } from "../../decision";
import { DecisionMaker, makeDecisionsSimple } from "../../decision-make";
import { ReviveSubDecision } from "../../force-switch-decision";
import { PASS_DECISION } from "../../static-decisions";
import { TeamDecision } from "../../team-decision";
import { GenericNPCContext, initGenericNPCContext } from "./context-extra-data";
import { classifyDamageMoves } from "./evaluate-move-damage";
import { classifyStatusMoves } from "./evaluate-move-status";
import { checkBadVolatileCondition, evaluatePokemon } from "./evaluate-pokemon";

export * from "./context-extra-data"; 

/**
 * Generic NPC decision algorithm
 */
export class GenericNPCDecisionAlgorithm implements DecisionAlgorithm, DecisionMaker<GenericNPCContext> {
    public async chooseTeam(context: DecisionMakeContext, availableTeamDecisions: TeamDecision[]): Promise<TeamDecision> {
        // Randomly choose a lead
        return randomlyChoose(availableTeamDecisions);
    }

    public async chooseForceSwitch(context: DecisionMakeContext, activeSlot: DecisionSlot, availableSwitchDecisions: SwitchSubDecision[], contextExtraData: GenericNPCContext): Promise<SwitchSubDecision> {
        const battle = context.battle;

        let chosenDecisions: SwitchSubDecision[] = [];
        let bestEvaluation = 0;

        for (const des of availableSwitchDecisions) {
            const val = await evaluatePokemon(battle, des.pokemonIndex);

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
        // Randomly choose a revival when requested
        return randomlyChoose(availableRevivals);
    }

    public async chooseActive(context: DecisionMakeContext, activeSlot: DecisionSlot, availableMoveDecisions: MoveSubDecision[], availableSwitchDecisions: SwitchSubDecision[], availableShiftDecisions: ShiftSubDecision[], contextExtraData: GenericNPCContext): Promise<ActiveSubDecision> {
        const decision = await this.chooseActiveInternal(context, activeSlot, availableMoveDecisions, availableSwitchDecisions, availableShiftDecisions, contextExtraData);
        
        if (decision.type === "move") {
            const reqActive = context.battle.request.active[activeSlot.requestIndex];

            const move = reqActive.moves[decision.moveIndex];

            if (move) {
                const moveData = findMove(context.battle.status.gen, move.id);

                if (moveData.category === "Status") {
                    contextExtraData.otherDecisions.set(activeSlot.activeSlot, "status-move");
                } else {
                    contextExtraData.otherDecisions.set(activeSlot.activeSlot, "damage-move");
                }
            }
        } else if (decision.type === "switch") {
            contextExtraData.otherDecisions.set(activeSlot.activeSlot, "switch");
        }

        return decision;
    }

    public async chooseActiveInternal(context: DecisionMakeContext, activeSlot: DecisionSlot, availableMoveDecisions: MoveSubDecision[], availableSwitchDecisions: SwitchSubDecision[], availableShiftDecisions: ShiftSubDecision[], contextExtraData: GenericNPCContext): Promise<ActiveSubDecision> {
        const battle = context.battle;
        const mainPlayer = battle.players.get(battle.mainPlayer);

        if (!mainPlayer) {
            return PASS_DECISION;
        }

        const active = mainPlayer.active.get(activeSlot.activeSlot);

        if (!active) {
            return PASS_DECISION;
        }

        // Compute best switch

        let bestSwitch: SwitchSubDecision;
        let bestSwitchEvaluation: number;

        if (availableSwitchDecisions.length > 0) {
            bestSwitch = await this.chooseForceSwitch(context, activeSlot, availableSwitchDecisions, contextExtraData);
            bestSwitchEvaluation = await evaluatePokemon(battle, bestSwitch.pokemonIndex);
        }

        if (bestSwitch && active.volatiles.has(VolatileStatuses.PerishSong) && active.volatilesData.perishTurnsLeft === 1) {
            context.analyzer.debug(`Switching due to perish song effect next turn [slot=${activeSlot.activeSlot}]`);
            return bestSwitch; // Switch to prevent perish song
        }

        // Evaluate active

        const currentPokemonEvaluation = await evaluatePokemon(battle, activeSlot.requestIndex, true);
        
        const hasBadVolatileCondition = checkBadVolatileCondition(battle, active);
        const hasSubstitute = active.volatiles.has(VolatileStatuses.Substitute);
        const faintsByHazards = calcHazardsDamage(battle, mainPlayer, active) >= getHPPercent(active.condition);
        const switchedLastTurn = battle.turn > 1 && active.switchedOnTurn === battle.turn - 1;

        context.analyzer.debug(`Evaluated current active [slot=${activeSlot.activeSlot}] - Value: ${currentPokemonEvaluation} | hasBadVolatileCondition=${hasBadVolatileCondition} | hasSubstitute=${hasSubstitute} | faintsByHazards=${faintsByHazards} | switchedLastTurn=${switchedLastTurn}`);

        // Classify move decisions

        const damageMoves = await classifyDamageMoves(context, activeSlot, availableMoveDecisions);
        const statusMoves = await classifyStatusMoves(context, activeSlot, availableMoveDecisions, contextExtraData, bestSwitch);

        // Decide

        if (damageMoves.hasVeryGoodMove) {
            if (statusMoves.SleepTalk.length > 0) {
                return randomlyChoose(statusMoves.SleepTalk);
            } else if (damageMoves.SPP.length > 0) {
                return randomlyChoose(damageMoves.SPP);
            } else if (damageMoves.SP.length > 0) {
                return randomlyChoose(damageMoves.SP);
            } else {
                return randomlyChoose(damageMoves.S);
            }
        } else if (damageMoves.hasGoodMove) {
            if (statusMoves.SleepTalk.length > 0) {
                return randomlyChoose(statusMoves.SleepTalk);
            } else if (statusMoves.Viable.length > 0 && (Math.random() * 100) > 50) {
                return randomlyChoose(statusMoves.Viable);
            } else {
                return randomlyChoose(damageMoves.A);
            }
        } else if (damageMoves.hasViableMove) {
            const mustSwitch = bestSwitch && !faintsByHazards && !hasSubstitute && currentPokemonEvaluation < bestSwitchEvaluation;
            let chanceDoNotSwitch = 0;

            if (mustSwitch && statusMoves.Viable.length > 0) {
                if (switchedLastTurn) {
                    chanceDoNotSwitch = 0.2;
                } else if (checkFoeSwitchedLastTurn(battle)) {
                    chanceDoNotSwitch = 0.1;
                }
            }

            if (mustSwitch && (!chanceDoNotSwitch || Math.random() > chanceDoNotSwitch)) {
                if (statusMoves.BatonPass.length > 0) {
                    return randomlyChoose(statusMoves.BatonPass);
                } else {
                    return bestSwitch;
                }
            } else if (statusMoves.SleepTalk.length > 0) {
                return randomlyChoose(statusMoves.SleepTalk);
            } else if (damageMoves.B.length > 0) {
                return randomlyChoose(damageMoves.B.concat(statusMoves.Viable));
            } else {
                return randomlyChoose(damageMoves.C.concat(statusMoves.Viable));
            }
        } else if (statusMoves.Viable.length > 0 || damageMoves.D.length > 0) {
            const mustSwitch = bestSwitch && !faintsByHazards && !hasSubstitute && (currentPokemonEvaluation < bestSwitchEvaluation || hasBadVolatileCondition);

            let chanceDoNotSwitch = 0;

            if (mustSwitch && statusMoves.Viable.length > 0) {
                if (switchedLastTurn) {
                    chanceDoNotSwitch = 0.3;
                } else if (checkFoeSwitchedLastTurn(battle)) {
                    chanceDoNotSwitch = 0.1;
                }
            }

            if (mustSwitch && (!chanceDoNotSwitch || Math.random() > chanceDoNotSwitch)) {
                if (statusMoves.BatonPass.length > 0) {
                    return randomlyChoose(statusMoves.BatonPass);
                } else {
                    return bestSwitch;
                }
            } else if (statusMoves.SleepTalk.length > 0) {
                return randomlyChoose(statusMoves.SleepTalk);
            } else {
                return randomlyChoose(damageMoves.D.concat(statusMoves.Viable));
            }
        } else if (bestSwitch) {
            return bestSwitch;
        } else if (damageMoves.E.length > 0) {
            return randomlyChoose(damageMoves.E);
        } else if (damageMoves.Z.length > 0 || statusMoves.Unviable.length > 0) {
            return randomlyChoose(damageMoves.Z.concat(statusMoves.Unviable));
        }

        return randomlyChoose(availableMoveDecisions);
    }

    public async decide(context: DecisionMakeContext): Promise<BattleDecision> {
        return makeDecisionsSimple(context, this, initGenericNPCContext(), true);
    }
}