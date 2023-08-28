// Battle analyzer

"use strict";

import { Battle, BattleEvent } from "../battle-data";

/**
 * Battle analyzer
 */
export interface BattleAnalyzer {
    /**
     * Error event
     * @param event Event name
     * @param handler Handler
     */
    on(event: "error", handler: (err: Error) => void): this;

    /**
     * Debug message event
     * @param event Event name
     * @param handler Handler
     */
    on(event: "debug", handler: (msg: string) => void): this;

    /**
     * Handles the event, updating the battle.
     * @param event The event to handle
     */
    nextEvent(event: BattleEvent): void;

    /**
     * Adds a debug message
     * @param msg The message
     */
    debug(msg: string): void;

    /**
     * Releases any resources allocated by the analyzer
     */
    destroy(): void;
}

/**
 * Initializes an analyzer with a battle
 */
export type BattleAnalyzerFactory = (battle: Battle) => BattleAnalyzer;
