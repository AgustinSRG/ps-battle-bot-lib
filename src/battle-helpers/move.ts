// Moves utilities

import { TypeName } from "@asanrom/poke-calc/dist/data/interface";
import { Battle, BattleActivePokemon, BattleFields, BattlePlayer, MoveTarget, PokemonTypeNames } from "../battle-data";
import { compareIds, toId } from "../utils";
import { abilityIsEnabled, moveBreaksAbility } from "./ability";
import { findMove } from "./move-data-find";
import { findItemData } from "./item-data-find";
import { itemIsEnabled } from "./item";
import { isRainy, isSandStorm, isSnowy, isSunny } from "./global-status";
import { getPokemonCurrentTypes, isGrounded } from "./pokemon";
import { getMoveFlags } from "./move-flags-data";

/**
 * Finds the type of a move given the battle status
 * @param battle The battle
 * @param pokemon The pokemon using the move
 * @param move The move name
 * @returns The move type
 */
export function getMoveRealType(battle: Battle, pokemon: BattleActivePokemon, move: string): TypeName {
    const moveData = findMove(battle.status.gen, move);
    const moveFlags = getMoveFlags(battle.status.gen, move);
    let moveType = moveData.type;

    if (compareIds(pokemon.ability.ability, "Normalize") && abilityIsEnabled(battle, pokemon)) {
        return "Normal";
    }

    if (compareIds(move, "Tera Blast") && pokemon.details.terastallized) {
        return (PokemonTypeNames.get(toId(pokemon.details.terastallized)) || '???') as TypeName;
    }

    if (compareIds(move, "Aura Wheel")) {
        if (compareIds(pokemon.details.species, "Morpeko-Hangry")) {
            return "Dark";
        } else {
            return "Electric";
        }
    } else if (compareIds(move, "Weather Ball")) {
        if (!compareIds(pokemon.item.item, "Utility Umbrella") || !itemIsEnabled(battle, pokemon)) {
            if (isSunny(battle)) {
                return "Fire";
            }

            if (isSnowy(battle)) {
                return "Ice";
            }

            if (isSandStorm(battle)) {
                return "Rock";
            }

            if (isRainy(battle)) {
                return "Water";
            }
        }
    } else if (compareIds(move, "Judgment")) {
        const itemData = findItemData(battle.status.gen, pokemon.item.item);

        switch (itemData.name) {
            case 'Draco Plate':
                return 'Dragon';
            case 'Dread Plate':
                return 'Dark';
            case 'Earth Plate':
                return 'Ground';
            case 'Fist Plate':
                return 'Fighting';
            case 'Flame Plate':
                return 'Fire';
            case 'Icicle Plate':
                return 'Ice';
            case 'Insect Plate':
                return 'Bug';
            case 'Iron Plate':
                return 'Steel';
            case 'Meadow Plate':
                return 'Grass';
            case 'Mind Plate':
                return 'Psychic';
            case 'Pixie Plate':
                return 'Fairy';
            case 'Sky Plate':
                return 'Flying';
            case 'Splash Plate':
                return 'Water';
            case 'Spooky Plate':
                return 'Ghost';
            case 'Stone Plate':
                return 'Rock';
            case 'Toxic Plate':
                return 'Poison';
            case 'Zap Plate':
                return 'Electric';
        }
    } else if (compareIds(move, "Techno Blast")) {
        const itemData = findItemData(battle.status.gen, pokemon.item.item);

        switch (itemData.name) {
            case 'Burn Drive':
                return 'Fire';
            case 'Chill Drive':
                return 'Ice';
            case 'Douse Drive':
                return 'Water';
            case 'Shock Drive':
                return 'Electric';
        }
    } else if (compareIds(move, "Multi-Attack")) {
        const itemData = findItemData(battle.status.gen, pokemon.item.item);
        if (itemData.name.includes("Memory")) {
            return itemData.name.substring(0, itemData.name.indexOf(' ')) as TypeName;
        }
    } else if (compareIds(move, "Natural Gift")) {
        const itemData = findItemData(battle.status.gen, pokemon.item.item);
        if (itemData.naturalGift) {
            return itemData.naturalGift.type;
        }
    } else if (compareIds(move, "Nature Power") || compareIds(move, "Natural Gift")) {
        if (isGrounded(battle, pokemon)) {
            if (battle.status.fields.has(BattleFields.ElectricTerrain)) {
                return "Electric";
            } else if (battle.status.fields.has(BattleFields.GrassyTerrain)) {
                return "Psychic";
            } else if (battle.status.fields.has(BattleFields.MistyTerrain)) {
                return "Fairy";
            } else if (battle.status.fields.has(BattleFields.PsychicTerrain)) {
                return "Psychic";
            }
        }
    } else if (compareIds(move, "Revelation Dance")) {
        const pokeTypes = getPokemonCurrentTypes(battle, pokemon);
        return pokeTypes[0] || "???";
    } else if (compareIds(move, "Raging Bull")) {
        if (compareIds(pokemon.details.species, "Tauros-Paldea-Combat")) {
            return "Fighting";
        } else if (compareIds(pokemon.details.species, "Tauros-Paldea-Blaze")) {
            return "Fire";
        } else if (compareIds(pokemon.details.species, "Tauros-Paldea-Aqua")) {
            return "Water";
        }
    }

    if (abilityIsEnabled(battle, pokemon)) {
        if (compareIds(pokemon.ability.ability, "Aerilate")) {
            if (moveType === "Normal") {
                moveType = "Flying";
            }
        } else if (compareIds(pokemon.ability.ability, "Galvanize")) {
            if (moveType === "Normal") {
                moveType = "Flying";
            }
        } else if (compareIds(pokemon.ability.ability, "Liquid Voice")) {
            if (moveFlags.has("sound")) {
                moveType = "Water";
            }
        } else if (compareIds(pokemon.ability.ability, "Pixilate")) {
            if (moveType === "Normal") {
                moveType = "Fairy";
            }
        } else if (compareIds(pokemon.ability.ability, "Refrigerate")) {
            if (moveType === "Normal") {
                moveType = "Ice";
            }
        }
    }

    return moveType;
}

const targetsCannotBeRedirected = new Set<MoveTarget>([
    "self",
    "allAdjacentFoes",
    "foeSide",
    "allySide",
    "allyTeam",
    "allAdjacent",
    "all",
    "allies",
]);

/**
 * Checks if a move will be redirected and absorbed
 * @param battle The battle
 * @param player The player
 * @param pokemon The pokemon using the move
 * @param move The move name
 * @param moveTarget The move target
 * @returns True if the move is redirected and absorbed
 */
export function moveIsRedirected(battle: Battle, player: BattlePlayer, pokemon: BattleActivePokemon, move: string, moveTarget: MoveTarget): boolean {
    if (targetsCannotBeRedirected.has(moveTarget)) {
        return false;
    }

    const moveData = findMove(battle.status.gen, move);
    const moveType = getMoveRealType(battle, pokemon, move);

    for (const targetPlayer of battle.players.values()) {
        for (const target of targetPlayer.active.values()) {
            if (player.index === targetPlayer.index && pokemon.slot === target.slot) {
                continue;
            }

            if (target.condition.fainted) {
                continue;
            }

            if (!abilityIsEnabled(battle, target)) {
                continue;
            }

            if (moveBreaksAbility(battle, pokemon, target, moveData)) {
                continue;
            }

            if (compareIds(target.ability.ability, "Lightning Rod")) {
                if (moveType === "Electric") {
                    return true;
                }
            } else if (compareIds(target.ability.ability, "Storm Drain")) {
                if (moveType === "Water") {
                    return true;
                }
            }
        }
    }

    return false;
}