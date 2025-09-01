// Battle bot

"use strict";

import { Battle, BattleEvent } from "../battle-data";
import { BattleDecision, BattleDecisionScenario } from "../battle-decision";
import { EventEmitter } from "events";
import { createBattle } from "../battle-helpers";
import { BattleBotBattleStatus } from "./battle-status";
import { BattleBotConfigFunc, getFormatDetailsByBattleId } from "./config";
import { CancellablePromise } from "../utils/cancellable-promise";
import { clone } from "../utils";

const DECISION_TIMEOUT = 1000;

export * from "./config";
export * from "./battle-status";

/**
 * Battle bot
 */
export interface BattleBot {
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
     * Playing event
     * Triggered when the first request is received
     * @param event Event name
     * @param handler Handler
     */
    on(event: "playing", handler: (battle: Battle) => void): this;

    /**
     * Decision event
     * Triggered when a decision is made
     * @param event Event name
     * @param handler Handler
     */
    on(event: "decision", handler: (battle: Battle, decision: BattleDecision) => void): this;
}

/**
 * Battle bot options
 */
export interface BattleBotOptions {
    /**
     * Automatically makes decisions after receiving battle events
     * Set it to false to manually call the makeDecision() method to get a decision
     * Default: true
     */
    autoDecisionMaking?: boolean;
}

/**
 * Battle bot
 */
export class BattleBot extends EventEmitter {
    /**
     * Options for the battle bot
     */
    public options: BattleBotOptions;

    /**
     * Configuration function
     */
    public configFunc: BattleBotConfigFunc;

    /**
     * Active battles
     */
    private battles: Map<string, BattleBotBattleStatus>;

    /**
     * Instantiates a battle bot
     * @param configFunc The configuration function
     * @param options Options for the battle bot
     */
    constructor(configFunc: BattleBotConfigFunc, options?: BattleBotOptions) {
        super();

        this.options = options || {};
        this.configFunc = configFunc;
        this.battles = new Map();
    }

    /**
     * Initializes battle
     * @param id Battle ID
     */
    public initBattle(id: string) {
        this.battles.set(id, {
            battle: createBattle(id),
            formatDetails: getFormatDetailsByBattleId(id),
            scenariosMaxKeep: 0,
            log: [],
            playing: false,
            previousScenarios: [],
        });
    }

    /**
     * Gets a battle
     * @param id The battle ID
     * @returns The battle, or null
     */
    public getBattle(id: string): Battle | null {
        if (!this.battles.has(id)) {
            return null;
        }

        return this.battles.get(id).battle;
    }

    /**
     * Removes a battle
     * @param id battle id
     */
    public removeBattle(id: string) {
        const battle = this.battles.get(id);

        if (!battle) {
            return;
        }

        if (battle.analyzer) {
            try {
                battle.analyzer.destroy();
            } catch (ex) {
                this.emit("error", ex);
            }
        }

        if (battle.decisionTimeout) {
            clearTimeout(battle.decisionTimeout);
            battle.decisionTimeout = null;
        }

        if (battle.decisionPromise) {
            battle.decisionPromise.cancel();
        }

        this.battles.delete(id);
    }

    /**
     * Adds battle event
     * @param id The battle ID
     * @param event The event
     */
    public addBattleEvent(id: string, event: BattleEvent) {
        const battle = this.battles.get(id);

        if (!battle) {
            return;
        }

        this.addBattleEventInternal(id, battle, event);
    }

    /**
     * Adds battle events
     * @param id The battle ID
     * @param events The events
     */
    public addBattleEvents(id: string, events: BattleEvent[]) {
        const battle = this.battles.get(id);

        if (!battle) {
            return;
        }

        for (const event of events) {
            this.addBattleEventInternal(id, battle, event);
        }
    }

    /**
     * Adds battle event
     * @param id The battle ID
     * @param event The event
     */
    private addBattleEventInternal(id: string, battle: BattleBotBattleStatus, event: BattleEvent) {
        if (battle.analyzer) {
            // Analyze event
            battle.analyzer.nextEvent(event);
        }

        // Add log
        battle.log.push(event);

        if (battle.decisionPromise) {
            battle.decisionPromise.cancel();
            battle.decisionPromise = null;
        }

        if (battle.decisionTimeout) {
            clearTimeout(battle.decisionTimeout);
            battle.decisionTimeout = null;
        }

        if (event.type === "Request" && !battle.playing) {
            const battleConfig = this.configFunc(battle.formatDetails);

            // Setup battle to play
            battle.playing = true;
            battle.analyzer = battleConfig.analyzerFactory(battle.battle);

            battle.analyzer.on("error", err => {
                this.emit("error", err);
            });

            battle.analyzer.on("debug", msg => {
                this.emit("debug", id, msg);
            });

            battle.scenariosMaxKeep = battleConfig.scenariosMaxKeep || 0;
            battle.decisionAlgorithm = battleConfig.algorithm;

            // Analyze log
            for (const logEntry of battle.log) {
                try {
                    battle.analyzer.nextEvent(logEntry);
                } catch (ex) {
                    this.emit("error", ex);
                }
            }

            // Emit event
            this.emit("playing", battle.battle);

        } else if (event.type === "GameType") {
            battle.formatDetails.gameType = event.gameType;
        }

        if (battle.playing && this.options.autoDecisionMaking !== false) {
            // Setup decision timeout
            battle.decisionTimeout = setTimeout(() => {
                battle.decisionTimeout = null;
                this.makeDecisionInternal(battle);
            }, DECISION_TIMEOUT);
        }
    }

    /**
     * Makes decision
     * @param battle The battle
     * @returns The decision
     */
    private makeDecisionInternal(battle: BattleBotBattleStatus): Promise<BattleDecision | null> {
        return new Promise<BattleDecision | null>((resolve, reject) => {
            if (!battle.playing) {
                resolve(null);
                return;
            }

            if (battle.decisionPromise) {
                resolve(null);
                return; // Already deciding
            }

            battle.decisionPromise = new CancellablePromise(battle.decisionAlgorithm.decide({
                battle: battle.battle,
                analyzer: battle.analyzer,
                battleLog: battle.log,
                previousScenarios: battle.previousScenarios,
            }));

            battle.decisionPromise.onCancel(() => {
                resolve(null);
            });

            battle.decisionPromise.then(decision => {
                battle.decisionPromise = null;

                const battleSnapshot = clone(battle.battle);

                // Add battle scenario
                if (battle.scenariosMaxKeep > 0) {
                    const scenario: BattleDecisionScenario = {
                        battle: battleSnapshot,
                        decision: decision,
                    };

                    battle.previousScenarios.push(scenario);

                    while (battle.previousScenarios.length > battle.scenariosMaxKeep) {
                        battle.previousScenarios.shift();
                    }
                }

                // Emit decision
                this.emit("decision", battleSnapshot, decision);

                resolve(decision);
            });

            battle.decisionPromise.catch(err => {
                battle.decisionPromise = null;

                this.emit("error", err);

                reject(err);
            });
        });
    }

    /**
     * Makes decision
     * @param id The battle ID
     * @returns The decision
     */
    public makeDecision(id: string): Promise<BattleDecision | null> {
        const battle = this.battles.get(id);

        if (!battle || !battle.playing) {
            return null;
        }

        if (battle.decisionTimeout) {
            clearTimeout(battle.decisionTimeout);
            battle.decisionTimeout = null;
        }

        return this.makeDecisionInternal(battle);
    }
}
