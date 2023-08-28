// Pokemon switch evaluation

"use strict";

import { Battle } from "../../../battle-data";
import { calcDamage, calcMoveAccuracy, createActiveFromSide, createSidePokeFromDetails, createSidePokemonFromRequest, findSidePokemon } from "../../../battle-helpers";
import { clone, toId } from "../../../utils";
import { applyExceptions } from "./exceptions";

const FirstTurnOnlyMoves = new Set<string>([
    'Fake Out',
    'First Impression',
    'Burn Up',
    'Double Shock'
].map(toId));

/**
 * Evaluates pokemon in a team preview situation
 * @param battle The battle
 * @param requestIndex The request index
 * @returns The summation of all the top damages
 */
export function evaluatePokemonTeamPreview(battle: Battle, requestIndex: number): number {
    if (!battle.request || !battle.request.side.pokemon[requestIndex]) {
        return 0;
    }

    let result = 0;

    const mainPlayer = battle.players.get(battle.mainPlayer);

    if (!mainPlayer) {
        return 0;
    }

    const pokeA = createActiveFromSide(createSidePokemonFromRequest(battle.status.gen, -1, battle.request.side.pokemon[requestIndex]), 0, 1);

    for (const player of battle.players.values()) {
        if (player.index === battle.mainPlayer) {
            continue;
        }

        for (const pokeTP of player.teamPreview) {
            const pokeB = createActiveFromSide(createSidePokeFromDetails(battle, player, pokeTP.details), 0, 1);


            let topDamage = 0;

            for (const move of pokeA.moves.values()) {
                if (FirstTurnOnlyMoves.has(toId(move.id))) {
                    continue;
                }

                const damage = calcDamage(battle, mainPlayer, pokeA, player, pokeB, move.id, {
                    considerStatsAttacker: "max",
                    considerStatsDefender: "max",
                    usePercent: true,
                });

                const maxDmg = Math.min(100, applyExceptions(battle, pokeA, pokeB, move.id, damage.max)) * calcMoveAccuracy(battle, mainPlayer, pokeA, player, pokeB, move.id);

                if (topDamage < maxDmg) {
                    topDamage = maxDmg;
                }
            }

            result += topDamage;
        }
    }

    return result;
}

/**
 * Evaluates pokemon in a force switch situation
 * @param battle The battle
 * @param requestIndex The request index
 * @returns The summation of all the top damages
 */
export function evaluatePokemonForceSwitch(battle: Battle, requestIndex: number) {
    if (!battle.request || !battle.request.side.pokemon[requestIndex]) {
        return 0;
    }

    let result = 0;

    const mainPlayer = battle.players.get(battle.mainPlayer);

    if (!mainPlayer) {
        return 0;
    }

    const pokeA = createActiveFromSide(createSidePokemonFromRequest(battle.status.gen, -1, battle.request.side.pokemon[requestIndex]), 0, 1);

    const sidePokemon = findSidePokemon(mainPlayer, pokeA.ident.name, pokeA.details, pokeA.condition, true);

    if (sidePokemon) {
        pokeA.moves = clone(sidePokemon.moves);
    }

    for (const player of battle.players.values()) {
        if (player.index === battle.mainPlayer) {
            continue;
        }

        for (const pokeB of player.active.values()) {
            if (pokeB.condition.fainted) {
                continue;
            }

            let topDamage = 0;

            for (const move of pokeA.moves.values()) {
                if (move.pp <= 0) {
                    continue;
                }

                if (FirstTurnOnlyMoves.has(toId(move.id))) {
                    continue;
                }

                const damage = calcDamage(battle, mainPlayer, pokeA, player, pokeB, move.id, {
                    considerStatsAttacker: "max",
                    considerStatsDefender: "max",
                    usePercent: true,
                    ignoreCurrentHP: true,
                });

                const maxDmg = Math.min(100, applyExceptions(battle, pokeA, pokeB, move.id, damage.max)) * calcMoveAccuracy(battle, mainPlayer, pokeA, player, pokeB, move.id);

                if (topDamage < maxDmg) {
                    topDamage = maxDmg;
                }
            }

            result += topDamage;
        }
    }

    return result;
}
