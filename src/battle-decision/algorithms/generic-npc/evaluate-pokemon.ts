// Evaluate pokemon for switching

"use strict";

import { Battle, BattleActivePokemon, BattlePlayer, VolatileStatuses } from "../../../battle-data";
import { DamageResult, abilityIsEnabled, calcDamage, calcMoveAccuracy, createActiveFromSide, createSidePokemonFromRequest, findSidePokemon, getActivePokemonTurnRecovery } from "../../../battle-helpers";
import { applyCommonSetsToFoeActive } from "../../../battle-helpers/pokemon-sets";
import { clone, compareIds, toId } from "../../../utils";
import { applyDamageExceptions } from "./evaluate-move-damage";

/**
 * Evaluates pokemon
 * @param battle The battle
 * @param requestIndex The request index
 * @param isActive True if the valuated pokemon is active
 * @return Evaluation value
 */
export async function evaluatePokemon(battle: Battle, requestIndex: number, isActive?: boolean): Promise<number> {
    if (!battle.request || !battle.request.side.pokemon[requestIndex]) {
        return 0;
    }

    let result = 0;

    const mainPlayer = battle.players.get(battle.mainPlayer);

    if (!mainPlayer) {
        return 0;
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

    for (const player of battle.players.values()) {
        if (player.index === battle.mainPlayer) {
            continue;
        }

        for (const foeActive of player.active.values()) {
            if (foeActive.condition.fainted) {
                continue;
            }

            const pokeB = await applyCommonSetsToFoeActive(battle, foeActive);

            let topDamageDealt = 0;
            const turnRecovery = getActivePokemonTurnRecovery(battle, pokeB);

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

                const maxDmg = Math.min(100, Math.max(0, damage.max - turnRecovery)) * calcMoveAccuracy(battle, mainPlayer, pokeA, player, pokeB, move.id);

                if (topDamageDealt < maxDmg) {
                    topDamageDealt = maxDmg;
                }
            }

            let topDamageTaken = 0;

            for (const move of pokeB.moves.values()) {
                if (move.pp <= 0) {
                    continue;
                }

                let damage = calcDamage(battle, player, pokeB, mainPlayer, pokeA, move.id, {
                    considerStatsAttacker: "max",
                    considerStatsDefender: "max",
                    usePercent: true,
                    ignoreCurrentHP: true,
                });

                damage = applyDamageExceptions(battle, player, pokeB, mainPlayer, pokeA, move.id, damage);

                const maxDmg = Math.min(100, damage.max) * calcMoveAccuracy(battle, player, pokeB, mainPlayer, pokeA, move.id);

                if (topDamageTaken < maxDmg) {
                    topDamageTaken = maxDmg;
                }
            }

            const evaluationPart = (topDamageDealt) / (1 + topDamageTaken);

            result += evaluationPart;
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
