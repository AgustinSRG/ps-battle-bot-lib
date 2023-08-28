// Battle player

"use strict";

import { BattleActivePokemon } from "./player-pokemon-active";
import { TeamPreviewPokemon } from "./player-pokemon-preview";
import { BattleSidePokemon } from "./player-pokemon-side";
import { SideCondition } from "./side-conditions";

/**
 * Player status
 */
export interface BattlePlayer {
    /**
     * Player index
     */
    index: number;

    /**
     * Player name
     */
    name: string;

    /**
     * Player avatar
     */
    avatar: string;

    /**
     * Team size
     */
    teamSize: number;

    /**
     * Team preview info
     */
    teamPreview: TeamPreviewPokemon[];

    /**
     * Team (List of pokemon)
     */
    team: BattleSidePokemon[];

    /**
     * Active pokemon
     * slot -> active pokemon status
     */
    active: Map<number, BattleActivePokemon>;

    /**
     * Number of times a pokemon fainted
     */
    timesFainted: number;

    /**
     * Active side conditions
     */
    sideConditions: Map<string, SideCondition>;
}

/**
 * Finds active slot from request index
 * @param player The player
 * @param requestIndex The request index
 * @returns The active slot
 */
export function findActiveSlotByRequestIndex(player: BattlePlayer, requestIndex: number): number {
    const activeSlotList = Array.from(player.active.keys()).sort((a, b) => {
        if (a < b) {
            return -1;
        } else {
            return 1;
        }
    });

    return activeSlotList[requestIndex];
}

/**
 * Finds active from request index
 * @param player The player
 * @param requestIndex The request index
 * @returns The active
 */
export function findActiveByRequestIndex(player: BattlePlayer, requestIndex: number): BattleActivePokemon | null {
    const activeSlotList = Array.from(player.active.keys()).sort((a, b) => {
        if (a < b) {
            return -1;
        } else {
            return 1;
        }
    });

    if (requestIndex < 0 || requestIndex >= activeSlotList.length) {
        return null;
    }

    return player.active.get(activeSlotList[requestIndex]);
}

/**
 * Gets request index by active slot
 * @param player The player
 * @param slot The active slot
 * @returns The request index
 */
export function requestIndexByActiveSlot(player: BattlePlayer, slot: number): number {
    const activeSlotList = Array.from(player.active.keys()).sort((a, b) => {
        if (a < b) {
            return -1;
        } else {
            return 1;
        }
    });

    return activeSlotList.indexOf(slot);
}
