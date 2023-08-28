// Evaluates move damage

"use strict";

import { Battle, BattleActivePokemon, BattlePlayer } from "../../../battle-data";
import { DamageResult, OHKOMoves, RechargeMoves, applyCommonSetsToFoeActive, applyGimmickToActive, calcDamage, calcMoveAccuracy, canBeFlinched, checksPokemonDealsContactDamage, getActivePokemonTurnRecovery, isSunny, itemIsEnabled, moveIsRedirected } from "../../../battle-helpers";
import { compareIds, toId } from "../../../utils/id";
import { MoveSubDecision, findMoveDecisionTargets, playersAreAllies } from "../../active-decision";
import { DecisionMakeContext, DecisionSlot } from "../../context";

/**
 * Move classification by damage
 */
export interface DamageEvaluationClassifier {
    /**
     * Guaranteed OHKO, with priority and 100% accuracy
     */
    SPP: MoveSubDecision[];

    /**
     * Guaranteed OHKO
     */
    SP: MoveSubDecision[];

    /**
     * Possible OHKO, or successful fake out
     */
    S: MoveSubDecision[];

    /**
     * 2HKO
     */
    A: MoveSubDecision[];

    /**
     * 3HKO
     */
    B: MoveSubDecision[];

    /**
     * Less than 3HKO
     */
    C: MoveSubDecision[];

    /**
     * Zero damage (unviable)
     */
    Z: MoveSubDecision[];

    /**
     * We only deal damage to our allies (very bad)
     */
    N: MoveSubDecision[];

    /**
     * True if it has SPP, SP or S moves
     */
    hasVeryGoodMove: boolean;

    /**
     * True if it has A moves, or hasVeryGoodMove is true
     */
    hasGoodMove: boolean;

    /**
     * True if it has B or C moves, or hasGoodMove is true
     */
    hasViableMove: boolean;
}

type ClassifyGroup = 'N' | 'Z' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SP' | 'SPP';

const GroupsValue = ['N', 'Z', 'E', 'D', 'C', 'B', 'A', 'S', 'SP', 'SPP'];

const ProtectMoves = new Set<string>([
    "Protect",
    "Baneful Bunker",
    "Detect",
    "Endure",
    "King's Shield",
    "Max Guard",
    "Obstruct",
    "Silk Trap",
    "Spiky Shield",
].map(toId));

const TwoTurnsMovesWithImmunity = new Set<string>([
    "Bounce",
    "Dig",
    "Dive",
    "Fly",
    "Sky Drop",
].map(toId));

const TwoTurnsMoves = new Set<string>([
    "Freeze Shock",
    "Ice Burn",
    "Meteor Beam",
    "Razor Wind",
    "Sky Attack",
    "Skull Bash",
].map(toId));

export function applyDamageExceptions(battle: Battle, mainPlayer: BattlePlayer, attacker: BattleActivePokemon, targetPlayer: BattlePlayer, defender: BattleActivePokemon, moveName: string, damage: DamageResult): DamageResult {
    const moveId = toId(moveName);

    const res: DamageResult = {
        max: damage.max,
        min: damage.min,
        priority: damage.priority,
    };

    let targetHasProtectionMove = false;

    for (const m of defender.moves.values()) {
        if (ProtectMoves.has(toId(m.id)) && !m.disabled && m.pp > 0) {
            targetHasProtectionMove = true;
            break;
        }
    }

    if (compareIds(moveId, "Solar Beam") || compareIds(moveId, "Solar Blade")) {
        if (!isSunny(battle)) {
            if (targetHasProtectionMove) {
                res.max = 0;
                res.min = 0;
            }

            res.max *= 0.5;
            res.min *= 0.5;
        }
    }

    if (TwoTurnsMoves.has(moveId)) {
        if (!compareIds(attacker.item.item, "Power Herb") || !itemIsEnabled(battle, attacker)) {
            if (targetHasProtectionMove) {
                res.max = 0;
                res.min = 0;
            }

            res.max *= 0.5;
            res.min *= 0.5;
        }
    }

    if (TwoTurnsMovesWithImmunity.has(moveId)) {
        if (!compareIds(attacker.item.item, "Power Herb") || !itemIsEnabled(battle, attacker)) {
            if (targetHasProtectionMove) {
                res.max = 0;
                res.min = 0;
            }
        }
    }

    if (RechargeMoves.has(moveId)) {
        if (damage.max < 100) {
            // If the recharge move does not kill, it will consume an extra turn
            // so the damage per turn is halved
            res.max *= 0.5;
            res.min *= 0.5;
        }
    }

    return res;
}

/**
 * Classifies moves based on damage
 * @param context The context
 * @param activeSlot The active attacking
 * @param availableMoveDecisions The list of available moves
 * @returns The classified decisions
 */
export async function classifyDamageMoves(context: DecisionMakeContext, activeSlot: DecisionSlot, availableMoveDecisions: MoveSubDecision[]): Promise<DamageEvaluationClassifier> {
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

    const result: DamageEvaluationClassifier = {
        SPP: [],
        SP: [],
        S: [],
        A: [],
        B: [],
        C: [],
        Z: [],
        N: [],
        hasVeryGoodMove: false,
        hasGoodMove: false,
        hasViableMove: false,
    };

    for (const decision of availableMoveDecisions) {
        const modifiedActive = applyGimmickToActive(battle, active, reqActive, decision.gimmick);
        const move = reqActive.moves[decision.moveIndex];

        if (!move) {
            continue;
        }

        let moveTarget = move.target;

        if (decision.gimmick === "dynamax" || decision.gimmick === "max-move") {
            if (move.maxMove) {
                moveTarget = move.maxMove.target;
            }
        } else if (decision.gimmick === "z-move") {
            if (move.zMove) {
                moveTarget = move.zMove.target;
            }
        }

        if (moveIsRedirected(battle, mainPlayer, modifiedActive, move.id, moveTarget)) {
            context.analyzer.debug(`[MOVE REDIRECTED] Pokemon: ${modifiedActive.details.species} | Move: ${move.id} | Gimmick: ${decision.gimmick || "-"}`);
            continue;
        }

        let currentClassify: ClassifyGroup = 'Z';
        let classified = false;

        const targets = findMoveDecisionTargets(battle, activeSlot, decision);

        for (const target of targets) {
            const targetPlayer = battle.players.get(target.ident.playerIndex);

            if (!targetPlayer) {
                continue;
            }

            if (targetPlayer.index === mainPlayer.index || playersAreAllies(battle.status.gameType, mainPlayer.index, targetPlayer.index)) {
                if (!classified) {
                    currentClassify = 'N';
                    classified = true;
                }
                continue;
            }

            const modifiedTarget = await applyCommonSetsToFoeActive(battle, target);

            let damage = calcDamage(battle, mainPlayer, modifiedActive, targetPlayer, modifiedTarget, move.id, {
                considerStatsAttacker: "max",
                considerStatsDefender: "max",
                usePercent: true,
                useMax: decision.gimmick === "dynamax" || decision.gimmick === "max-move",
                useZMove: decision.gimmick === "z-move",
            });

            damage = applyDamageExceptions(battle, mainPlayer, modifiedActive, targetPlayer, modifiedTarget, move.id, damage);

            const accuracy = calcMoveAccuracy(battle, mainPlayer, modifiedActive, targetPlayer, target, move.id, decision.gimmick);

            if (OHKOMoves.has(toId(move.id)) && accuracy < 1) {
                // Nerf OHKO moves of no perfect accuracy
                damage.max = Math.min(damage.max, accuracy * 100);
                damage.min = Math.min(damage.min, accuracy * 100);
            }

            const isGoodFakeOut = compareIds(move.id, "Fake Out") && decision.gimmick !== "dynamax" && decision.gimmick !== "max-move" && decision.gimmick !== "z-move" && damage.min > 0 && canBeFlinched(battle, modifiedTarget) && !checksPokemonDealsContactDamage(battle, modifiedTarget);

            context.analyzer.debug(`[CALC] ${modifiedActive.details.species} vs ${modifiedTarget.details.species} | Move: ${move.id} | Gimmick: ${decision.gimmick || "-"} | Damage: (${damage.min}%-${damage.max}%) | Accuracy: ${accuracy} | isGoodFakeOut=${isGoodFakeOut}`);

            let cl: ClassifyGroup;

            if (damage.min >= 100 && accuracy >= 1) {
                // Guaranteed OHKO
                if (damage.priority > 0) {
                    cl = 'SPP';
                } else {
                    cl = 'SP';
                }
            } else if (damage.max >= 100 || isGoodFakeOut) {
                // Possible OHKO
                cl = 'S';
            } else if (damage.max >= 50) {
                cl = 'A';
            } else if (damage.max >= 30) {
                cl = 'B';
            } else if (damage.max > 0) {
                cl = 'C';
            } else {
                cl = 'Z';
            }

            if (!classified) {
                classified = true;
                currentClassify = cl;
            } else if (GroupsValue.indexOf(cl) > GroupsValue.indexOf(currentClassify)) {
                currentClassify = cl;
            }
        }

        if (!classified) {
            continue;
        }

        result[currentClassify].push(decision);
        context.analyzer.debug(`[DAMAGE MOVE] ${modifiedActive.details.species} | Move: ${move.id} | Gimmick: ${decision.gimmick || "-"} | Evaluation: ${currentClassify}`);

        if (['SPP', 'SP', 'S'].includes(currentClassify)) {
            result.hasVeryGoodMove = true;
            result.hasGoodMove = true;
            result.hasViableMove = true;
        } else if (['A'].includes(currentClassify)) {
            result.hasGoodMove = true;
            result.hasViableMove = true;
        } else if (['B', 'C'].includes(currentClassify)) {
            result.hasViableMove = true;
        }
    }

    return result;
}