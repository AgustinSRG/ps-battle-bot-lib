// Major events

"use strict";

import { BattleEventMajor, BattleEvent_Move } from "../battle-data/battle-event-major";
import { BattleGameType } from "../battle-data/battle-status";
import { parseCondition, parseDetails, parseEffect, parsePlayerIndex, parsePokemonIdent, parseRequest } from "./parser-utils";

type ParserFuncMajor = (args: string[], knowledgeArgs: Map<string, string>) => BattleEventMajor | null;

export const ProtocolParserMap_Major: { [msgType: string]: ParserFuncMajor } = {
    "gametype": args => {
        return {
            type: "GameType",
            gameType: (args[0] || "") as BattleGameType,
        };
    },

    "gen": args => {
        const gen = parseInt(args[0], 10) || 0;

        return {
            type: "Gen",
            gen: gen,
        };
    },

    "tier": args => {
        return {
            type: "Tier",
            tier: args[0] || "",
        };
    },

    "rule": args => {
        const spl = (args[0] || "").split(':');
        const ruleName = spl[0];
        const ruleDesc = (spl[1] || "").trim();
        return {
            type: "Rule",
            name: ruleName,
            description: ruleDesc,
        };
    },

    "player": args => {
        return {
            type: "Player",
            playerIndex: parsePlayerIndex(args[0] || ""),
            playerName: args[1] || "",
            playerAvatar: args[2] || "",
        };
    },

    "teamsize": args => {
        return {
            type: "TeamSize",
            playerIndex: parsePlayerIndex(args[0] || ""),
            teamSize: parseInt(args[1], 10) || 0,
        };
    },

    "clearpoke": () => {
        return {
            type: "ClearPokemon",
        };
    },

    "poke": args => {
        return {
            type: "RevealTeamPreviewPokemon",
            playerIndex: parsePlayerIndex(args[0] || ""),
            details: parseDetails(args[1] || ""),
        };
    },

    "updatepoke": args => {
        return {
            type: "DetailsChange",
            pokemon: parsePokemonIdent(args[0] || ""),
            details: parseDetails(args[1] || ""),
        };
    },

    "detailschange": args => {
        return {
            type: "DetailsChange",
            pokemon: parsePokemonIdent(args[0] || ""),
            details: parseDetails(args[1] || ""),
        };
    },

    "teampreview": args => {
        const res: BattleEventMajor = {
            type: "TeamPreview",
        };

        if (args[0] && !isNaN(Number(args[0]))) {
            res.maxTeamSize = parseInt(args[0], 10);
        }

        return res;
    },

    "start": () => {
        return {
            type: "Start",
        };
    },

    "turn": args => {
        return {
            type: "Turn",
            turn: parseInt(args[0], 10) || 0,
        };
    },

    "switch": args => {
        return {
            type: "Switch",
            pokemon: parsePokemonIdent(args[0] || ""),
            details: parseDetails(args[1] || ""),
            condition: parseCondition(args[2] || ""),
        };
    },

    "drag": args => {
        return {
            type: "Drag",
            pokemon: parsePokemonIdent(args[0] || ""),
            details: parseDetails(args[1] || ""),
            condition: parseCondition(args[2] || ""),
        };
    },


    "replace": args => {
        const res: BattleEventMajor = {
            type: "Replace",
            pokemon: parsePokemonIdent(args[0] || ""),
            details: parseDetails(args[1] || ""),
        };

        if (args[2]) {
            res.condition = parseCondition(args[2] || "");
        }

        return res;
    },

    "faint": args => {
        return {
            type: "Faint",
            pokemon: parsePokemonIdent(args[0] || ""),
        };
    },

    "swap": args => {
        let slot: number;

        if (isNaN(parseInt(args[1], 10))) {
            slot = parsePokemonIdent(args[1] || "").slot;
        } else {
            slot = parseInt(args[1], 10);
        }

        return {
            type: "Swap",
            pokemon: parsePokemonIdent(args[0] || ""),
            slot: slot,
        };
    },

    "move": (args, kArgs) => {
        const result: BattleEvent_Move = {
            type: "Move",
            pokemon: parsePokemonIdent(args[0] || ""),
            move: args[1] || "",
            target: parsePokemonIdent(args[2] || ""),
        };

        if (kArgs.has("from")) {
            result.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("spread")) {
            result.spread = kArgs.get("spread").split(",").map(s => {
                return parsePokemonIdent(s.trim());
            });
        }

        return result;
    },

    "cant": args => {
        return {
            type: "MoveCannotUse",
            pokemon: parsePokemonIdent(args[0] || ""),
            effect: parseEffect(args[1] || ""),
            move: args[2] || "",
        };
    },

    "callback": args => {
        let activeSlot: number;
        if (isNaN(parseInt(args[1], 10))) {
            activeSlot = parsePokemonIdent(args[1] || "").slot;
        } else {
            activeSlot = parseInt(args[1], 10);
        }
        switch (args[0]) {
            case "trapped":
                return {
                    type: "CallbackTrapped",
                    slot: activeSlot, 
                };
            case "cant":
                return {
                    type: "CallbackCannotUseMove",
                    slot: activeSlot,
                    move: args[3] || "",
                };
            default:
                return null;
        }
    },

    "win": args => {
        return {
            type: "BattleEnded",
            tie: false,
            winner: args[0] || "",
        };
    },

    "tie": () => {
        return {
            type: "BattleEnded",
            tie: true,
        };
    },

    "prematureend": () => {
        return {
            type: "BattleEnded",
            tie: true,
        };
    },

    "request": args => {
        const reqJSON = args.join("|");
        if (!reqJSON) {
            return null;
        }
        const rawRequest = JSON.parse(reqJSON);

        if (rawRequest === null) {
            return {
                type: "BattleEnded",
                tie: true,
            };
        }

        return {
            type: "Request",
            request: parseRequest(rawRequest),
        };
    },
};
