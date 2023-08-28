// Utilities to find pokemon

"use strict";

import { Battle, BattleActivePokemon, BattlePlayer, BattleRequest, BattleSidePokemon, PokemonCondition, PokemonDetails, PokemonIdentTarget, compareDetails } from "../battle-data";
import { compareIds, toId } from "../utils/id";
import { clone } from "../utils/clone";
import { unknownAbility } from "./ability";
import { unknownItem } from "./item";
import { getStatRangeFromDetails } from "./pokemon";
import { toID } from "@asanrom/poke-calc";

/**
 * Pokemon find result
 */
export interface FoundPokemon {
    /**
     * Found player
     */
    player?: BattlePlayer;

    /**
     * Found side pokemon
     */
    pokemon?: BattleSidePokemon;

    /**
     * Found active pokemon
     */
    active?: BattleActivePokemon;
}

/**
 * Finds a pokemon
 * @param battle The battle
 * @param target The target
 * @param detailsFilter Additional details filter (for side pokemon)
 * @param conditionFilter Additional condition filter (for side pokemon)
 * @returns The found pokemon
 */
export function findPokemonInBattle(battle: Battle, target: PokemonIdentTarget, detailsFilter?: PokemonDetails, conditionFilter?: PokemonCondition): FoundPokemon {
    if (!battle.players.has(target.playerIndex)) {
        return {};
    }

    const player = battle.players.get(target.playerIndex);

    if (target.active) {
        // Is active
        if (!player.active.has(target.slot)) {
            return { player: player };
        }

        const active = player.active.get(target.slot);

        return {
            player: player,
            active: active,
            pokemon: player.team[active.index],
        };
    } else {
        // Not active

        const foundSidePoke = findSidePokemon(player, target.name, detailsFilter, conditionFilter, true);

        if (!foundSidePoke) {
            return { player: player };
        }

        return {
            player: player,
            pokemon: foundSidePoke,
        };
    }
}

/**
 * Fins non-active pokemon
 * @param player The player
 * @param targetName The pokemon name
 * @param detailsFilter The pokemon details
 * @param conditionFilter The pokemon current condition
 * @returns The found pokemon, or null
 */
export function findSidePokemon(player: BattlePlayer, targetName: string, detailsFilter?: PokemonDetails, conditionFilter?: PokemonCondition, notActive?: boolean): BattleSidePokemon | null {
    let currentTeam = !notActive ? player.team.slice() : player.team.filter(poke => {
        return !poke.active;
    });

    let filteredTeam: BattleSidePokemon[];

    // If details filter is set, this is the most important filter
    if (detailsFilter) {
        filteredTeam = currentTeam.filter(poke => {
            return compareDetails(poke.details, detailsFilter);
        });

        if (filteredTeam.length === 0) {
            return null;
        }

        if (filteredTeam.length === 1) {
            return filteredTeam[0];
        }

        currentTeam = filteredTeam;
    }

    // Filter by the name
    filteredTeam = currentTeam.filter(poke => {
        return poke.ident.name === targetName;
    });

    if (filteredTeam.length === 0) {
        return null;
    }

    if (filteredTeam.length === 1) {
        return filteredTeam[0];
    }

    currentTeam = filteredTeam;

    // Filter by the condition

    if (conditionFilter) {
        filteredTeam = currentTeam.filter(poke => {
            if (poke.condition.status !== conditionFilter.status) {
                return false;
            }

            if (poke.condition.maxHP !== conditionFilter.maxHP) {
                return false;
            }

            if (poke.condition.hp === conditionFilter.hp) {
                return true;
            }

            // Maybe it regenerated life

            const regeneratedLife = Math.floor(poke.condition.hp + (poke.condition.maxHP / 3));
            const minRange = Math.max(0, Math.min(poke.condition.maxHP, regeneratedLife - 1));
            const maxRange = Math.max(0, Math.min(poke.condition.maxHP, regeneratedLife + 1));

            if (conditionFilter.hp >= minRange && conditionFilter.hp <= maxRange) {
                return true;
            }

            return false;
        });

        if (filteredTeam.length === 0) {
            return null;
        }
    }

    return filteredTeam[0];
}

/**
 * Creates active pokemon from side pokemon
 * @param pokemon The side pokemon
 * @param slot The active slot
 * @param turn The turn it was switched in
 * @returns The active pokemon
 */
export function createActiveFromSide(pokemon: BattleSidePokemon, slot: number, turn: number): BattleActivePokemon {
    return {
        slot: slot,
        ident: clone(pokemon.ident),
        index: pokemon.index,
        details: clone(pokemon.details),
        condition: clone(pokemon.condition),
        stats: clone(pokemon.stats),
        boosts: new Map(),
        moves: clone(pokemon.moves),
        item: clone(pokemon.item),
        ability: clone(pokemon.ability),
        volatiles: new Set(),
        volatilesData: {},
        singleTurnStatuses: new Set(),
        singleMoveStatuses: new Set(),
        switchedOnTurn: turn,
        timesHit: pokemon.timesHit,
        totalBurnedSleepTurns: pokemon.totalBurnedSleepTurns,
        sleptByRest: pokemon.sleptByRest,
    };
}

/**
 * Checks if player team is fully known
 * @param battle The battle
 * @param player the player
 * @returns True if the team is fully known
 */
export function playerTeamFullKnown(battle: Battle, player: BattlePlayer): boolean {
    if (player.teamSize && player.team.length >= player.teamSize) {
        return true;
    }

    if (battle.status.teamPreview && battle.status.teamPreviewSize && player.team.length >= battle.status.teamPreviewSize) {
        return true;
    }

    return false;
}

/**
 * Fins side pokemon or creates it for non team-preview
 * @param battle The battle
 * @param player The player
 * @param targetName The pokemon name
 * @param details The details
 * @param condition The condition
 * @returns The side pokemon, or null
 */
export function findSidePokemonOrCreateIt(battle: Battle, player: BattlePlayer, targetName: string, details: PokemonDetails, condition: PokemonCondition): BattleSidePokemon {
    const sidePokemonFound = findSidePokemon(player, targetName, details, condition, true);

    if (sidePokemonFound) {
        return sidePokemonFound;
    }

    if (playerTeamFullKnown(battle, player)) {
        return {
            index: -1,
            active: false,
            revealed: true,
            ident: {
                playerIndex: player.index,
                name: targetName,
            },
            details: clone(details),
            condition: clone(condition),
            stats: getStatRangeFromDetails(battle.status.gen, details),
            item: unknownItem(),
            ability: unknownAbility(),
            timesHit: 0,
            totalBurnedSleepTurns: 0,
            sleptByRest: false,
            moves: new Map(),
        };
    }

    if (battle.status.rules.has(toId("Species Clause"))) {
        let violatesSpeciesClause = false;

        for (const poke of player.team) {
            if (compareIds(poke.details.species, details.species)) {
                violatesSpeciesClause = true;
                break;
            }
        }

        if (violatesSpeciesClause) {
            // This is illusion
            // But we don't know if it's the real pokemon or the illusion user
            return {
                index: -1,
                active: false,
                revealed: true,
                ident: {
                    playerIndex: player.index,
                    name: targetName,
                },
                details: clone(details),
                condition: clone(condition),
                stats: getStatRangeFromDetails(battle.status.gen, details),
                item: unknownItem(),
                ability: unknownAbility(),
                timesHit: 0,
                totalBurnedSleepTurns: 0,
                sleptByRest: false,
                moves: new Map(),
            };
        }
    }

    // New revealed pokemon

    const newRevealedPoke: BattleSidePokemon = {
        index: player.team.length,
        active: false,
        revealed: true,
        ident: {
            playerIndex: player.index,
            name: targetName,
        },
        details: clone(details),
        condition: clone(condition),
        stats: getStatRangeFromDetails(battle.status.gen, details),
        item: unknownItem(),
        ability: unknownAbility(),
        timesHit: 0,
        totalBurnedSleepTurns: 0,
        sleptByRest: false,
        moves: new Map(),
    };

    player.team.push(newRevealedPoke);

    return newRevealedPoke;
}

/**
 * Finds request side pokemon
 * @param request The request
 * @param targetName The target name
 * @param detailsFilter The details filter
 * @param conditionFilter The conditions filter
 * @returns The index of the switched pokemon in the request
 */
export function findRequestSidePokemon(request: BattleRequest, targetName: string, detailsFilter: PokemonDetails, conditionFilter: PokemonCondition): number {
    let possibleSwitches: number[] = [];

    // Initial filter

    for (let i = 0; i < request.side.pokemon.length; i++) {
        if (request.side.pokemon[i].active || request.side.pokemon[i].condition.fainted) {
            continue;
        }

        possibleSwitches.push(i);
    }

    if (possibleSwitches.length === 0) {
        return -1;
    }

    if (possibleSwitches.length === 1) {
        return possibleSwitches[0];
    }

    // Filter by ident

    possibleSwitches = possibleSwitches.filter(i => {
        return (request.side.pokemon[i].ident.name === targetName);
    });

    if (possibleSwitches.length === 0) {
        return -1;
    }

    if (possibleSwitches.length === 1) {
        return possibleSwitches[0];
    }

    // Filter by details

    possibleSwitches = possibleSwitches.filter(i => {
        return compareDetails(request.side.pokemon[i].details, detailsFilter);
    });

    if (possibleSwitches.length === 0) {
        return -1;
    }

    if (possibleSwitches.length === 1) {
        return possibleSwitches[0];
    }

    // Filter by condition

    possibleSwitches = possibleSwitches.filter(i => {
        const poke = request.side.pokemon[i];

        if (poke.condition.status !== conditionFilter.status) {
            return false;
        }

        if (poke.condition.maxHP !== conditionFilter.maxHP) {
            return false;
        }

        if (poke.condition.hp === conditionFilter.hp) {
            return true;
        }

        // Maybe it regenerated life

        const regeneratedLife = Math.floor(poke.condition.hp + (poke.condition.maxHP / 3));
        const minRange = Math.max(0, Math.min(poke.condition.maxHP, regeneratedLife - 1));
        const maxRange = Math.max(0, Math.min(poke.condition.maxHP, regeneratedLife + 1));

        if (conditionFilter.hp >= minRange && conditionFilter.hp <= maxRange) {
            return true;
        }

        return false;
    });

    if (possibleSwitches.length === 0) {
        return -1;
    }

    return possibleSwitches[0];
}
