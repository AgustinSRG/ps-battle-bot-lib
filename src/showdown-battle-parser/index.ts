// Protocol parser

"use strict";

import { Battle, findActiveSlotByRequestIndex } from "../battle-data";
import { BattleEvent } from "../battle-data/battle-event";
import { ActiveDecision, BattleDecision, ForceSwitchDecision, MoveGimmick, MoveSubDecision, MoveSubDecisionTarget, PASS_DECISION, SHIFT_DECISION, WAIT_DECISION, getDefaultTarget, playersAreAdjacent, playersAreAllies } from "../battle-decision";
import { ProtocolParserMap_Major } from "./parser-majors";
import { ProtocolParserMap_Minor } from "./parser-minors";

export type ParserFunc = (args: string[], knowledgeArgs: Map<string, string>) => BattleEvent | null;

/**
 * Parser mapping
 */
export type ProtocolParserMap = { [msgType: string]: ParserFunc }

const IgnoreKnowledgeArgsTypes = new Set<string>([
    "request",
    "tier",
    "rule",
    "player",
    "win",
]);

/**
 * Parses event in Pokemon Showdown format
 * @param line The line
 * @returns The event, or null if the message is not an event
 */
export function parsePokemonShowdownBattleEvent(line: string): BattleEvent | null {
    if (!line) {
        return null;
    }

    const spl = line.split("|").slice(1);
    const messageType = spl[0] + "";

    const args = spl.slice(1);
    const knowledgeArgs = new Map<string, string>();

    if (!IgnoreKnowledgeArgsTypes.has(messageType)) {
        while (args.length > 0 && args[args.length - 1].substring(0, 1) === '[') {
            const bracketPos = args[args.length - 1].indexOf(']');
            if (bracketPos <= 0) break;
            const argString = args.pop();
            knowledgeArgs.set(
                argString.substring(1, bracketPos),
                argString.substring(bracketPos + 1).trim() || '.'
            );
        }
    }

    const isMajor = messageType.charAt(0) !== "-";
    let parserFunc: ParserFunc;

    if (isMajor) {
        parserFunc = ProtocolParserMap_Major[messageType];
    } else {
        parserFunc = ProtocolParserMap_Minor[messageType];
    }

    if (!parserFunc) {
        return null;
    }

    return parserFunc(args, knowledgeArgs);
}

/**
 * Parses battle log into an event array
 * @param log The log
 * @returns The event array
 */
export function parseBattleLog(log: string): BattleEvent[] {
    const result: BattleEvent[] = [];

    const lines = log.split("\n");

    for (const line of lines) {
        if (!line) {
            continue;
        }

        const ev = parsePokemonShowdownBattleEvent(line);
        if (!ev) {
            continue;
        }

        result.push(ev);
    }

    return result;
}

/**
 * Encodes decision into Pokemon Showdown command
 * @param decision The decision to encode
 * @returns The command to send. Empty string to send nothing.
 */
export function encodeDecision(battle: Battle, decision: BattleDecision): string {
    const requestId = battle.request ? battle.request.id : 0;

    if (decision.type === "team") {
        return `/choose team ${decision.teamOrder.map(a => a + 1).join(",")}|${requestId}`;
    }

    if (decision.type === "force-switch") {
        const subCommands: string[] = [];

        for (const subDecision of decision.subDecisions) {

            if (subDecision.type === "switch" || subDecision.type === "revive") {
                subCommands.push(`switch ${subDecision.pokemonIndex + 1}`);
            } else {
                subCommands.push("pass");
            }

        }

        return `/choose ${subCommands.join(", ")}|${battle.request.id}`;
    }

    if (decision.type === "active") {
        const subCommands: string[] = [];

        for (let reqActiveIndex = 0; reqActiveIndex < decision.subDecisions.length; reqActiveIndex++) {
            const subDecision = decision.subDecisions[reqActiveIndex];

            if (subDecision.type === "move") {
                let gimmickStr = "";

                switch (subDecision.gimmick) {
                    case "tera":
                        gimmickStr = " terastallize";
                        break;
                    case "dynamax":
                        gimmickStr = " dynamax";
                        break;
                    case "z-move":
                        gimmickStr = " zmove";
                        break;
                    case "ultra":
                        gimmickStr = " ultra";
                        break;
                    case "mega":
                        gimmickStr = " mega";
                        break;
                }

                let targetStr = "";

                if (subDecision.target) {
                    if (battle.status.gameType === "multi") {
                        if (playersAreAllies(battle.status.gameType, battle.mainPlayer, subDecision.target.playerIndex)) {
                            // Targeting ally or self
                            targetStr = " -" + (subDecision.target.slot + 1);
                        } else {
                            // Targeting foe
                            targetStr = " " + (subDecision.target.slot + 1);
                        }
                    } else if (battle.status.gameType === "freeforall") {
                        if (playersAreAdjacent(battle.status.gameType, battle.mainPlayer, subDecision.target.playerIndex)) {
                            // Targeting ally or self
                            targetStr = " -" + (subDecision.target.slot + 1);
                        } else {
                            // Targeting foe
                            targetStr = " " + (subDecision.target.slot + 1);
                        }
                    } else {
                        if (subDecision.target.playerIndex === battle.mainPlayer) {
                            // Targeting self
                            targetStr = " -" + (subDecision.target.slot + 1);
                        } else {
                            // Targeting foe
                            targetStr = " " + (subDecision.target.slot + 1);
                        }
                    }
                }

                subCommands.push(`move ${subDecision.moveIndex + 1}${gimmickStr}${targetStr}`);
            } else if (subDecision.type === "switch") {
                subCommands.push(`switch ${subDecision.pokemonIndex + 1}`);
            } else if (subDecision.type === "shift") {
                subCommands.push(`shift`);
            } else {
                subCommands.push("pass");
            }
        }

        return `/choose ${subCommands.join(", ")}|${battle.request.id}`;
    }


    return "";
}

const MoveGimmickReverse: Map<string, MoveGimmick> = new Map([
    ["terastallize", "tera"],
    ["dynamax", "dynamax"],
    ["zmove", "z-move"],
    ["ultra", "ultra"],
    ["mega", "mega"],
]);

function getTargetFromCommand(battle: Battle, cmdIndex: number): MoveSubDecisionTarget {
    if (battle.status.gameType === "multi") {
        if (cmdIndex < 0) {
            // Targeting ally or self
            let targetIndex = -1;
            const slot = Math.abs(cmdIndex) - 1;

            for (const pIndex of battle.players.keys()) {
                if (!playersAreAllies(battle.status.gameType, battle.mainPlayer, targetIndex)) {
                    continue;
                }

                if (!battle.players.get(pIndex).active.has(slot)) {
                    continue;
                }

                targetIndex = pIndex;
                break;
            }

            return {
                playerIndex: targetIndex,
                slot: slot,
            };
        } else {
            // Targeting foes
            let targetIndex = -1;
            const slot = Math.abs(cmdIndex) - 1;

            for (const pIndex of battle.players.keys()) {
                if (playersAreAllies(battle.status.gameType, battle.mainPlayer, targetIndex)) {
                    continue;
                }

                if (!battle.players.get(pIndex).active.has(slot)) {
                    continue;
                }

                targetIndex = pIndex;
                break;
            }

            return {
                playerIndex: targetIndex,
                slot: slot,
            };
        }
    } else if (battle.status.gameType === "freeforall") {
        if (cmdIndex < 0) {
            // Targeting adjacent players or self
            let targetIndex = -1;
            const slot = Math.abs(cmdIndex) - 1;

            for (const pIndex of battle.players.keys()) {
                if (!playersAreAdjacent(battle.status.gameType, battle.mainPlayer, targetIndex)) {
                    continue;
                }

                if (!battle.players.get(pIndex).active.has(slot)) {
                    continue;
                }

                targetIndex = pIndex;
                break;
            }

            return {
                playerIndex: targetIndex,
                slot: slot,
            };
        } else {
            // Targeting opposing players
            let targetIndex = -1;
            const slot = Math.abs(cmdIndex) - 1;

            for (const pIndex of battle.players.keys()) {
                if (playersAreAdjacent(battle.status.gameType, battle.mainPlayer, targetIndex)) {
                    continue;
                }

                if (!battle.players.get(pIndex).active.has(slot)) {
                    continue;
                }

                targetIndex = pIndex;
                break;
            }

            return {
                playerIndex: targetIndex,
                slot: slot,
            };
        }
    } else {
        if (cmdIndex < 0) {
            // Targeting self
            return {
                playerIndex: battle.mainPlayer,
                slot: Math.abs(cmdIndex) - 1,
            };
        } else {
            // Targeting foe
            let foeIndex = -1;
            for (const pIndex of battle.players.keys()) {
                if (pIndex !== battle.mainPlayer) {
                    foeIndex = pIndex;
                    break;
                }
            }

            return {
                playerIndex: foeIndex,
                slot: Math.abs(cmdIndex) - 1,
            };
        }
    }
}

/**
 * Parses decision from command
 * Commands must start with /choose or /team
 * @param battle The battle status previous to sending the command
 * @param cmd The command
 * @returns The parsed decision
 */
export function parseDecision(battle: Battle, cmd: string): BattleDecision {
    if (!battle.request) {
        return WAIT_DECISION;
    }

    cmd = cmd.replace(/^\/team/, "/choose team");

    if (!cmd.startsWith("/choose")) {
        return WAIT_DECISION;
    }

    cmd = cmd.split("|")[0];

    if (cmd.startsWith("/choose team")) {
        // Team decision
        const chooseData = cmd.substring("/choose team ".length).trim();

        let teamOrder: number[];

        if (chooseData.includes(",")) {
            teamOrder = chooseData.split(",").map(d => {
                return parseInt(d, 10) || 0;
            });
        } else {
            teamOrder = chooseData.split("").map(d => {
                return parseInt(d, 10) || 0;
            });
        }

        return {
            type: "team",
            teamOrder: teamOrder,
        };
    }

    if (battle.request.forceSwitch) {
        // Force switch decision
        const decision: ForceSwitchDecision = {
            type: "force-switch",
            subDecisions: [],
        };

        const parts = cmd.substring("/choose ".length).split(",").map(p => {
            return p.trim();
        });

        for (let i = 0; i < parts.length; i++) {
            const sidePokemon = battle.request.side.pokemon[i];

            const subParts = parts[i].split(" ");

            if (subParts[0] === "switch") {
                decision.subDecisions.push({
                    type: sidePokemon.reviving ? "revive" : "switch",
                    pokemonIndex: (parseInt(subParts[1], 10) || 0) - 1,
                });
            } else {
                decision.subDecisions.push(PASS_DECISION);
            }
        }

        return decision;
    }

    // Active decision (default)

    const decision: ActiveDecision = {
        type: "active",
        subDecisions: [],
    };

    const parts = cmd.substring("/choose ".length).split(",").map(p => {
        return p.trim();
    });

    for (let i = 0; i < parts.length; i++) {
        const subParts = parts[i].split(" ");

        if (subParts[0] === "move") {
            let targetIndex: number;
            let gimmick: MoveGimmick;

            const moveIndex = (parseInt(subParts[1], 10) || 0) - 1;

            if (subParts[2]) {
                if (MoveGimmickReverse.has(subParts[2])) {
                    gimmick = MoveGimmickReverse.get(subParts[2]);
                } else if (!isNaN(Number(subParts[2]))) {
                    targetIndex = parseInt(subParts[2], 10);
                }
            }

            if (subParts[3]) {
                if (MoveGimmickReverse.has(subParts[3])) {
                    gimmick = MoveGimmickReverse.get(subParts[3]);
                } else if (!isNaN(Number(subParts[3]))) {
                    targetIndex = parseInt(subParts[3], 10);
                }
            }

            const subDecision: MoveSubDecision = {
                type: "move",
                moveIndex: moveIndex,
            };

            if (gimmick) {
                subDecision.gimmick = gimmick;
            }

            if (targetIndex !== undefined) {
                subDecision.target = getTargetFromCommand(battle, targetIndex);
            } else {
                const mainPlayer = battle.players.get(battle.mainPlayer);
                if (mainPlayer) {
                    const defaultTarget = getDefaultTarget(battle, {requestIndex: i, activeSlot: findActiveSlotByRequestIndex(mainPlayer, i)}, subDecision);

                    if (defaultTarget) {
                        subDecision.target = {
                            playerIndex: defaultTarget.ident.playerIndex,
                            slot: defaultTarget.slot,
                        };
                    }
                }
            }

            decision.subDecisions.push(subDecision);
        } else if (subParts[0] === "switch") {
            decision.subDecisions.push({
                type: "switch",
                pokemonIndex: (parseInt(subParts[1], 10) || 0) - 1,
            });
        } else if (subParts[0] === "shift") {
            decision.subDecisions.push(SHIFT_DECISION);
        } else {
            decision.subDecisions.push(PASS_DECISION);
        }
    }

    return decision;
}
