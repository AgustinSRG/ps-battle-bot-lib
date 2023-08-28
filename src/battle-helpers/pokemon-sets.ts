// Pokemon known sets to enhance algorithms

"use strict";

import Path from "path";
import { Pokemon } from "@asanrom/poke-calc";
import { Battle, BattleActivePokemon, VolatileStatuses } from "../battle-data";
import { clone, toId } from "../utils";
import { findPokemonData } from "./poke-data-find";
import { LAST_GEN } from "./initializers";
import { readFileSync } from "fs";

/**
 * Pokemon common set
 */
export interface PokemonCommonSet {
    ability?: string;
    item?: string;
    moves?: string[];
    nature?: string;
    ivs?: {
        hp?: number;
        atk?: number;
        def?: number;
        spa?: number;
        spd?: number;
        spe?: number;
    };
    evs?: {
        hp?: number;
        atk?: number;
        def?: number;
        spa?: number;
        spd?: number;
        spe?: number;
    };
}

/**
 * Sets repository
 */
export type PokemonCommonSetRepository = Map<string, PokemonCommonSet>;

const PokemonCommonSetRepositories = new Map<number, PokemonCommonSetRepository>();

function getRepository(gen: number): PokemonCommonSetRepository {
    gen = Math.floor(gen) || LAST_GEN;

    if (gen < 1 || gen > 9) {
        gen = 9;
    }

    if (PokemonCommonSetRepositories.has(gen)) {
        return PokemonCommonSetRepositories.get(gen);
    }

    const repository = new Map<string, PokemonCommonSet>(JSON.parse(readFileSync(Path.resolve(__dirname, "..", "..", "lib-data", "sets", "sets-" + gen + ".json")).toString()));

    PokemonCommonSetRepositories.set(gen, repository);

    return repository;
}

/**
 * Applies common sets to active foe
 * @param battle The battle
 * @param active The active foe
 * @returns The modified active
 */
export async function applyCommonSetsToFoeActive(battle: Battle, active: BattleActivePokemon): Promise<BattleActivePokemon> {
    const gen = battle.status.gen;

    const repository = getRepository(gen);
    let species = active.details.species;
    if (active.volatilesData.fake && active.volatilesData.fakeGuess) {
        species = active.volatilesData.fakeGuess;
    }
    if (active.volatiles.has(VolatileStatuses.Transform) && active.volatilesData.transformedInfo) {
        species = active.volatilesData.transformedInfo.details.species;
    }

    const commonSet  = repository.get(toId(species));
    const pokeData = findPokemonData(gen, species);
    const modifiedActive = clone(active);

    // Ability

    if (commonSet && commonSet.ability) {
        if (!modifiedActive.ability.known) {
            modifiedActive.ability.known = true;
            modifiedActive.ability.ability = commonSet.ability;
        }
    } else if (!commonSet) {
        if (!modifiedActive.ability.known) {
            if (pokeData.species.abilities && pokeData.species.abilities[0]) {
                modifiedActive.ability.known = true;
                modifiedActive.ability.ability = toId(pokeData.species.abilities[0]);
            }
        }
    }

    // Item

    if (commonSet && commonSet.item) {
        if (!modifiedActive.item.known) {
            modifiedActive.item.known = true;
            modifiedActive.item.item = commonSet.item;
        }
    }

    // Stats

    const foundPokemon = findPokemonData(gen, modifiedActive.details.species);

    if (commonSet) {
        const statPoke = new Pokemon(foundPokemon.gen, foundPokemon.name, {
            level: modifiedActive.details.level,
            ivs: commonSet.ivs,
            evs: commonSet.evs,
            nature: commonSet.nature,
        });

        ['hp', 'atk', 'def', 'spa', 'spd', 'spe'].forEach(stat => {
            if (!modifiedActive.stats[stat].known) {
                modifiedActive.stats[stat].known = true;
                modifiedActive.stats[stat].min = statPoke.stats[stat];
                modifiedActive.stats[stat].max = statPoke.stats[stat];
            }
        });
    } else if (modifiedActive.details.level <= 100) {
        const hAtk = Math.max(modifiedActive.stats.atk.max, modifiedActive.stats.spa.max);
        const hDef = Math.max(modifiedActive.stats.atk.max, modifiedActive.stats.spa.max);
        const statPoke = new Pokemon(foundPokemon.gen, foundPokemon.name, {
            level: modifiedActive.details.level,
            evs: (hAtk > hDef) ? {atk: 252, spa: 252, spe: 252} : {hp: 252, def: 128, spd: 128},
        });

        ['hp', 'atk', 'def', 'spa', 'spd', 'spe'].forEach(stat => {
            if (!modifiedActive.stats[stat].known) {
                modifiedActive.stats[stat].known = true;
                modifiedActive.stats[stat].min = statPoke.stats[stat];
                modifiedActive.stats[stat].max = statPoke.stats[stat];
            }
        });
    } else {
        const statPoke = new Pokemon(foundPokemon.gen, foundPokemon.name, {
            level: modifiedActive.details.level,
            evs: {atk: 252, def: 252, spa: 252, spd: 252, spe: 252},
        });

        ['hp', 'atk', 'def', 'spa', 'spd', 'spe'].forEach(stat => {
            if (!modifiedActive.stats[stat].known) {
                modifiedActive.stats[stat].known = true;
                modifiedActive.stats[stat].min = statPoke.stats[stat];
                modifiedActive.stats[stat].max = statPoke.stats[stat];
            }
        });
    }

    // Moves

    if (commonSet && commonSet.moves && modifiedActive.moves.size < 4) {
        for (const knownMove of commonSet.moves) {
            if (modifiedActive.moves.has(knownMove)) {
                continue;
            }

            modifiedActive.moves.set(knownMove, {
                id: knownMove,
                revealed: false,
                pp: 1,
                maxPP: 1,
                disabled: false,
            });
        }
    }

    return modifiedActive;
}

