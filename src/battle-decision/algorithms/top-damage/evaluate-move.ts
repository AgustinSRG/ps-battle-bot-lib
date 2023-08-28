// Evaluate move decision

"use strict";

import { BattleAnalyzer } from "../../../battle-analyzer";
import { Battle } from "../../../battle-data";
import { applyGimmickToActive, calcDamage, calcMoveAccuracy, moveIsRedirected } from "../../../battle-helpers";
import { MoveSubDecision, findMoveDecisionTargets, playersAreAllies } from "../../active-decision";
import { DecisionSlot } from "../../context";
import { applyExceptions } from "./exceptions";

/**
 * Evaluates move decision
 * @param analyzer Battle analyzer
 * @param battle The battle
 * @param activeSlot The active slot
 * @param decision The decision
 * @returns The total damage the move is expected to do
 */
export function evaluateMoveDecision(analyzer: BattleAnalyzer, battle: Battle, activeSlot: DecisionSlot, decision: MoveSubDecision): number {
    if (!battle.request || !battle.request.active || !battle.request.active[activeSlot.requestIndex] || !battle.request.side.pokemon[activeSlot.requestIndex]) {
        return 0;
    }

    let result = 0;

    const mainPlayer = battle.players.get(battle.mainPlayer);

    if (!mainPlayer) {
        return 0;
    }

    const reqActive = battle.request.active[activeSlot.requestIndex];

    const active = mainPlayer.active.get(activeSlot.activeSlot);

    if (!active) {
        return 0;
    }

    const modifiedActive = applyGimmickToActive(battle, active, reqActive, decision.gimmick);
    const move = reqActive.moves[decision.moveIndex];

    if (!move) {
        return 0;
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
        analyzer.debug(`[MOVE REDIRECTED] Pokemon: ${modifiedActive.details.species} | Move: ${move.id} | Gimmick: ${decision.gimmick || "-"}`);
        return 0;
    }

    const targets = findMoveDecisionTargets(battle, activeSlot, decision);

    for (const target of targets) {
        const targetPlayer = battle.players.get(target.ident.playerIndex);

        if (!targetPlayer) {
            continue;
        }

        let multiplier = 1;

        if (targetPlayer.index === mainPlayer.index || playersAreAllies(battle.status.gameType, mainPlayer.index, targetPlayer.index)) {
            multiplier = -1;
        }

        const damage = calcDamage(battle, mainPlayer, modifiedActive, targetPlayer, target, move.id, {
            considerStatsAttacker: "max",
            considerStatsDefender: "max",
            usePercent: true,
            useMax: decision.gimmick === "dynamax" || decision.gimmick === "max-move",
            useZMove: decision.gimmick === "z-move",
        });

        const maxDmg = Math.min(100, applyExceptions(battle, modifiedActive, target, move.id, damage.max)) * calcMoveAccuracy(battle, mainPlayer, modifiedActive, targetPlayer, target, move.id, decision.gimmick);

        analyzer.debug(`[CALC] ${modifiedActive.details.species} vs ${target.details.species} | Move: ${move.id} | Gimmick: ${decision.gimmick || "-"} | Damage: ${maxDmg}`);

        const val = maxDmg * multiplier;

        result += val;
    }

    return result;
}
