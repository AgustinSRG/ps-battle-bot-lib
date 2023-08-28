// Accuracy

"use strict";

import { Battle, BattleActivePokemon, BattlePlayer, VolatileStatuses } from "../battle-data";
import { getMoveAccuracy } from "./move-accuracy-data";
import { compareIds, toId } from "../utils";
import { MoveGimmick } from "../battle-decision/active-decision";
import { abilityIsEnabled } from "./ability";
import { isRainy, isSnowy } from "./global-status";
import { itemIsEnabled } from "./item";

export const OHKOMoves = new Set<string>([
    'Fissure',
    'Sheer Cold',
    'Horn Drill',
    'Guillotine'
].map(toId));

export const IgnoreEvasionMoves = new Set<string>([
    'Chip Away',
    'Darkest Lariat',
    'Sacred Sword',
].map(toId));

const boostTable = [1 / 3, 0.36, 0.43, 0.5, 0.66, 0.75, 1, 1.33, 1.66, 2, 2.33, 2.66, 3];

/**
 * Calculates move accuracy
 * @param battle The battle
 * @param attackerPlayer The attacker player
 * @param attacker The attacker
 * @param defenderPlayer The defender player
 * @param defender The defender
 * @param moveName The move
 * @param gimmick The gimmick used
 * @returns The accuracy as a multiplier (0 to 1)
 */
export function calcMoveAccuracy(battle: Battle, attackerPlayer: BattlePlayer, attacker: BattleActivePokemon, defenderPlayer: BattlePlayer, defender: BattleActivePokemon, moveName: string, gimmick?: MoveGimmick): number {
    // Gimmick
    if (gimmick === "dynamax" || gimmick === "max-move" || gimmick === "z-move") {
        return 1;
    }

    // No Guard

    if (compareIds(attacker.ability.ability, "No Guard") && abilityIsEnabled(battle, attacker)) {
        return 1;
    }

    if (compareIds(defender.ability.ability, "No Guard") && abilityIsEnabled(battle, defender)) {
        return 1;
    }

    // OHKO

    if (OHKOMoves.has(toId(moveName))) {
        return 0.3 * (attacker.details.level / (defender.details.level || 100));
    }

    // Telekinesis

    if (defender.volatiles.has(VolatileStatuses.Telekinesis)) {
        return 1;
    }

    // Weather

    if (compareIds(moveName, "Thunder") && isRainy(battle)) {
        return 1;
    }

    if (compareIds(moveName, "Blizzard") && isSnowy(battle)) {
        return 1;
    }

    // Regular move

    let accuracy = getMoveAccuracy(battle.status.gen, moveName);

    if (accuracy > 1) {
        return 1;
    }

    // Accuracy
    
    if (compareIds(attacker.item.item, "Wide Lens") && itemIsEnabled(battle, attacker)) {
        accuracy = accuracy * 1.1;
    }

    if (compareIds(attacker.ability.ability, "Compound Eyes") && abilityIsEnabled(battle, attacker)) {
        accuracy = accuracy * 1.3;
    }

    if (attacker.boosts.has("accuracy")) {
        const multiplier = boostTable[attacker.boosts.get("accuracy") + 6] || 1;
        accuracy = accuracy * multiplier;
    }

    // Evasion

    if (!IgnoreEvasionMoves.has(toId(moveName)) && defender.boosts.has("evasion")) {
        const multiplier = boostTable[((-1) * defender.boosts.get("evasion")) + 6] || 1;
        accuracy = accuracy * multiplier;
    }

    return Math.min(1, Math.max(0, accuracy));
}
