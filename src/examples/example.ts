// Battle bot example

"use strict";

import dotenv from "dotenv";
dotenv.config();

import { PokemonShowdownBot } from "@asanrom/ps-bot-lib";
import { Log } from "./log";
import { DefaultBattleAnalyzerFactory, GenericNPCDecisionAlgorithm, PokemonShowdownBattleBot, TopDamageDecisionAlgorithm, toId, toRoomId } from "..";

function main() {
    const username = process.env.ACCOUNT_NAME;
    const password = process.env.ACCOUNT_PASSWORD;

    if (!username || !password) {
        Log.error("You must set both ACCOUNT_NAME and ACCOUNT_PASSWORD for this tool to work.");
        return;
    }

    // Configuration
    const hasChallengeWhiteList = !!process.env.CHALLENGE_WHITELIST;
    const challengeWhiteList = (process.env.CHALLENGE_WHITELIST || "").split(",").map(toId).filter(m => {
        return !!m;
    });

    // Instantiate decision algorithms we want to use
    const exampleDefaultAlgorithm = new GenericNPCDecisionAlgorithm();
    const exampleTopDamageAlgorithm = new TopDamageDecisionAlgorithm();

    // Battle bot
    const battleBot = new PokemonShowdownBattleBot({
        configFunc: battleDetails => {
            if (toId(battleDetails.format).includes("challengecup1v1") || toId(battleDetails.format).includes("challengecup2v2")) {
                // For 1v1 and 2v2 random, the best algorithm is just using the most damaging move
                return {
                    algorithm: exampleTopDamageAlgorithm,
                    analyzerFactory: DefaultBattleAnalyzerFactory,
                };
            }

            // Default
            return {
                algorithm: exampleDefaultAlgorithm,
                analyzerFactory: DefaultBattleAnalyzerFactory,
            };
        },
        autoSetTimer: process.env.AUTO_SET_TIMER === "YES",
        maxBattles: parseInt(process.env.MAX_BATTLES || "0", 10) || 0,
        acceptChallenges: process.env.ACCEPT_CHALLENGES === "YES",
        acceptChallengeFunc: user => {
            if (!hasChallengeWhiteList) {
                return true;
            }

            return challengeWhiteList.includes(toId(user));
        },
        autoLadder: process.env.AUTO_LADDER,
        autoLadderCheckDelay: parseInt(process.env.AUTO_LADDER_DELAY || "0", 10) || 0,
        joinAbandonedBattles: true,
        leaveAfterBattleEnds: true,
    });

    battleBot.on("error", err => {
        Log.error(err);
    });

    battleBot.on("debug", (battle, msg) => {
        Log.debug(`[BATTLE-BOT-DEBUG] [${battle}] ${msg}`);
    });

    const bot = new PokemonShowdownBot({
        host: process.env.SERVER_HOST || 'sim3.psim.us',
        port: parseInt(process.env.SERVER_PORT || '443', 10),
        secure: process.env.SERVER_SSL !== 'NO',
        serverId: process.env.SERVER_ID || 'showdown',
    });

    battleBot.on("send", (room, msg) => {
        bot.sendTo(room, msg);
    });

    bot.on("connected", () => {
        Log.info("Connected to the server!");
    });

    bot.on("can-login", () => {
        bot.rename(username, password);
    });

    bot.on("sent", msg => {
        Log.trace(`>>> ${msg}`);
    });

    bot.on("error", err => {
        Log.error(err);
    });

    bot.on("renamed", () => {
        if (process.env.ROOMS_JOIN) {
            const cmdList = (process.env.ROOMS_JOIN || "").split(",").map(toRoomId).filter(m => {
                return !!m;
            }).map(m => {
                return "/join " + m;
            });

            bot.sendToGlobal(cmdList);
        }
    });

    bot.on("disconnected", err => {
        Log.warning(`Disconnected. Code: ${err.code}, Reason: ${err.reason}`);
        // Clear battle bot
        battleBot.clear();
    });

    bot.on("line", (room, line, spl, isInit) => {
        Log.trace(`[${room}] ${line}`);
        battleBot.receive(room, line, spl, isInit);
    });

    bot.connect();
}

main();
