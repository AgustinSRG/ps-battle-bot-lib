// Utilities to check pokemon status

"use strict";

import { MEGA_STONES, Pokemon } from "@asanrom/poke-calc";
import { Battle, BattleActivePokemon, BattleFields, BattlePlayer, BattleRequestActivePokemon, BattleSidePokemon, PokemonDetails, PokemonKnownStats, PokemonTypeNames, SingleTurnStatuses, StatKnowledge, VolatileStatuses } from "../battle-data";
import { compareIds, toId } from "../utils/id";
import { abilityIsEnabled, unknownAbility } from "./ability";
import { itemIsEnabled, unknownItem } from "./item";
import { TypeName } from "@asanrom/poke-calc/dist/data/interface";
import { getHPPercent } from "../showdown-battle-parser/parser-utils";
import { findPokemonData } from "./poke-data-find";
import { clone } from "../utils/clone";
import { MoveGimmick } from "../battle-decision";
import { findItemData } from "./item-data-find";

/**
 * Checks if an active pokemon is grounded
 * @param battle The battle
 * @param pokemon The pokemon
 * @returns True if the pokemon is grounded
 */
export function isGrounded(battle: Battle, pokemon: BattleActivePokemon): boolean {
    if (battle.status.fields.has(BattleFields.Gravity)) {
        // Gravity forces all pokemon to be grounded
        return true;
    }

    if (abilityIsEnabled(battle, pokemon) && compareIds(pokemon.ability.ability, "Levitate")) {
        // Has levitate active
        return false;
    }

    if (compareIds(pokemon.item.item, "Air Balloon") && itemIsEnabled(battle, pokemon)) {
        // Has air balloon
        return false;
    }

    const pokeData = findPokemonData(battle.status.gen, pokemon.details.species);

    applyIllusion(battle, pokeData, pokemon);
    applyTransform(battle, pokeData, pokemon, "max");
    applyTypeChanges(pokeData, pokemon);

    return pokeData.types.includes('Flying');
}

/**
 * Checks if a pokemon is trappable
 * @param battle The battle
 * @param pokemon The pokemon
 * @returns True if the pokemon is trappable
 */
export function isTrappable(battle: Battle, pokemon: BattleActivePokemon): boolean {
    if (abilityIsEnabled(battle, pokemon) && compareIds(pokemon.ability.ability, "Shadow Tag")) {
        // Has shadow tag
        return false;
    }

    if (compareIds(pokemon.item.item, "Shed Shell") && itemIsEnabled(battle, pokemon)) {
        // Has Shed Shell
        return false;
    }

    if (battle.status.gen < 8) {
        return true;
    }

    const pokeData = findPokemonData(battle.status.gen, pokemon.details.species);

    applyIllusion(battle, pokeData, pokemon);
    applyTransform(battle, pokeData, pokemon, "max");
    applyTypeChanges(pokeData, pokemon);

    return pokeData.types.includes('Ghost');
}

/**
 * Applies type changes and sets tera type to calc pokemon object
 * @param poke The calc pokemon object
 * @param active The active pokemon
 */
export function applyTypeChanges(poke: Pokemon, active: BattleActivePokemon) {
    if (active.details.terastallized) {
        poke.types = [PokemonTypeNames.get(toId(active.details.terastallized)) || '???'] as [TypeName];
        poke.teraType = (PokemonTypeNames.get(toId(active.details.terastallized)) || '???') as TypeName;

        if (active.singleTurnStatuses.has(SingleTurnStatuses.Roost)) {
            poke.types = poke.types.filter(t => {
                return t !== "Flying";
            }) as [TypeName];
        }

        return; // Tera ignores any other type changes
    }

    if (active.volatiles.has(VolatileStatuses.TypeAdd)) {
        poke.types.push((PokemonTypeNames.get(toId(active.volatilesData.typeAdded)) || '???') as TypeName);
    }

    if (active.volatiles.has(VolatileStatuses.TypeChange)) {
        poke.types = (active.volatilesData.typesChanged || ['???']).map(t => {
            return PokemonTypeNames.get(toId(t)) || '???';
        }) as [TypeName, TypeName];
    }

    if (active.singleTurnStatuses.has(SingleTurnStatuses.Roost)) {
        poke.types = poke.types.filter(t => {
            return t !== "Flying";
        }) as [TypeName];
    }
}

/**
 * Applies known stats to a calc pokemon object
 * @param poke The calc pokemon object
 * @param active The active pokemon
 * @param mode The mode to apply the stats
 */
export function applyKnownStats(poke: Pokemon, active: BattleActivePokemon, mode: "max" | "min" | "avg") {
    ['hp', 'atk', 'def', 'spa', 'spd', 'spe'].forEach(s => {
        if (mode === "max") {
            poke.stats[s] = poke.rawStats[s] = active.stats[s].max;
        } else if (mode === "min") {
            poke.stats[s] = poke.rawStats[s] = active.stats[s].min;
        } else {
            poke.stats[s] = poke.rawStats[s] = Math.round((active.stats[s].max + active.stats[s].min) / 2);
        }
    });

    if (active.condition.maxHP === 100 && active.volatiles.has(VolatileStatuses.Dynamax)) {
        poke.stats.hp *= 2;
    }

    poke.originalCurHP = getHPPercent(active.condition) * poke.stats.hp / 100;
}

/**
 * Applies transform status to calc
 * @param battle The battle
 * @param poke The calc pokemon
 * @param active The active pokemon
 * @param mode The mode to apply the stats
 */
export function applyTransform(battle: Battle, poke: Pokemon, active: BattleActivePokemon, mode: "max" | "min" | "avg") {
    if (active.volatiles.has(VolatileStatuses.Transform) && active.volatilesData.transformedInfo) {
        const species = findPokemonData(battle.status.gen, active.volatilesData.transformedInfo.details.species);

        poke.species = species.species;
        poke.types = species.types;

        poke.gender = active.volatilesData.transformedInfo.details.gender;

        ['atk', 'def', 'spa', 'spd', 'spe'].forEach(s => {
            if (mode === "max") {
                poke.stats[s] = poke.rawStats[s] = active.volatilesData.transformedInfo.stats[s].max;
            } else if (mode === "min") {
                poke.stats[s] = poke.rawStats[s] = active.volatilesData.transformedInfo.stats[s].min;
            } else {
                poke.stats[s] = poke.rawStats[s] = Math.round((active.volatilesData.transformedInfo.stats[s].max + active.volatilesData.transformedInfo.stats[s].min) / 2);
            }
        });
    }
}

/**
 * Applies known illusion status to calc
 * @param battle The battle
 * @param poke The calc pokemon
 * @param active The active pokemon
 */
export function applyIllusion(battle: Battle, poke: Pokemon, active: BattleActivePokemon) {
    if (active.volatilesData.fake && active.volatilesData.fakeGuess) {
        const species = findPokemonData(battle.status.gen, active.volatilesData.fakeGuess);

        poke.species = species.species;
        poke.types = species.types;
    }
}

/**
 * Gets stat ranges from details
 * @param gen The generation
 * @param details The details
 * @returns The stat ranges
 */
export function getStatRangeFromDetails(gen: number, details: PokemonDetails): PokemonKnownStats {
    const foundPokemon = findPokemonData(gen, details.species);

    const minPokemon = new Pokemon(foundPokemon.gen, foundPokemon.name, {
        level: details.level,
        ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    });

    const maxPokemon = new Pokemon(foundPokemon.gen, foundPokemon.name, {
        level: details.level,
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        evs: { hp: 252, atk: 252, def: 252, spa: 252, spd: 252, spe: 252 },
    });

    const natureMinusModifier = gen > 2 ? 0.9 : 1;
    const naturePlusModifier = gen > 2 ? 1.1 : 1;

    return {
        hp: {
            known: false,
            min: minPokemon.stats.hp,
            max: maxPokemon.stats.hp,
        },
        atk: {
            known: false,
            min: Math.floor(minPokemon.stats.atk * natureMinusModifier),
            max: Math.floor(maxPokemon.stats.atk * naturePlusModifier),
        },
        def: {
            known: false,
            min: Math.floor(minPokemon.stats.def * natureMinusModifier),
            max: Math.floor(maxPokemon.stats.def * naturePlusModifier),
        },
        spa: {
            known: false,
            min: Math.floor(minPokemon.stats.spa * natureMinusModifier),
            max: Math.floor(maxPokemon.stats.spa * naturePlusModifier),
        },
        spd: {
            known: false,
            min: Math.floor(minPokemon.stats.spd * natureMinusModifier),
            max: Math.floor(maxPokemon.stats.spd * naturePlusModifier),
        },
        spe: {
            known: false,
            min: Math.floor(minPokemon.stats.spe * natureMinusModifier),
            max: Math.floor(maxPokemon.stats.spe * naturePlusModifier),
        },
    };
}

/**
 * Updates starts ranges when pokemon details changes
 * @param battle The battle
 * @param active The active pokemon
 */
export function updateStatsOnSpeciesChange(battle: Battle, active: BattleActivePokemon | BattleSidePokemon): void {
    const newStats = getStatRangeFromDetails(battle.status.gen, active.details);

    if (!active.stats.hp.known) {
        active.stats.hp = clone(newStats.hp);
    }

    if (!active.stats.atk.known) {
        active.stats.atk = clone(newStats.atk);
    }

    if (!active.stats.def.known) {
        active.stats.def = clone(newStats.def);
    }

    if (!active.stats.spa.known) {
        active.stats.spa = clone(newStats.spa);
    }

    if (!active.stats.spd.known) {
        active.stats.spd = clone(newStats.spd);
    }

    if (!active.stats.spe.known) {
        active.stats.spe = clone(newStats.spe);
    }
}

/**
 * Find pokemon current types
 * @param battle The battle
 * @param pokemon The active pokemon
 * @returns The types
 */
export function getPokemonCurrentTypes(battle: Battle, pokemon: BattleActivePokemon): TypeName[]{
    const pokeData = findPokemonData(battle.status.gen, pokemon.details.species);

    applyIllusion(battle, pokeData, pokemon);
    applyTransform(battle, pokeData, pokemon, "avg");
    applyTypeChanges(pokeData, pokemon);

    return pokeData.types.slice();
}

/**
 * Creates side pokemon from details (team preview)
 * @param battle The battle
 * @param player The player
 * @param details The pokemon details
 * @returns The side pokemon object
 */
export function createSidePokeFromDetails(battle: Battle, player: BattlePlayer, details: PokemonDetails): BattleSidePokemon {
    return {
        index: player.team.length,
        active: false,
        revealed: true,
        ident: {
            playerIndex: player.index,
            name: details.species,
        },
        details: clone(details),
        condition: {
            hp: 100,
            maxHP: 100,
            status: "",
            fainted: false,
        },
        stats: getStatRangeFromDetails(battle.status.gen, details),
        item: unknownItem(),
        ability: unknownAbility(),
        timesHit: 0,
        totalBurnedSleepTurns: 0,
        sleptByRest: false,
        moves: new Map(),
    };
}

/**
 * Checks if the pokemon is commanding
 * When commanding, a pokemon is immune to all moves
 * @param battle The battle
 * @param player The player
 * @param pokemon The pokemon
 * @returns true if commanding
 */
export function isCommanding(battle: Battle, player: BattlePlayer, pokemon: BattleActivePokemon): boolean {
    if (!compareIds(pokemon.ability.ability, "Commander")) {
        return false;
    }

    // Check for a Dondozo

    for (const active of player.active.values()) {
        if (active.slot === pokemon.slot) {
            continue;
        }

        if (active.condition.fainted) {
            continue;
        }

        if (compareIds(active.details.species, "Dondozo")) {
            return true;
        }
    }

    return false;
}

/**
 * Applies gimmick to active
 * @param battle The battle
 * @param pokemon The active pokemon
 * @param requestActive The request active information
 * @param gimmick The gimmick
 * @returns The modified active pokemon
 */
export function applyGimmickToActive(battle: Battle, pokemon: BattleActivePokemon, requestActive: BattleRequestActivePokemon, gimmick: MoveGimmick): BattleActivePokemon {
    const activeCopy = clone(pokemon);

    if (gimmick === "tera") {
        activeCopy.details.terastallized = requestActive.canTerastallize;
    } else if (gimmick === "ultra") {
        activeCopy.details.species = toId("Necrozma-Ultra");
    } else if (gimmick === "mega") {
        const item = findItemData(battle.status.gen, pokemon.item.item);
        const megaSpecies = MEGA_STONES[item.name];
        if (megaSpecies) {
            activeCopy.details.species = toId(megaSpecies);
        }
    }

    return activeCopy;
}

/**
 * Gets natural recovery each turn due to items or other conditions
 * Example: Leftovers
 * @param battle The battle
 * @param pokemon The pokemon
 * @returns The recovery as percent HP
 */
export function getActivePokemonTurnRecovery(battle: Battle, pokemon: BattleActivePokemon): number {
    let res = 0;

    if (pokemon.volatiles.has(VolatileStatuses.HealBlock)) {
        return 0;
    }

    const pokeData = findPokemonData(battle.status.gen, pokemon.details.species);
    applyIllusion(battle, pokeData, pokemon);
    applyTransform(battle, pokeData, pokemon, "avg");
    applyTypeChanges(pokeData, pokemon);
    

    if (compareIds(pokemon.item.item, "Leftovers") && itemIsEnabled(battle, pokemon)) {
        res += 6.25;
    }

    if (compareIds(pokemon.item.item, "Black Sludge") && itemIsEnabled(battle, pokemon) && pokeData.types.includes("Poison")) {
        res += 6.25;
    }

    if (pokemon.volatiles.has(VolatileStatuses.Ingrain)) {
        res += 6.25;
    }

    if (pokemon.volatiles.has(VolatileStatuses.AquaRing)) {
        res += 6.25;
    }

    if (battle.status.fields.has(BattleFields.GrassyTerrain) && isGrounded(battle, pokemon)) {
        res += 6.25;
    }

    return res;
}

/**
 * Checks if a pokemon can be flinched
 * @param battle The battle
 * @param pokemon The pokemon
 * @returns True if the pokemon can be flinched
 */
export function canBeFlinched(battle: Battle, pokemon: BattleActivePokemon): boolean {
    if (compareIds(pokemon.item.item, "Covert Cloak") && itemIsEnabled(battle, pokemon)) {
        return false;
    }

    if (compareIds(pokemon.ability.ability, "Inner Focus") && abilityIsEnabled(battle, pokemon)) {
        return false;
    }

    return true;
}

/**
 * Checks if a pokemon deals damage on contact
 * @param battle The battle
 * @param pokemon The pokemon
 * @returns True if the pokemon deals damage on contact
 */
export function checksPokemonDealsContactDamage(battle: Battle, pokemon: BattleActivePokemon): boolean {
    if (compareIds(pokemon.item.item, "Rocky Helmet") && itemIsEnabled(battle, pokemon)) {
        return true;
    }

    if (compareIds(pokemon.ability.ability, "Rough Skin") && abilityIsEnabled(battle, pokemon)) {
        return true;
    }

    if (compareIds(pokemon.ability.ability, "Iron Barbs") && abilityIsEnabled(battle, pokemon)) {
        return true;
    }

    return false;
}


