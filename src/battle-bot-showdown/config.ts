// Configuration

"use strict";

import { BattleBotConfigFunc } from "../battle-bot";
import { PokemonTeam } from "./teams";

/**
 * Pokemon Showdown battle bot configuration
 */
export interface PokemonShowdownBattleBotConfig {
    /**
     * Battle bot configuration function
     */
    configFunc: BattleBotConfigFunc;

    /**
     * True to automatically turn on the timer
     */
    autoSetTimer?: boolean;

    /**
     * List of teams for the bot
     * Mapping format => list of teams
     */
    teams?: Map<string, PokemonTeam[]>;

    /**
     * True to auto accept challenges
     */
    acceptChallenges?: boolean;

    /**
     * Function to call to authorize a challenge accept
     * @param user The user who is challenging
     * @param format The format
     * @param rules Custom rules added to the format
     * @returns True if the bot should accept the challenge
     */
    acceptChallengeFunc?: (user: string, format: string, rules: string[]) => boolean;

    /**
     * Format to automatically search ladder battles
     */
    autoLadder?: string;

    /**
     * Delay to search for new battles (in milliseconds)
     * By default: 10 seconds
     */
    autoLadderCheckDelay?: number;

    /**
     * Max number of parallel battles
     * 0 for no limit
     */
    maxBattles?: number;

    /**
     * True to join abandoned battles
     * (For reconnection)
     */
    joinAbandonedBattles?: boolean;

    /**
     * True for the bot to leave the battle after it ends
     */
    leaveAfterBattleEnds?: boolean;
}