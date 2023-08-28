// Initializers

"use strict";

import { Battle, BattlePlayer, BattleRequestSidePokemon, BattleSidePokemon } from "../battle-data";
import { toId } from "../utils/id";
import { getMaxPPFromBasePP, getMoveBasePP } from "./move-pp-data";

/**
 * Last generation
 */
export const LAST_GEN = 9;

/**
 * Creates a battle with initial status
 * @param id The battle ID
 */
export function createBattle(id: string): Battle {
    return {
        id: id,
        turn: 0,
        request: null,
        players: new Map(),
        status: {
            gen: LAST_GEN,
            gameType: "singles",
            tier: "",
            rules: new Set(),
            isSleepClause: false,
            inverse: false,
            teamPreview: false,
            teamPreviewSize: 0,
            fields: new Map(),
            abilityEffects: new Set(),
        },
        ended: false,
    };
}

/**
 * Creates player with default status
 * @param playerIndex The player index
 */
export function createPlayer(playerIndex: number, name: string, avatar: string): BattlePlayer {
    return {
        index: playerIndex,
        name: name,
        avatar: avatar,
        teamSize: 0,
        teamPreview: [],
        team: [],
        active: new Map(),
        timesFainted: 0,
        sideConditions: new Map(),
    };
}

/**
 * Creates pokemon from request data
 * @param index Pokemon index
 * @param reqSidePoke Request data
 * @returns Side pokemon
 */
export function createSidePokemonFromRequest(gen: number, index: number, reqSidePoke: BattleRequestSidePokemon): BattleSidePokemon {
    return {
        index: index,
        ident: reqSidePoke.ident,
        revealed: false,
        active: false,
        details: reqSidePoke.details,
        condition: reqSidePoke.condition,
        stats: {
            hp: {
                known: true,
                min: reqSidePoke.condition.maxHP,
                max: reqSidePoke.condition.maxHP,
            },
            atk: {
                known: true,
                min: reqSidePoke.stats.atk,
                max: reqSidePoke.stats.atk,
            },
            def: {
                known: true,
                min: reqSidePoke.stats.def,
                max: reqSidePoke.stats.def,
            },
            spa: {
                known: true,
                min: reqSidePoke.stats.spa,
                max: reqSidePoke.stats.spa,
            },
            spd: {
                known: true,
                min: reqSidePoke.stats.spd,
                max: reqSidePoke.stats.spd,
            },
            spe: {
                known: true,
                min: reqSidePoke.stats.spe,
                max: reqSidePoke.stats.spe,
            }
        },
        moves: new Map(reqSidePoke.moves.map(m => {
            const pp = getMaxPPFromBasePP(getMoveBasePP(gen, m));
            return [
                toId(m),
                {
                    id: toId(m),
                    revealed: false,
                    maxPP: pp,
                    pp: pp,
                    disabled: false,
                },
            ];
        })),
        item: {
            known: true,
            revealed: false,
            item: reqSidePoke.item,
        },
        ability: {
            known: true,
            revealed: false,
            ability: reqSidePoke.ability,
            baseAbility: reqSidePoke.baseAbility || reqSidePoke.ability,
            activationCount: 0,
        },
        timesHit: 0,
        totalBurnedSleepTurns: 0,
        sleptByRest: false,
    };
}
