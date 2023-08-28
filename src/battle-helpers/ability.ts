// Abilities helpers

"use strict";

import { Move } from "@asanrom/poke-calc";
import { AbilityEffects, AbilityKnowledge, Battle, BattleActivePokemon, BattleFields, VolatileStatuses } from "../battle-data";
import { compareIds, toId } from "../utils/id";
import { itemIsEnabled } from "./item";

/**
 * Checks if ability is enabled
 * @param battle The battle
 * @param pokemon The pokemon
 * @returns True if the ability is enabled
 */
export function abilityIsEnabled(battle: Battle, pokemon: BattleActivePokemon): boolean {
    if (battle.status.gen < 3) {
        // Abilities were introduced in gen 3
        return false;
    }

    if (battle.status.gen === 7 && toId(battle.status.tier).startsWith("Gen 7 Let's Go")) {
        // Abilities are not coded in Pokemon Let's Go Pikachu and Eevee
        return false;
    }

    if (pokemon.volatiles.has(VolatileStatuses.GastroAcid)) {
        // Ability is disabled
        return false;
    }

    if (battle.status.abilityEffects.has(AbilityEffects.NeutralizingGas)) {
        // Neutralizing gas is active
        // Maybe it's protected with Ability Shield

        if (!itemIsEnabled(battle, pokemon)) {
            // Item is disabled
            return false;
        }

        if (!compareIds(pokemon.item.item, "Ability Shield")) {
            // Not protected by ability shield
            return false;
        }
    }

    return true;
}

const BreakingAbilityMoves = new Set<string>([
    toId("G-Max Drum Solo"),
    toId("G-Max Fireball"),
    toId("G-Max Hydrosnipe"),
    toId("Light That Burns the Sky"),
    toId("Menacing Moonraze Maelstrom"),
    toId("Moongeist Beam"),
    toId("Photon Geyser"),
    toId("Searing Sunraze Smash"),
    toId("Sunsteel Strike"),
]);

const MoldBreakerLikeAbilities = new Set<string>([
    toId("Mold Breaker"),
    toId("Teravolt"),
    toId("Turboblaze"),
]);

/**
 * Checks if move breaks the defender's ability
 * @param battle The battle
 * @param attacker The attacker
 * @param defender The defender
 * @param move The move
 * @returns True if the ability is broken by the use of the move
 */
export function moveBreaksAbility(battle: Battle, attacker: BattleActivePokemon, defender: BattleActivePokemon, move: Move): boolean {
    if (abilityIsEnabled(battle, attacker)) {
        if (MoldBreakerLikeAbilities.has(toId(attacker.ability.ability))) {
            // We have a breaking ability
            // Maybe the defender is protected by Ability Shield

            if (!itemIsEnabled(battle, defender)) {
                // Item is disabled
                return true;
            }

            if (!compareIds(defender.item.item, "Ability Shield")) {
                // The defender does not have an ability shield
                return true;
            }
        } else if (compareIds(attacker.ability.ability, "Mycelium Might") && move.category === "Status") {
            // Mycelium Might breaks only for status moves
            // Maybe the defender is protected by Ability Shield

            if (!itemIsEnabled(battle, defender)) {
                // Item is disabled
                return true;
            }

            if (!compareIds(defender.item.item, "Ability Shield")) {
                // The defender does not have an ability shield
                return true;
            }
        }
    }

    if (BreakingAbilityMoves.has(toId(move.name))) {
        // We are using an ability breaking move
        // Maybe the defender is protected by Ability Shield

        if (!itemIsEnabled(battle, defender)) {
            // Item is disabled
            return true;
        }

        if (!compareIds(defender.item.item, "Ability Shield")) {
            // The defender does not have an ability shield
            return true;
        }
    }

    return false;
}

/**
 * Gets unknown ability
 * @returns Unknown ability
 */
export function unknownAbility(): AbilityKnowledge {
    return {
        known: false,
        revealed: false,
        ability: "",
        baseAbility: "",
        activationCount: 0,
    };
}

/**
 * Abilities that cannot be changed or copied
 */
export const PermanentAbilities = new Set<string>([
    "As One",
    "Battle Bond",
    "Comatose",
    "Commander",
    "Disguise",
    "Gulp Missile",
    "Hadron Engine",
    "Ice Face",
    "Multitype",
    "Orichalcum Pulse",
    "Power Construct",
    "Protosynthesis",
    "Quark Drive",
].map(toId));
