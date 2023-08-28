// Battle bot config

"use strict";

import { BattleAnalyzerFactory } from "../battle-analyzer";
import { BattleGameType } from "../battle-data";
import { DecisionAlgorithm } from "../battle-decision";
import { LAST_GEN } from "../battle-helpers";

/**
 * Battle bot configuration for a battle
 */
export interface BattleBotConfig {
    /**
     * Analyzer factory
     */
    analyzerFactory: BattleAnalyzerFactory;

    /**
     * Decision algorithm
     */
    algorithm: DecisionAlgorithm;

    /**
     * Max number of battle scenarios to keep in the context
     * By default, 0
     */
    scenariosMaxKeep?: number;
}

/**
 * Battle details to choose the configuration of the battle bot
 */
export interface BattleFormatDetails {
    /**
     * Battle id
     */
    id: string;

    /**
     * Generation
     */
    gen: number;

    /**
     * Game type
     */
    gameType: BattleGameType;
    
    /**
     * Format
     */
    format: string;
}

/**
 * Parses battle ID extracting the gen and the format
 * The game type is set to 'singles' by default
 * @param id The battle id
 * @returns The parsed battle details
 */
export function getFormatDetailsByBattleId(id: string): BattleFormatDetails {
    const format = id.split("-")[1] || "";

    let gen = LAST_GEN;
    const genParsed = (/^gen([0-9]+)/).exec(format);

    if (genParsed) {
        gen = parseInt(genParsed[1], 10) || LAST_GEN;
    }

    return {
        id: id,
        gameType: "singles",
        gen: gen,
        format: format,
    };
}

/**
 * Function to choose configuration for each battle
 */
export type BattleBotConfigFunc = (battleDetails: BattleFormatDetails) => BattleBotConfig;
