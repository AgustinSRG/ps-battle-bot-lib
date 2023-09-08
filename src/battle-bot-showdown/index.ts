// Pokemon showdown battle bot

"use strict";

import { EventEmitter } from "events";
import { BattleBot } from "../battle-bot";
import { PokemonShowdownBattleBotConfig } from "./config";
import { compareIds, isBattle, simplifyBattleId, toId } from "../utils";
import { encodeDecision, parsePokemonShowdownBattleEvent } from "../showdown-battle-parser";
import { Battle, BattleEvent } from "../battle-data";
import { BattleDecision } from "../battle-decision";
import { SearchData, SearchDataSchema } from "./search-data";
import { PokemonShowdownFormat, parsePokemonShowdownFormats } from "../utils/formats";
import { randomlyChoose } from "../utils/random";
import { packPokemonTeam } from "./teams";

export * from "./teams";
export * from "./config";
export * from "./search-data";

/**
 * Pokemon Showdown Battle bot
 */
export interface PokemonShowdownBattleBot {
    /**
     * Error event
     * @param event Event name
     * @param handler Handler
     */
    on(event: "error", handler: (err: Error) => void): this;

    /**
     * Debug event
     * @param event Event name
     * @param handler Handler
     */
    on(event: "debug", handler: (battle: string, msg: string) => void): this;

    /**
     * Send event
     * Triggered when the bot wants to send a message
     * @param event Event name
     * @param handler Handler
     */
    on(event: "send", handler: (room: string, message: string) => void): this;

    /**
     * Start event
     * Triggered when a battle starts
     * @param event Event name
     * @param handler Handler
     */
    on(event: "start", handler: (room: string) => void): this;

    /**
     * Win event
     * Triggered when the bot wins the battle
     * @param event Event name
     * @param handler Handler
     */
    on(event: "win", handler: (room: string) => void): this;

    /**
     * Win event
     * Triggered when the bot loses the battle
     * @param event Event name
     * @param handler Handler
     */
    on(event: "lose", handler: (room: string) => void): this;

    /**
     * Tie event
     * Triggered when the battle results in a tie
     * @param event Event name
     * @param handler Handler
     */
    on(event: "tie", handler: (room: string) => void): this;

    /**
     * End event
     * Triggered when the battle ends
     * @param event Event name
     * @param handler Handler
     */
    on(event: "end", handler: (room: string) => void): this;
}

/**
 * Default delay to search for ladder battles
 */
const DEFAULT_AUTO_LADDER_DELAY = 10 * 1000;

/**
 * Pokemon Showdown Battle bot
 */
export class PokemonShowdownBattleBot extends EventEmitter {
    /**
     * Battle bot
     */
    private battleBot: BattleBot;

    /**
     * Configuration
     */
    private config: PokemonShowdownBattleBotConfig;

    /**
     * True if the bot is searching for ladder battles
     */
    private isSearchingLadder: boolean;

    /**
     * Current username
     */
    private username: string;

    /**
     * True if the bot is a guest
     */
    private isGuest: boolean;

    /**
     * Formats
     */
    private formats: Map<string, PokemonShowdownFormat>;

    /**
     * Battle map (id => room)
     */
    private battles: Map<string, {
        room: string;
        lastRequestId: number,
        lastDecisionRequestId: number,
        mainPlayerName: string,
    }>;

    /**
     * Auto ladder interval
     */
    private autoLadderInterval: NodeJS.Timeout;

    /**
     * Instantiates a battle bot
     * @param config The configuration
     */
    constructor(config: PokemonShowdownBattleBotConfig) {
        super();

        this.config = config;

        this.battleBot = new BattleBot(config.configFunc);

        this.battleBot.on("error", err => {
            this.emit("error", err);
        });

        this.battleBot.on("debug", (battle, msg) => {
            this.emit("debug", battle, msg);
        });

        this.battleBot.on("decision", this.onDecision.bind(this));
        this.battleBot.on("playing", this.onPlaying.bind(this));

        this.battles = new Map();

        this.isSearchingLadder = false;

        this.username = "";
        this.isGuest = true;

        this.formats = new Map();

        if (this.config.autoLadder) {
            this.autoLadderInterval = setInterval(this.checkForAutoLadder.bind(this), this.config.autoLadderCheckDelay || DEFAULT_AUTO_LADDER_DELAY);
        }
    }

    /**
     * Clears all battles on disconnect
     */
    public clear(): void {
        for (const battleId of this.battles.keys()) {
            this.battleBot.removeBattle(battleId);
        }
        this.battles.clear();

        this.isSearchingLadder = false;
        this.username = "";
        this.isGuest = true;
    }

    /**
     * Receive line from the server
     * @param room Room ID
     * @param line Line received
     * @param splittedLine Line splitted by "|". The initial "|"" is skipped, so splittedLine[0] is the message type
     * @param initialMsg True if it's a room initial message
     */
    public receive(room: string, line: string, splittedLine: string[], initialMsg: boolean): void {
        const roomIsBattle = isBattle(room);

        if (!roomIsBattle) {
            if (splittedLine[0] === "updatesearch") {
                try {
                    const searchData: SearchData = SearchDataSchema.sanitize(JSON.parse(splittedLine.slice(1).join("|")));
                    this.isSearchingLadder = searchData.searching.length > 0;
                    if (this.config.joinAbandonedBattles !== false) {
                        for (const battle of Object.keys(searchData.games)) {
                            if (!this.battles.has(simplifyBattleId(battle))) {
                                // Join battles
                                this.emit("send", "", `/noreply /join ${battle}`);
                            }
                        }
                    }
                } catch (ex) {
                    this.emit("error", ex);
                }
            } else if (splittedLine[0] === "updateuser") {
                this.isGuest = !parseInt(splittedLine[2]);
                if (splittedLine[1] && splittedLine[1].endsWith("@!")) {
                    this.username = splittedLine[1].substring(0, splittedLine[1].length - 2);
                } else {
                    this.username = splittedLine[1];
                }
            } else if (splittedLine[0] === "formats") {
                this.formats = parsePokemonShowdownFormats(splittedLine.slice(1).join("|"));
            } else if (splittedLine[0] === "pm") {
                const fromUser = splittedLine[1];
                const messageParts = splittedLine.slice(3);

                if (!compareIds(fromUser, this.username) && messageParts[0].startsWith("/challenge ")) {
                    // Is a challenge
                    const formatParts = messageParts[0].substring("/challenge ".length).split("@@@");
                    const format = toId(formatParts[0]);
                    const hasCustomRules = !!formatParts[1];

                    // Check if we can auto accept challenges

                    if (!this.config.acceptChallenges) {
                        return; // Ignore
                    }

                    if (this.config.acceptChallengeFunc) {
                        if (!this.config.acceptChallengeFunc(fromUser, format, hasCustomRules ? formatParts[1].split(",") : [])) {
                            // Reject challenge
                            this.emit("send", "", "/reject " + fromUser);
                            return;
                        }
                    }

                    // Check for battle limit

                    const currentBattlesCount = this.battles.size;
                    if (this.config.maxBattles && currentBattlesCount >= this.config.maxBattles) {
                        // Reject challenge
                        this.emit("send", "", "/reject " + fromUser);
                        return;
                    }

                    // Check for team

                    let teamToUse = "null";
                    const formatData = this.formats.get(format);

                    if (!formatData) {
                        return;
                    }

                    if (formatData.team) {
                        // Requires a team

                        if (!this.config.teams) {
                            // We do not have any team
                            this.emit("send", "", "/reject " + fromUser);
                            return;
                        }

                        if (!this.config.teams.has(format)) {
                            // We do not have a team for the format
                            this.emit("send", "", "/reject " + fromUser);
                            return;
                        }

                        const teams = this.config.teams.get(format);

                        if (teams.length === 0) {
                            // We do not have a team for the format
                            this.emit("send", "", "/reject " + fromUser);
                            return;
                        }

                        // Randomly choose a team
                        const chosenTeam = randomlyChoose(teams);
                        teamToUse = packPokemonTeam(chosenTeam);
                    }

                    // Accept the challenge

                    this.emit("send", "", "/utm " + teamToUse);
                    this.emit("send", "", "/accept " + fromUser);
                }
            }
            return;
        }

        const battleId = simplifyBattleId(room);

        if (splittedLine[0] === "init") {
            this.battles.set(battleId, {
                room: room,
                lastRequestId: -1,
                lastDecisionRequestId: -1,
                mainPlayerName: "",
            });
            this.battleBot.initBattle(battleId);
            return;
        }

        if (splittedLine[0] === "deinit") {
            if (this.battles.has(battleId)) {
                this.battles.delete(battleId);
                this.battleBot.removeBattle(battleId);
            }
            return;
        }

        const battle = this.battles.get(battleId);

        if (!battle) {
            return;
        }

        battle.room = room;

        if (splittedLine[0] === "inactive" && splittedLine[1] && (splittedLine[1].startsWith("Time left:") || splittedLine[1].startsWith(battle.mainPlayerName + " has "))) {
            // Instantly make decision on this message (always sent when the player must have to decide if timer is on)
            // For now there is no other way to tell when to decide
            if (battle.lastDecisionRequestId !== battle.lastRequestId) {
                try {
                    this.battleBot.makeDecision(battleId);
                } catch (ex) {
                    this.emit("error", ex);
                }
            }
            return;
        }

        let event: BattleEvent;

        try {
            event = parsePokemonShowdownBattleEvent(line);
        } catch (ex) {
            this.emit("error", ex);
            return;
        }

        if (event) {
            try {
                this.battleBot.addBattleEvent(battleId, event);
            } catch (ex) {
                this.emit("error", ex);
            }

            if (event.type === "Request") {
                battle.lastRequestId = event.request.id;
                battle.mainPlayerName = event.request.side.name;
            } else if (event.type === "BattleEnded") {
                if (event.tie) {
                    this.emit("tie", battle.room);
                } else if (battle.mainPlayerName && compareIds(battle.mainPlayerName, event.winner || "")) {
                    this.emit("win", battle.room);
                } else {
                    this.emit("lose", battle.room);
                }

                this.emit("end", battle.room);

                if (this.config.leaveAfterBattleEnds !== false) {
                    this.emit("send", "", "/noreply /leave " + battle.room);
                }
            }
        }
    }

    /**
     * On decision made
     * @param battle The battle
     * @param decision The decision
     */
    private onDecision(battle: Battle, decision: BattleDecision): void {
        const battleStatus = this.battles.get(battle.id);

        if (!battleStatus) {
            return;
        }

        const oldRequestId = battleStatus.lastDecisionRequestId;

        battleStatus.lastDecisionRequestId = battle.request ? battle.request.id : -1;

        if (oldRequestId === battleStatus.lastDecisionRequestId) {
            // If same request ID, undo the previous decision
            this.emit("send", battleStatus.room, '/undo');
        }

        const encodedDecision = encodeDecision(battle, decision);

        if (encodedDecision) {
            this.emit("send", battleStatus.room, encodedDecision);
        }
    }

    /**
     * On playing
     * @param battle The battle 
     */
    private onPlaying(battle: Battle) {
        const battleStatus = this.battles.get(battle.id);

        if (!battleStatus) {
            return;
        }

        if (this.config.autoSetTimer) {
            this.emit("send", battleStatus.room, "/timer on");
        }

        this.emit("start", battleStatus.room);
    }

    /**
     * Checks for auto ladder
     */
    private checkForAutoLadder() {
        if (!this.config.autoLadder) {
            return;
        }

        if (this.isGuest || this.isSearchingLadder) {
            return;
        }

        // Check for battle limit
        if (this.config.maxBattles && this.battles.size >= this.config.maxBattles) {
            return;
        }

        // Team

        const format = toId(this.config.autoLadder);
        let teamToUse = "null";
        const formatData = this.formats.get(format);

        if (!formatData) {
            return;
        }

        if (formatData.team) {
            // Requires a team

            if (!this.config.teams) {
                // We do not have any team
                return;
            }

            if (!this.config.teams.has(format)) {
                // We do not have a team for the format
                return;
            }

            const teams = this.config.teams.get(format);

            if (teams.length === 0) {
                // We do not have a team for the format
                return;
            }

            // Randomly choose a team
            const chosenTeam = randomlyChoose(teams);
            teamToUse = packPokemonTeam(chosenTeam);
        }

        this.emit("send", "", "/utm " + teamToUse);

        // Search

        this.emit("send", "", "/search " + format);
    }

    /**
     * Releases any allocated resources
     */
    public destroy() {
        this.clear();
        this.removeAllListeners();

        if (this.autoLadderInterval) {
            clearInterval(this.autoLadderInterval);
            this.autoLadderInterval = null;
        }
    }
}
