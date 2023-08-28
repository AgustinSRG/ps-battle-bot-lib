// Make decisions

"use strict";

import { findActiveSlotByRequestIndex } from "../battle-data";
import { shuffleArray } from "../utils/shuffle";
import { ActiveDecision, ActiveSubDecision, MoveSubDecision, ShiftSubDecision, SwitchSubDecision, generateActiveSubDecisions } from "./active-decision";
import { DecisionMakeContext, DecisionSlot } from "./context";
import { BattleDecision } from "./decision";
import { ForceSwitchDecision, ReviveSubDecision, generateForceSwitchSubDecisions } from "./force-switch-decision";
import { PASS_DECISION, WAIT_DECISION } from "./static-decisions";
import { TeamDecision, makeTeamDecisions } from "./team-decision";

/**
 * Decision maker system
 */
export interface DecisionMaker<T = never> {
    /**
     * Chooses the team in the team preview
     * @param context The context
     * @param availableTeamDecisions The available team choices
     * @returns The chosen decision
     */
    chooseTeam(context: DecisionMakeContext, availableTeamDecisions: TeamDecision[]): Promise<TeamDecision>;

    /**
     * Chooses a switch in a force-switch situation
     * Example: U-turn-like moves, red card, or a pokemon fainted
     * @param context The context
     * @param activeSlot The active slot
     * @param availableSwitchDecisions The available switch decisions
     * @param contextExtraData Extra context data if the algorithm need to keep track of stuff for active and force-switch decisions
     * @returns The chosen decision
     */
    chooseForceSwitch(context: DecisionMakeContext, activeSlot: DecisionSlot, availableSwitchDecisions: SwitchSubDecision[], contextExtraData: T): Promise<SwitchSubDecision>;

    /**
     * Chooses a pokemon to revive
     * Example: Use of Revival Blessing
     * @param context The context
     * @param availableRevivals Tha available revival decisions
     * @returns The chosen decision
     */
    chooseRevival(context: DecisionMakeContext, availableRevivals: ReviveSubDecision[]): Promise<ReviveSubDecision>;

    /**
     * Chooses the action to take for an active pokemon in battle
     * @param context The context
     * @param activeSlot The active slot
     * @param availableMoveDecisions The available move decisions
     * @param availableSwitchDecisions The available switch decisions
     * @param availableShiftDecisions The available shift decisions
     * @param contextExtraData Extra context data if the algorithm need to keep track of stuff for active and force-switch decisions
     * @returns The chosen decision
     */
    chooseActive(context: DecisionMakeContext, activeSlot: DecisionSlot, availableMoveDecisions: MoveSubDecision[], availableSwitchDecisions: SwitchSubDecision[], availableShiftDecisions: ShiftSubDecision[], contextExtraData: T): Promise<ActiveSubDecision>;
}

/**
 * Makes a decision for any context
 * Takes a pseudo random approach choosing the active slots, so it may not be ideal for doubles or triples.
 * @param context The context
 * @param decisionMaker A system to make each individual choice
 * @param contextExtraData Extra context data if the algorithm need to keep track of stuff for active and force-switch decisions
 * @param forceMegaEvolution Force mega evolution if available
 * @returns The chosen decision
 */
export async function makeDecisionsSimple<T = never>(context: DecisionMakeContext, decisionMaker: DecisionMaker<T>, contextExtraData?: T, forceMegaEvolution?: boolean): Promise<BattleDecision> {
    const battle = context.battle;

    if (!battle.request || battle.request.wait) {
        context.analyzer.debug("Waiting for other player");
        return WAIT_DECISION;
    }

    const mainPlayer = battle.players.get(battle.mainPlayer);

    if (!mainPlayer) {
        context.analyzer.debug("The main player is not defined. This may be an error.");
        return WAIT_DECISION;
    }

    // Team preview scenario
    if (battle.request.teamPreview) {
        const teamDecisions = makeTeamDecisions(battle);

        context.analyzer.debug(`Choosing team decision. Total available decisions: ${teamDecisions.length}`);

        return decisionMaker.chooseTeam(context, teamDecisions);
    }

    // Force-Switch scenario
    if (battle.request.forceSwitch) {
        const decision: ForceSwitchDecision = {
            type: "force-switch",
            subDecisions: [],
        };

        const alreadySwitched = new Set<number>();

        const requestIndexes: number[] = [];

        for (let requestIndex = 0; requestIndex < battle.request.forceSwitch.length; requestIndex++) {
            requestIndexes.push(requestIndex);
            decision.subDecisions.push(PASS_DECISION);
        }

        shuffleArray(requestIndexes);

        for (const requestIndex of requestIndexes) {
            const activeSlot = findActiveSlotByRequestIndex(mainPlayer, requestIndex);
            const availableDecisions = generateForceSwitchSubDecisions(battle, requestIndex);

            if (availableDecisions.length === 0) {
                continue;
            }

            if (availableDecisions[0].type === "pass") {
                continue;
            }

            const switchDecisions: SwitchSubDecision[] = [];
            const revivalDecisions: ReviveSubDecision[] = [];

            for (const availableDecision of availableDecisions) {
                switch (availableDecision.type) {
                    case "switch":
                        if (!alreadySwitched.has(availableDecision.pokemonIndex)) {
                            switchDecisions.push(availableDecision);
                        }
                        break;
                    case "revive":
                        if (!alreadySwitched.has(availableDecision.pokemonIndex)) {
                            revivalDecisions.push(availableDecision);
                        }
                        break;
                }
            }

            if (revivalDecisions.length > 0) {
                context.analyzer.debug(`Choosing revival decision. Index: ${requestIndex}, Slot: ${activeSlot}. Total available decisions: ${revivalDecisions.length}`);
                const chosenDecision = await decisionMaker.chooseRevival(context, revivalDecisions);

                if (!chosenDecision) {
                    continue;
                }

                alreadySwitched.add(chosenDecision.pokemonIndex); // Mark for other active slots
                decision.subDecisions[requestIndex] = chosenDecision;
            } else if (switchDecisions.length > 0) {
                context.analyzer.debug(`Choosing force-switch decision. Index: ${requestIndex}, Slot: ${activeSlot}. Total available decisions: ${switchDecisions.length}`);
                const chosenDecision = await decisionMaker.chooseForceSwitch(context, { activeSlot: activeSlot, requestIndex: requestIndex }, switchDecisions, contextExtraData);

                if (!chosenDecision) {
                    continue;
                }

                alreadySwitched.add(chosenDecision.pokemonIndex); // Mark for other active slots
                decision.subDecisions[requestIndex] = chosenDecision;
            }
        }

        return decision;
    }

    // Active / Turn scenario
    if (battle.request.active) {
        const decision: ActiveDecision = {
            type: "active",
            subDecisions: [],
        };

        const alreadySwitched = new Set<number>();
        const gimmicksUsed = {
            mega: false,
            ultra: false,
            zMove: false,
            dynamax: false,
            tera: false,
        };
        let alreadyShifted = false;

        const requestIndexes: number[] = [];

        for (let requestIndex = 0; requestIndex < battle.request.active.length; requestIndex++) {
            requestIndexes.push(requestIndex);
            decision.subDecisions.push(PASS_DECISION);
        }

        shuffleArray(requestIndexes);

        for (const requestIndex of requestIndexes) {
            const activeSlot = findActiveSlotByRequestIndex(mainPlayer, requestIndex);
            const availableDecisions = generateActiveSubDecisions(battle, requestIndex, forceMegaEvolution && !gimmicksUsed.mega);

            if (availableDecisions.length === 0) {
                continue;
            }

            if (availableDecisions[0].type === "pass") {
                continue;
            }

            const switchDecisions: SwitchSubDecision[] = [];
            const moveDecisions: MoveSubDecision[] = [];
            const shiftDecisions: ShiftSubDecision[] = [];

            for (const availableDecision of availableDecisions) {
                switch (availableDecision.type) {
                    case "switch":
                        if (!alreadySwitched.has(availableDecision.pokemonIndex)) {
                            switchDecisions.push(availableDecision);
                        }
                        break;
                    case "shift":
                        if (!alreadyShifted) {
                            shiftDecisions.push(availableDecision);
                        }
                        break;
                    case "move":
                        if (availableDecision.gimmick === "tera" && gimmicksUsed.tera) {
                            break;
                        }
                        if (availableDecision.gimmick === "dynamax" && gimmicksUsed.dynamax) {
                            break;
                        }
                        if (availableDecision.gimmick === "z-move" && gimmicksUsed.zMove) {
                            break;
                        }
                        if (availableDecision.gimmick === "ultra" && gimmicksUsed.ultra) {
                            break;
                        }
                        if (availableDecision.gimmick === "mega" && gimmicksUsed.mega) {
                            break;
                        }

                        moveDecisions.push(availableDecision);
                        break;
                }
            }

            context.analyzer.debug(`Choosing active decision. Index: ${requestIndex}, Slot: ${activeSlot}. Total available decisions: ${moveDecisions.length} moves, ${switchDecisions.length} switches, ${shiftDecisions.length} shifts.`);

            const chosenDecision = await decisionMaker.chooseActive(context, { activeSlot: activeSlot, requestIndex: requestIndex }, moveDecisions, switchDecisions, shiftDecisions, contextExtraData);

            if (!chosenDecision) {
                continue;
            }

            switch (chosenDecision.type) {
                case "shift":
                    alreadyShifted = true;
                    break;
                case "switch":
                    alreadySwitched.add(chosenDecision.pokemonIndex);
                    break;
                case "move":
                    switch (chosenDecision.gimmick) {
                        case "tera":
                            gimmicksUsed.tera = true;
                            break;
                        case "dynamax":
                            gimmicksUsed.dynamax = true;
                            break;
                        case "z-move":
                            gimmicksUsed.zMove = true;
                            break;
                        case "ultra":
                            gimmicksUsed.ultra = true;
                            break;
                        case "mega":
                            gimmicksUsed.mega = true;
                            break;
                    }
                    break;
            }

            decision.subDecisions[requestIndex] = chosenDecision;
        }

        return decision;
    }

    return WAIT_DECISION;
}
