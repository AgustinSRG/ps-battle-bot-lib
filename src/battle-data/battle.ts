// Battle

"use strict";

import { BattleGlobalStatus } from "./battle-status";
import { BattlePlayer } from "./player";
import { BattleRequest } from "./request";

/**
 * Battle
 */
export interface Battle {
    /**
     * Battle identifier
     */
    id: string;

    /**
     * Turn number
     */
    turn: number;

    /**
     * Global conditions
     */
    status: BattleGlobalStatus;

    /**
     * Players
     * Player index -> Player data
     */
    players: Map<number, BattlePlayer>;

    /**
     * Index of the main player
     */
    mainPlayer?: number;

    /**
     * Current request
     */
    request: BattleRequest | null;

    /**
     * True if the battle ended
     */
    ended: boolean;

    /**
     * Index of the winning player
     */
    winner?: number;
}
