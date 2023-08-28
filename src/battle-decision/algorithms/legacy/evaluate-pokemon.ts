// Evaluate pokemon for switching

"use strict";

import { Battle, BattleActivePokemon, VolatileStatuses, getCombinedEffectivenessMultiplier, getTypeChart } from "../../../battle-data";
import { abilityIsEnabled, calcDamage, createActiveFromSide, createSidePokemonFromRequest, findSidePokemon, getPokemonCurrentTypes } from "../../../battle-helpers";
import { applyCommonSetsToFoeActive } from "../../../battle-helpers/pokemon-sets";
import { clone, compareIds, toId } from "../../../utils";
import { applyDamageExceptions } from "./evaluate-move-damage";

/**
 * Pokemon evaluation value
 */
export interface PokemonEvaluationValue {
    /**
     * Types mux
     */
    typesMux: number;

    /**
     * Max damage it can deal
     */
    maxDamage: number;
}

/**
 * Evaluates pokemon
 * @param battle The battle
 * @param requestIndex The request index
 * @param isActive True if the valuated pokemon is active
 * @return Evaluation value
 */
export async function evaluatePokemon(battle: Battle, requestIndex: number, isActive?: boolean): Promise<PokemonEvaluationValue> {
    if (!battle.request || !battle.request.side.pokemon[requestIndex]) {
        return {
            typesMux: 0,
            maxDamage: 0,
        };
    }

    const result: PokemonEvaluationValue = {
        typesMux: 0,
        maxDamage: 0,
    };

    const mainPlayer = battle.players.get(battle.mainPlayer);

    if (!mainPlayer) {
        return {
            typesMux: 0,
            maxDamage: 0,
        };
    }

    const pokeA = createActiveFromSide(createSidePokemonFromRequest(battle.status.gen, -1, battle.request.side.pokemon[requestIndex]), 0, 1);

    if (isActive && battle.request.active) {
        const activeRequest = battle.request.active[requestIndex];

        if (activeRequest) {
            pokeA.moves = new Map();

            for (const move of activeRequest.moves) {
                pokeA.moves.set(toId(move.id), {
                    id: move.id,
                    maxPP: move.maxPP || 1,
                    pp: move.pp !== undefined ? move.pp : 1,
                    disabled: move.disabled,
                    revealed: false,
                });
            }
        }
    } else {
        const sidePokemon = findSidePokemon(mainPlayer, pokeA.ident.name, pokeA.details, pokeA.condition, true);

        if (sidePokemon) {
            pokeA.moves = clone(sidePokemon.moves);
        }
    }

    const typeChart = getTypeChart(battle.status.gen);

    for (const player of battle.players.values()) {
        if (player.index === battle.mainPlayer) {
            continue;
        }

        for (const foeActive of player.active.values()) {
            if (foeActive.condition.fainted) {
                continue;
            }

            const pokeB = await applyCommonSetsToFoeActive(battle, foeActive);

            /* Types mux */

            const typesA = getPokemonCurrentTypes(battle, pokeA);
            const typesB = getPokemonCurrentTypes(battle, pokeB);

            const typesMux = getCombinedEffectivenessMultiplier(typeChart, typesB, typesA, battle.status.inverse);

            result.typesMux += typesMux;

            /* Max damage */

            let topDamageDealt = 0;

            for (const move of pokeA.moves.values()) {
                if (move.pp <= 0) {
                    continue;
                }

                let damage = calcDamage(battle, mainPlayer, pokeA, player, pokeB, move.id, {
                    considerStatsAttacker: "max",
                    considerStatsDefender: "max",
                    usePercent: true,
                    ignoreCurrentHP: true,
                });

                damage = applyDamageExceptions(battle, mainPlayer, pokeA, player, pokeB, move.id, damage);

                const maxDmg = Math.min(100, damage.max);

                if (topDamageDealt < maxDmg) {
                    topDamageDealt = maxDmg;
                }
            }

            result.maxDamage += topDamageDealt;
        }
    }

    return result;
}

/**
 * Checks if the pokemon has a bad volatile condition that can be removed by switching
 * @param battle The battle
 * @param pokemon The pokemon
 * @returns True if it has a negative volatile condition
 */
export function checkBadVolatileCondition(battle: Battle, pokemon: BattleActivePokemon): boolean {
    if (pokemon.volatiles.has(VolatileStatuses.LeechSeed) || pokemon.volatiles.has(VolatileStatuses.Curse)) {
        if (!compareIds(pokemon.ability.ability, "Magic Guard") || !abilityIsEnabled(battle, pokemon)) {
            return true;
        }
    }

    if (pokemon.boosts.has("atk") && pokemon.boosts.get("atk") < 0) {
        return true;
    }

    if (pokemon.boosts.has("spa") && pokemon.boosts.get("spa") < 0) {
        return true;
    }

    if (pokemon.boosts.has("accuracy") && pokemon.boosts.get("accuracy") < 0) {
        return true;
    }

    return false;
}

/**
 * Compares two evaluations
 * @param a A
 * @param b B
 * @returns -1 if A > B, 1 if B > A
 */
export function compareEvaluations(a: PokemonEvaluationValue, b: PokemonEvaluationValue): number {
    if (a.maxDamage > 0 && b.maxDamage === 0) {
        return -1;
    } else if (a.maxDamage === 0 && b.maxDamage > 0) {
        return 1;
    } else if (a.typesMux < b.typesMux) {
        return -1;
    } else if (a.typesMux > b.typesMux) {
        return 1;
    } else if (a.maxDamage > b.maxDamage) {
        return -1;
    } else if (a.maxDamage < b.maxDamage) {
        return 1;
    } else {
        return 0;
    }
}
