// Move exceptions

"use strict";

import { Battle, BattleActivePokemon } from "../../../battle-data";
import { RechargeMoves, isSunny, itemIsEnabled } from "../../../battle-helpers";
import { compareIds, toId } from "../../../utils";

const BadMovesForAlgorithm = new Set<string>([
    'Focus Punch',
    'Explosion', 
    'SelfDestruct',
    'Final Gambit',
    'Last Resort',
    'Future Sight',
    'Doom Desire',
    'SynchroNoise'
].map(toId));

const ProtectMoves = new Set<string>([
    "Protect",
    "Baneful Bunker",
    "Detect",
    "Endure",
    "King's Shield",
    "Max Guard",
    "Obstruct",
    "Silk Trap",
    "Spiky Shield",
].map(toId));

const TwoTurnsMovesWithImmunity = new Set<string>([
    "Bounce",
    "Dig",
    "Dive",
    "Fly",
    "Sky Drop",
].map(toId));

const TwoTurnsMoves = new Set<string>([
    "Freeze Shock",
    "Ice Burn",
    "Meteor Beam",
    "Razor Wind",
    "Sky Attack",
    "Skull Bash",
].map(toId));

/**
 * Applies exceptions for this specific algorithm
 * @param battle The battle
 * @param pokemon The pokemon using the move
 * @param moveName The move name
 * @param damage The damage
 * @returns The modified damage
 */
export function applyExceptions(battle: Battle, pokemon: BattleActivePokemon, target: BattleActivePokemon, moveName: string, damage: number): number {
    const moveId = toId(moveName);

    if (BadMovesForAlgorithm.has(moveId)) {
        return 0;
    }

    let targetHasProtectionMove = false;

    for (const m of target.moves.values()) {
        if (ProtectMoves.has(toId(m.id)) && !m.disabled && m.pp > 0) {
            targetHasProtectionMove = true;
            break;
        }
    }

    if (compareIds(moveId, "Solar Beam") || compareIds(moveId, "Solar Blade")) {
        if (!isSunny(battle)) {
            if (targetHasProtectionMove) {
                return 0;
            }

            return damage * 0.5;
        }
    }

    if (TwoTurnsMoves.has(moveId)) {
        if (!compareIds(pokemon.item.item, "Power Herb") || !itemIsEnabled(battle, pokemon)) {
            if (targetHasProtectionMove) {
                return 0;
            }

            return damage * 0.5;
        }
    }

    if (TwoTurnsMovesWithImmunity.has(moveId)) {
        if (!compareIds(pokemon.item.item, "Power Herb") || !itemIsEnabled(battle, pokemon)) {
            if (targetHasProtectionMove) {
                return 0;
            }
        }
    }

    if (RechargeMoves.has(moveId)) {
        if (damage < 100) {
            // If the recharge move does not kill, it will consume an extra turn
            // so the damage per turn is halved
            return damage * 0.5; 
        }
    }

    return damage;
}
