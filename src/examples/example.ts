// Battle bot example

"use strict";

import dotenv from "dotenv";
dotenv.config();

import { PokemonShowdownBot } from "@asanrom/ps-bot-lib";
import { Log } from "./log";
import {
    DefaultBattleAnalyzerFactory,
    GenericNPCDecisionAlgorithm,
    PokemonShowdownBattleBot,
    TopDamageDecisionAlgorithm,
    toId,
    toRoomId,
    PokemonTeam,
    parsePokemonTeam,
    isBattle,
    simplifyBattleId
} from "..";
import Path from "path";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { BattleLogger } from "./battle-logger";

function main() {
    const username = process.env.ACCOUNT_NAME;
    const password = process.env.ACCOUNT_PASSWORD;

    if (!username || !password) {
        Log.error("You must set both ACCOUNT_NAME and ACCOUNT_PASSWORD for this example to work.");
        Log.error("Set the environment variables in the .env file or by any other method.");
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

    // Load teams

    const teams = new Map<string, PokemonTeam[]>();
    const teamsFolder = Path.resolve(process.env.TEAMS_PATH || "teams");

    let teamsCount = 0;

    if (existsSync(teamsFolder)) {
        const subPaths = readdirSync(teamsFolder);

        for (const subPath of subPaths) {
            const isDir = statSync(Path.resolve(teamsFolder, subPath)).isDirectory();

            if (!isDir) {
                continue;
            }

            const formatId = toId(subPath);

            if (!formatId) {
                continue;
            }

            const teamList: PokemonTeam[] = [];

            teams.set(formatId, teamList);

            const teamsFiles = readdirSync(Path.resolve(teamsFolder, subPath));

            for (const teamFile of teamsFiles) {
                if (!teamFile.endsWith(".txt")) {
                    continue;
                }

                const team = parsePokemonTeam(readFileSync(Path.resolve(teamsFolder, subPath, teamFile)).toString());

                if (team && team.length > 0) {
                    teamList.push(team);
                    teamsCount++;
                }
            }
        }
    }

    if (teamsCount > 0) {
        Log.info(`Loaded ${teamsCount} teams for ${teams.size} different formats.`);
    }

    let battleLogger: BattleLogger;

    if (process.env.LOG_BATTLES === "YES") {
        battleLogger = new BattleLogger(process.env.LOGS_PATH || "logs");
    }

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
        teams: teams,
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
        if (battleLogger && Log.LOG_DEBUG) {
            battleLogger.log(battle, "|debug|" + msg);
        }
    });

    const bot = new PokemonShowdownBot({
        host: process.env.SERVER_HOST || 'sim3.psim.us',
        port: parseInt(process.env.SERVER_PORT || '443', 10),
        secure: process.env.SERVER_SSL !== 'NO',
        serverId: process.env.SERVER_ID || 'showdown',
    });

    battleBot.on("send", (room, msg) => {
        // When the battle bot wants to send a message, send it to the server
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
        // Send to the battle bot all the received lines
        battleBot.receive(room, line, spl, isInit);

        switch (spl[0]) {
            case "init":
                if (spl[1] === "battle" && battleLogger) {
                    // Battle started
                    battleLogger.initBattle(simplifyBattleId(room));
                }
                break;
            case "deinit":
                if (isBattle(room) && battleLogger) {
                    // Battle ended
                    battleLogger.close(simplifyBattleId(room));
                }
                break;
            default:
                if (isBattle(room) && battleLogger) {
                    // Battle line
                    battleLogger.log(simplifyBattleId(room), line);
                }
        }
    });

    bot.connect();
}

main();
