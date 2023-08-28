// Analyzer tools to detect illusion

"use strict";

import { DefaultBattleAnalyzer } from ".";
import { Battle, BattleActivePokemon, BattlePlayer } from "../../battle-data";
import { calcDamage } from "../../battle-helpers/calc";
import { findPokemonData } from "../../battle-helpers/poke-data-find";
import { applyTransform, applyTypeChanges } from "../../battle-helpers/pokemon";
import { clone } from "../../utils/clone";
import { compareIds, toId } from "../../utils/id";

/**
 * List of pokemon with illusion
 */
export const PokemonWithIllusion = new Set<string>([
    toId("Zorua"),
    toId("Zorua-Hisui"),
    toId("Zoroark"),
    toId("Zoroark-Hisui"),
]);

/**
 * List of pokemon with illusion and dark type
 */
export const PokemonWithIllusionDarkType = new Set<string>([
    toId("Zorua"),
    toId("Zoroark"),
]);

/**
 * Detects illusion from natural immunity event of status move with prankster ability
 * @param analyzer The analyzer
 * @param battle The battle
 * @param attackerPlayer The attacker player
 * @param attacker The attacker
 * @param defenderPlayer The defender player
 * @param defender The defender
 * @param move The move used
 */
export function detectIllusionFromPrankster(analyzer: DefaultBattleAnalyzer, battle: Battle, attackerPlayer: BattlePlayer, attacker: BattleActivePokemon, defenderPlayer: BattlePlayer, defender: BattleActivePokemon, move: string) {
    const attackerData = findPokemonData(battle.status.gen, attacker.details.species);

    applyTransform(battle, attackerData, attacker, "avg");

    applyTypeChanges(attackerData, attacker);

    const defenderData = findPokemonData(battle.status.gen, defender.details.species);

    applyTransform(battle, defenderData, defender, "avg");

    applyTypeChanges(defenderData, defender);

    if (compareIds(move, "Thunder Wave") && defenderData.types.includes("Ground")) {
        return;
    }

    if (defenderData.types.includes("Dark")) {
        return;
    }

    // This is an illusion

    defender.volatilesData.fake = true;
    analyzer.debug(`Illusion detected on Player[${defenderPlayer.index}] - Active[${defender.slot}] (Prankster move)`);

    // Find faker in the team
    for (const poke of defenderPlayer.team) {
        if (PokemonWithIllusionDarkType.has(toId(poke.details.species))) {
            // This is the faker
            defender.volatilesData.fakeGuess = poke.details.species;
            analyzer.debug(`Illusion faker guess: ${poke.details.species}`);
            break;
        }
    }

    if (!defender.volatilesData.fakeGuess) {
        defender.volatilesData.fakeGuess = toId("Zoroark");
        analyzer.debug(`Illusion faker guess: Zoroark`);
    }
}

/**
 * Detects illusion from natural immunity event
 * @param analyzer The analyzer
 * @param battle The battle
 * @param attackerPlayer The attacker player
 * @param attacker The attacker
 * @param defenderPlayer The defender player
 * @param defender The defender
 * @param move The move used
 */
export function detectIllusionFromDamageMoveImmunity(analyzer: DefaultBattleAnalyzer, battle: Battle, attackerPlayer: BattlePlayer, attacker: BattleActivePokemon, defenderPlayer: BattlePlayer, defender: BattleActivePokemon, move: string) {
    const damage = calcDamage(battle, attackerPlayer, attacker, defenderPlayer, defender, move);

    const fakeDefender = clone(defender);

    if (damage.max > 0) {
        // This is an illusion

        defender.volatilesData.fake = true;
        analyzer.debug(`Illusion detected on Player[${defenderPlayer.index}] - Active[${defender.slot}] (Natural Immunity)`);

        // Find faker in the team
        for (const poke of defenderPlayer.team) {
            if (PokemonWithIllusion.has(toId(poke.details.species))) {
                fakeDefender.details.species = poke.details.species;

                const newDamage = calcDamage(battle, attackerPlayer, attacker, defenderPlayer, fakeDefender, move);

                if (newDamage.max <= 0) {
                    // This is the faker
                    defender.volatilesData.fakeGuess = poke.details.species;
                    analyzer.debug(`Illusion faker guess: ${poke.details.species}`);
                    break;
                }
            }
        }

        if (!defender.volatilesData.fakeGuess) {
            // We can try to guess

            const fakeGuesses = [toId("Zoroark"), toId("Zoroark-Hisui")];

            for (const fakeGuess of fakeGuesses) {
                fakeDefender.details.species = fakeGuess;

                const newDamage = calcDamage(battle, attackerPlayer, attacker, defenderPlayer, fakeDefender, move);

                if (newDamage.max <= 0) {
                    // This is the faker
                    defender.volatilesData.fakeGuess = fakeGuess;
                    analyzer.debug(`Illusion faker guess: ${fakeGuess}`);
                    break;
                }
            }
        }
    }
}
