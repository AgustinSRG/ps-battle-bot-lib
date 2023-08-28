// Evaluates status moves

"use strict";

import { BattleFields, VolatileStatuses } from "../../../battle-data";
import { abilityIsEnabled, applyCommonSetsToFoeActive, applyGimmickToActive, findMove, getMoveFlags, getMoveRealType, getPokemonCurrentTypes, isGrounded, itemIsEnabled, moveBreaksAbility, moveIsRedirected } from "../../../battle-helpers";
import { getHPPercent } from "../../../showdown-battle-parser/parser-utils";
import { compareIds, toId } from "../../../utils";
import { MoveSubDecision, SwitchSubDecision, findMoveDecisionTargets, playersAreAllies } from "../../active-decision";
import { DecisionMakeContext, DecisionSlot } from "../../context";
import { GenericNPCContext } from "./context-extra-data";
import { StatusMovesHandlers } from "./status-moves";

/**
 * Classified status moves
 */
export interface StatusMovesEvaluationClassifier {
    /**
     * Viable status moves
     */
    Viable: MoveSubDecision[];

    /**
     * Unviable status moves
     */
    Unviable: MoveSubDecision[];

    /**
     * Targeting ally with negative effect
     */
    Negative: MoveSubDecision[];

    /**
     * Baton pass decisions
     */
    BatonPass: MoveSubDecision[];

    /**
     * Viable sleep talk decisions
     */
    SleepTalk: MoveSubDecision[];
}

/**
 * Classifies status moves
 * @param context The context
 * @param activeSlot The active slot
 * @param availableMoveDecisions The available moves
 * @param contextExtraData The context extra data
 * @returns The classified decisions
 */
export async function classifyStatusMoves(context: DecisionMakeContext, activeSlot: DecisionSlot, availableMoveDecisions: MoveSubDecision[], contextExtraData: GenericNPCContext, bestSwitch: SwitchSubDecision | null): Promise<StatusMovesEvaluationClassifier> {
    const battle = context.battle;

    if (!battle.request || !battle.request.active || !battle.request.active[activeSlot.requestIndex] || !battle.request.side.pokemon[activeSlot.requestIndex]) {
        return null;
    }

    const mainPlayer = battle.players.get(battle.mainPlayer);

    if (!mainPlayer) {
        return null;
    }

    const reqActive = battle.request.active[activeSlot.requestIndex];

    const active = mainPlayer.active.get(activeSlot.activeSlot);

    if (!active) {
        return null;
    }

    const res: StatusMovesEvaluationClassifier = {
        Viable: [],
        Unviable: [],
        Negative: [],
        BatonPass: [],
        SleepTalk: [],
    };

    for (const decision of availableMoveDecisions) {
        const modifiedActive = applyGimmickToActive(battle, active, reqActive, decision.gimmick);
        const move = reqActive.moves[decision.moveIndex];

        if (!move) {
            continue;
        }

        let moveTarget = move.target;
        let moveName = move.id;

        if (decision.gimmick === "dynamax" || decision.gimmick === "max-move") {
            if (move.maxMove) {
                moveName = move.maxMove.id;
                moveTarget = move.maxMove.target;
            }
        } else if (decision.gimmick === "z-move") {
            if (move.zMove) {
                if (!compareIds(move.zMove.id, move.id + "Z")) {
                    moveName = move.zMove.id;
                }
                moveTarget = move.zMove.target;
            }
        }

        if (moveIsRedirected(battle, mainPlayer, modifiedActive, moveName, moveTarget)) {
            context.analyzer.debug(`[MOVE REDIRECTED] Pokemon: ${modifiedActive.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"}`);
            continue;
        }

        if ((decision.gimmick === "tera" || decision.gimmick === "dynamax") && getHPPercent(modifiedActive.condition) < 50) {
            continue;
        }

        const moveId = toId(moveName);
        const moveData = findMove(battle.status.gen, moveName);
        const moveFlags = getMoveFlags(battle.status.gen, moveName);

        let isViable = false;
        let isNegative = false;

        const targets = findMoveDecisionTargets(battle, activeSlot, decision);

        if (targets.length === 0) {
            if (moveData.category === "Status" && (decision.gimmick === "dynamax" || decision.gimmick === "max-move")) {
                isViable = false;
            } else if (StatusMovesHandlers.has(moveId)) {
                const handler = StatusMovesHandlers.get(moveId);
                isViable = handler({
                    battle: battle, 
                    mainPlayer: mainPlayer, 
                    active: modifiedActive, 
                    decision: decision, 
                    targetPlayer: mainPlayer, 
                    target: modifiedActive, 
                    move: moveData, 
                    contextExtraData: contextExtraData,
                    bestSwitch: bestSwitch,
                });
            }
        } else {
            for (const target of targets) {
                const targetPlayer = battle.players.get(target.ident.playerIndex);

                if (!targetPlayer) {
                    continue;
                }

                if (targetPlayer.index === mainPlayer.index || playersAreAllies(battle.status.gameType, mainPlayer.index, targetPlayer.index)) {
                    if (moveTarget !== "adjacentAlly" && moveTarget !== "adjacentAllyOrSelf") {
                        isNegative = true;
                        continue;
                    }
                }

                const isSelf = targetPlayer.index === mainPlayer.index && target.slot === activeSlot.activeSlot;

                const modifiedTarget = await applyCommonSetsToFoeActive(battle, target);

                if (moveData.category === "Status" && (decision.gimmick === "dynamax" || decision.gimmick === "max-move")) {
                    continue; // Max guard with target (should not happen)
                }

                if ((decision.gimmick === "tera" || decision.gimmick === "dynamax") && getHPPercent(modifiedActive.condition) < 50) {
                    continue;
                }

                if (!isSelf && moveData.category === "Status") {
                    if (compareIds(modifiedTarget.ability.ability, "Good as Gold") && abilityIsEnabled(battle, modifiedTarget) && !moveBreaksAbility(battle, modifiedActive, modifiedTarget, moveData)) {
                        context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Blocked by Good as Gold`);
                        continue; // Blocked by Good as gold
                    }
    
                    if (moveFlags.has("reflectable")) {
                        if (compareIds(modifiedTarget.ability.ability, "Magic Bounce") && abilityIsEnabled(battle, modifiedTarget) && !moveBreaksAbility(battle, modifiedActive, modifiedTarget, moveData)) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Reflected by Magic bounce`);
                            continue; // Blocked by Magic Bounce
                        }
                    }
    
                    if (moveFlags.has("bullet")) {
                        if (compareIds(modifiedTarget.ability.ability, "BulletProof") && abilityIsEnabled(battle, modifiedTarget) && !moveBreaksAbility(battle, modifiedActive, modifiedTarget, moveData)) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Ability Immunity: ${modifiedTarget.ability.ability}`);
                            continue; // Blocked by BulletProof
                        }
                    }

                    if (moveFlags.has("sound")) {
                        if (compareIds(modifiedTarget.ability.ability, "Soundproof") && abilityIsEnabled(battle, modifiedTarget) && !moveBreaksAbility(battle, modifiedActive, modifiedTarget, moveData)) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Ability Immunity: ${modifiedTarget.ability.ability}`);
                            continue; // Blocked by Soundproof
                        }
                    }

                    if (moveFlags.has("wind")) {
                        if ((compareIds(modifiedTarget.ability.ability, "Wind Power") || compareIds(modifiedTarget.ability.ability, "Wind Rider")) && abilityIsEnabled(battle, modifiedTarget) && !moveBreaksAbility(battle, modifiedActive, modifiedTarget, moveData)) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Ability Immunity: ${modifiedTarget.ability.ability}`);
                            continue; // Blocked by Wind Power or Wind Rider
                        }
                    }

                    if (moveFlags.has("powder")) {
                        if (battle.status.gen >= 6 && getPokemonCurrentTypes(battle, modifiedTarget).includes("Grass")) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Grass types immune to powder`);
                            continue;
                        }

                        if (compareIds(modifiedTarget.item.item, "Safety Goggles") && itemIsEnabled(battle, modifiedTarget)) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Item Immunity: ${modifiedTarget.item.item}`);
                            continue;
                        }

                        if (compareIds(modifiedTarget.ability.ability, "Overcoat") && abilityIsEnabled(battle, modifiedTarget) && !moveBreaksAbility(battle, modifiedActive, modifiedTarget, moveData)) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Ability Immunity: ${modifiedTarget.ability.ability}`);
                            continue;
                        }
                    }
    
                    if (!moveFlags.has("authentic") && !moveFlags.has("bypasssub")) {
                        if (modifiedTarget.volatiles.has(VolatileStatuses.Substitute)) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Blocked by Substitute`);
                            continue; // Blocked by substitute
                        }
                    }

                    if (compareIds(modifiedActive.ability.ability, "Prankster") && abilityIsEnabled(battle, modifiedActive)) {
                        if (battle.status.gen <= 7 && getPokemonCurrentTypes(battle, modifiedTarget).includes("Dark")) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Dark types immune to Prankster`);
                            continue;
                        }

                        if (battle.status.fields.has(BattleFields.PsychicTerrain) && isGrounded(battle, modifiedTarget)) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Blocked by psychic terrain due to Prankster`);
                            continue;
                        }

                        if (["Queenly Majesty", "Dazzling", "Armor Tail"].map(toId).includes(toId(modifiedTarget.ability.ability)) && abilityIsEnabled(battle, modifiedTarget) && !moveBreaksAbility(battle, modifiedActive, modifiedTarget, moveData)) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Ability Immunity: ${modifiedTarget.ability.ability}`);
                            continue;
                        }
                    }
                }
                
                // Check for immunity ability
                if (abilityIsEnabled(battle, modifiedTarget) && !moveBreaksAbility(battle, modifiedActive, modifiedTarget, moveData)) {
                    const moveType = getMoveRealType(battle, modifiedActive, moveId);

                    if (moveType === "Grass") {
                        if (["Sap Sipper"].map(toId).includes(toId(modifiedTarget.ability.ability))) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Ability Immunity: ${modifiedTarget.ability.ability}`);
                            continue;
                        }
                    } else if (moveType === "Fire") {
                        if (["Flash Fire", "Well-Baked Body"].map(toId).includes(toId(modifiedTarget.ability.ability))) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Ability Immunity: ${modifiedTarget.ability.ability}`);
                            continue;
                        }
                    } else if (moveType === "Water") {
                        if (["Dry Skin", "Storm Drain", "Water Absorb"].map(toId).includes(toId(modifiedTarget.ability.ability))) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Ability Immunity: ${modifiedTarget.ability.ability}`);
                            continue;
                        }
                    } else if (moveType === "Electric") {
                        if (["Lightning Rod", "Motor Drive", "Volt Absorb"].map(toId).includes(toId(modifiedTarget.ability.ability))) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Ability Immunity: ${modifiedTarget.ability.ability}`);
                            continue;
                        }
                    } else if (moveType === "Ground") {
                        if (["Levitate", "Earth Eater"].map(toId).includes(toId(modifiedTarget.ability.ability))) {
                            context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Ability Immunity: ${modifiedTarget.ability.ability}`);
                            continue;
                        }
                    }
                }

                if (StatusMovesHandlers.has(moveId)) {
                    const handler = StatusMovesHandlers.get(moveId);
                    const targetViable = handler({
                        battle: battle, 
                        mainPlayer: mainPlayer, 
                        active: modifiedActive, 
                        decision: decision, 
                        targetPlayer: targetPlayer, 
                        target: modifiedTarget, 
                        move: moveData, 
                        contextExtraData: contextExtraData,
                        bestSwitch: bestSwitch,
                    });

                    context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Viable=${targetViable}`);

                    isViable = isViable || targetViable;
                }
            }
        }

        context.analyzer.debug(`[Status Move] ${modifiedActive.details.species} | Move: ${moveName} | Gimmick: ${decision.gimmick || "-"} | Viable=${isViable} | Negative=${isNegative}`);

        if (isViable) {
            res.Viable.push(decision);
            if (compareIds(moveId, "Sleep Talk")) {
                res.SleepTalk.push(decision);
            } else if (compareIds(moveId, "Baton Pass") || compareIds(moveId, "Shed Tail") || compareIds(moveId, "Parting Shot")) {
                res.BatonPass.push(decision);
            }
        } else if (isNegative) {
            res.Negative.push(decision);
        } else {
            res.Unviable.push(decision);
        }
    }

    return res;
}
