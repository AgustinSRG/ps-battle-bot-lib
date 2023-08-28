// Damage calc

"use strict";

import { Field, Generations, Side, calculate } from "@asanrom/poke-calc";
import { AbilityEffects, Battle, BattleActivePokemon, BattleFields, BattlePlayer, SideConditions, VolatileStatuses, Weathers } from "../battle-data";
import { findMove } from "./move-data-find";
import { findPokemonData } from "./poke-data-find";
import { GenerationNum, ItemName, MoveCategory, StatIDExceptHP, StatusName, Terrain, Weather } from "@asanrom/poke-calc/dist/data/interface";
import { findItemData } from "./item-data-find";
import { findAbilityData } from "./ability-data-find";
import { LAST_GEN } from "./initializers";
import { checkBattery, checkFlowerGift, checkFriendGuard, checkPowerSpot } from "./side";
import { compareIds, toId } from "../utils/id";
import { abilityIsEnabled, moveBreaksAbility } from "./ability";
import { getMoveFlags } from "./move-flags-data";
import { applyIllusion, applyKnownStats, applyTransform, applyTypeChanges, isCommanding } from "./pokemon";
import { itemIsEnabled } from "./item";

/**
 * Calc options
 */
export interface CalcOptions {
    /**
     * Consider known stats for the attacker
     */
    considerStatsAttacker?: "min" | "max" | "avg";

    /**
     * Consider known stats for the defender
     */
    considerStatsDefender?: "min" | "max" | "avg";

    /**
     * Use percents for damage
     */
    usePercent?: boolean;

    /**
     * True to ignore current HP
     */
    ignoreCurrentHP?: boolean;

    /**
     * Override move base power
     */
    overrideBasePower?: number;

    /**
     * Override category
     */
    overrideCategory?: MoveCategory;

    /**
     * Use max move
     */
    useMax?: boolean;

    /**
     * Use Z move
     */
    useZMove?: boolean;

    /**
     * Using helping hand?
     */
    isHelpingHand?: boolean;
}

export interface DamageResult {
    /**
     * Min damage
     */
    min: number;

    /**
     * Max damage
     */
    max: number;

    /**
     * The move priority
     */
    priority: number;
}

const FirstTurnOnlyMoves = new Set<string>([
    toId("Fake Out"),
    toId("First Impression"),
]);

/**
 * Calculates damage move
 * @param battle The battle
 * @param attackerPlayer The attacker player
 * @param attacker The attacker pokemon
 * @param defenderPlayer The defender plater
 * @param defender The defender pokemon
 * @param move The move name
 * @param options Extra options
 * @returns The damage range
 */
export function calcDamage(battle: Battle, attackerPlayer: BattlePlayer, attacker: BattleActivePokemon, defenderPlayer: BattlePlayer, defender: BattleActivePokemon, move: string, options?: CalcOptions): DamageResult {
    if (!options) {
        options = {};
    }

    // Attacker

    const attackerData = findPokemonData(battle.status.gen, attacker.details.species);

    applyIllusion(battle, attackerData, attacker);

    applyTransform(battle, attackerData, attacker, options.considerStatsAttacker || "avg");

    attackerData.level = attacker.details.level;

    attackerData.gender = attacker.details.gender;

    attackerData.status = attacker.condition.status.toLowerCase() as StatusName;

    applyKnownStats(attackerData, attacker, options.considerStatsAttacker || "avg");

    applyTypeChanges(attackerData, attacker);

    if (attacker.item.known) {
        if (attacker.item.item) {
            attackerData.item = findItemData(battle.status.gen, attacker.item.item).name;
        } else {
            attackerData.item = undefined;
        }
    }

    if (abilityIsEnabled(battle, attacker)) {
        if (attacker.ability.known) {
            attackerData.ability = findAbilityData(battle.status.gen, attacker.ability.ability).name;

            if (attackerData.ability === "Flash Fire") {
                attackerData.abilityOn = attacker.volatiles.has(VolatileStatuses.FlashFire);
            } else if (attackerData.ability === "Protosynthesis") {
                if (!attackerData.item && attacker.volatiles.has(VolatileStatuses.ProtoSynthesis)) {
                    attackerData.item = "Booster Energy" as ItemName;
                    attackerData.boostedStat = attacker.volatilesData.boostedStat as StatIDExceptHP;
                }
            } else if (attackerData.ability === "Quark Drive") {
                if (!attackerData.item && attacker.volatiles.has(VolatileStatuses.QuarkDrive)) {
                    attackerData.item = "Booster Energy" as ItemName;
                    attackerData.boostedStat = attacker.volatilesData.boostedStat as StatIDExceptHP;
                }
            } else if (attackerData.ability === "Protean" || attackerData.ability === "Libero") {
                if (battle.status.gen >= 9 && attacker.volatiles.has(VolatileStatuses.TypeChange)) {
                    // In S/V, those abilities were nerfed, they only activate once
                    attackerData.ability = undefined;
                }
            }
        }
    } else {
        attackerData.ability = undefined;
    }

    attackerData.boosts = {
        hp: 0,
        atk: attacker.boosts.get("atk") || 0,
        def: attacker.boosts.get("def") || 0,
        spa: attacker.boosts.get("spa") || 0,
        spd: attacker.boosts.get("spd") || 0,
        spe: attacker.boosts.get("spe") || 0,
    };

    attackerData.alliesFainted = attackerPlayer.timesFainted;

    attackerData.isDynamaxed = attacker.volatiles.has(VolatileStatuses.Dynamax);

    // Defender

    const defenderData = findPokemonData(battle.status.gen, defender.details.species);

    applyIllusion(battle, defenderData, defender);

    applyTransform(battle, defenderData, defender, options.considerStatsDefender || "avg");

    defenderData.level = defender.details.level;

    defenderData.gender = defender.details.gender;

    defenderData.status = defender.condition.status.toLowerCase() as StatusName;

    applyKnownStats(defenderData, defender, options.considerStatsDefender || "avg");

    applyTypeChanges(defenderData, defender);

    if (defender.item.known) {
        if (defender.item.item) {
            defenderData.item = findItemData(battle.status.gen, defender.item.item).name;
        } else {
            defenderData.item = undefined;
        }
    }

    if (abilityIsEnabled(battle, defender)) {
        if (defender.ability.known) {
            defenderData.ability = findAbilityData(battle.status.gen, defender.ability.ability).name;

            if (defenderData.ability === "Flash Fire") {
                defenderData.abilityOn = defender.volatiles.has(VolatileStatuses.FlashFire);
            } else if (defenderData.ability === "Protosynthesis") {
                if (!defenderData.item && defender.volatiles.has(VolatileStatuses.ProtoSynthesis)) {
                    defenderData.item = "Booster Energy" as ItemName;
                    defenderData.boostedStat = defender.volatilesData.boostedStat as StatIDExceptHP;
                }
            } else if (defenderData.ability === "Quark Drive") {
                if (!defenderData.item && defender.volatiles.has(VolatileStatuses.QuarkDrive)) {
                    defenderData.item = "Booster Energy" as ItemName;
                    defenderData.boostedStat = defender.volatilesData.boostedStat as StatIDExceptHP;
                }
            }
        }
    } else {
        defenderData.ability = undefined;
    }

    defenderData.boosts = {
        hp: 0,
        atk: defender.boosts.get("atk") || 0,
        def: defender.boosts.get("def") || 0,
        spa: defender.boosts.get("spa") || 0,
        spd: defender.boosts.get("spd") || 0,
        spe: defender.boosts.get("spe") || 0,
    };

    defenderData.alliesFainted = defenderPlayer.timesFainted;

    defenderData.isDynamaxed = defender.volatiles.has(VolatileStatuses.Dynamax);

    // Move data

    const moveData = findMove(battle.status.gen, move, {
        useMax: options.useMax,
        useZ: options.useZMove,
        ability: attackerData.ability,
        item: attackerData.item,
        species: attackerData.species.name,
    });

    const overrides: {
        basePower?: number,
        category?: MoveCategory,
    } = {};

    if (moveData.bp === 0 && compareIds(move, "Beat Up")) {
        let bp = 5;

        for (const poke of attackerPlayer.team) {
            if (poke.condition.fainted) {
                continue;
            }

            const pokeData = findPokemonData(battle.status.gen, poke.details.species);

            bp += Math.floor(pokeData.species.baseStats.atk / 10);
        }

        moveData.bp = bp;
        overrides.basePower = bp;
    } else if (compareIds(move, "Last Respects")) {
        moveData.bp = 50 + 50 * attackerPlayer.timesFainted;
        overrides.basePower = moveData.bp;
    } else if (compareIds(move, "Rage Fist")) {
        moveData.bp = Math.min(350, 50 + 50 * attacker.timesHit);
        overrides.basePower = moveData.bp;
    }

    if (options.overrideCategory !== undefined) {
        moveData.category = options.overrideCategory;
        overrides.category = moveData.category;
    }

    if (options.overrideBasePower !== undefined) {
        moveData.bp = options.overrideBasePower;
        overrides.basePower = moveData.bp;
    }

    moveData.overrides = overrides;

    // Check exceptions

    if (isCommanding(battle, defenderPlayer, defender)) {
        return {
            min: 0,
            max: 0,
            priority: 0,
        };
    }

    if (FirstTurnOnlyMoves.has(toId(moveData.name))) {
        if (attacker.switchedOnTurn !== battle.turn && attacker.switchedOnTurn !== battle.turn - 1) {
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    } else if (compareIds(moveData.name, "Hyperspace Fury")) {
        if (!compareIds(attackerData.species.name, "Hoopa-Unbound")) {
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    } else if (compareIds(moveData.name, "Aura Wheel")) {
        if (attackerData.species.name !== "Morpeko" && attackerData.species.name !== "Morpeko-Hangry") {
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    } else if (compareIds(moveData.name, "Burn Up")) {
        if (!attackerData.types.includes("Fire")) {
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    } else if (compareIds(moveData.name, "Double Shock")) {
        if (!attackerData.types.includes("Electric")) {
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    } else if (compareIds(moveData.name, "Future Sight")) {
        if (attackerPlayer.sideConditions.has(SideConditions.FutureSight)) {
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    } else if (compareIds(moveData.name, "Doom Desire")) {
        if (attackerPlayer.sideConditions.has(SideConditions.DoomDesire)) {
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    }

    const moveFlags = getMoveFlags(battle.status.gen, move);

    if (moveFlags.has("reflectable")) {
        if (compareIds(defender.ability.ability, "Magic Bounce") && abilityIsEnabled(battle, defender) && !moveBreaksAbility(battle, attacker, defender, moveData)) {
            // The move is bounced back (Immune)
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    }

    if (moveFlags.has("bullet")) {
        if (compareIds(defender.ability.ability, "BulletProof") && abilityIsEnabled(battle, defender) && !moveBreaksAbility(battle, attacker, defender, moveData)) {
            // Immune
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    }

    if (moveFlags.has("sound")) {
        if (compareIds(defender.ability.ability, "Sound Proof") && abilityIsEnabled(battle, defender) && !moveBreaksAbility(battle, attacker, defender, moveData)) {
            // Immune
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    }

    if (moveFlags.has("wind")) {
        if ((compareIds(defender.ability.ability, "Wind Power") || compareIds(defender.ability.ability, "Wind Rider")) && abilityIsEnabled(battle, defender) && !moveBreaksAbility(battle, attacker, defender, moveData)) {
            // Immune
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    }

    if (moveFlags.has("powder")) {
        if (battle.status.gen >= 6 && attackerData.types.includes("Grass")) {
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }

        if (compareIds(defender.item.item, "Safety Goggles") && itemIsEnabled(battle, defender)) {
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }

        if (compareIds(defender.ability.ability, "Overcoat") && abilityIsEnabled(battle, defender) && !moveBreaksAbility(battle, attacker, defender, moveData)) {
            return {
                min: 0,
                max: 0,
                priority: 0,
            };
        }
    }

    if (compareIds(defender.details.species, "Shedinja") && compareIds(defender.ability.ability, "Sturdy") && abilityIsEnabled(battle, defender) && !moveBreaksAbility(battle, attacker, defender, moveData)) {
        // Sturdy shedinja receives 0 damage from non-ability-breaking damage moves
        return {
            min: 0,
            max: 0,
            priority: 0,
        };
    }

    // Create field

    let terrain: Terrain;

    if (battle.status.fields.has(BattleFields.ElectricTerrain)) {
        terrain = "Electric";
    } else if (battle.status.fields.has(BattleFields.GrassyTerrain)) {
        terrain = "Grassy";
    } else if (battle.status.fields.has(BattleFields.MistyTerrain)) {
        terrain = "Misty";
    } else if (battle.status.fields.has(BattleFields.PsychicTerrain)) {
        terrain = "Psychic";
    }

    let weather: Weather;

    if (battle.status.weather && !battle.status.abilityEffects.has(AbilityEffects.AirLock)) {
        if (battle.status.weather.id === Weathers.SunnyDay) {
            weather = "Sun";
        } else if (battle.status.weather.id === Weathers.DesolateLand) {
            weather = "Harsh Sunshine";
        } else if (battle.status.weather.id === Weathers.RainDance) {
            weather = "Rain";
        } else if (battle.status.weather.id === Weathers.PrimordialSea) {
            weather = "Heavy Rain";
        } else if (battle.status.weather.id === Weathers.Hail) {
            weather = "Hail";
        } else if (battle.status.weather.id === Weathers.Snow) {
            weather = "Snow";
        } else if (battle.status.weather.id === Weathers.Sandstorm) {
            weather = "Sand";
        } else if (battle.status.weather.id === Weathers.DeltaStream) {
            weather = "Strong Winds";
        }
    }

    const field = new Field({
        gameType: battle.status.gameType !== "singles" ? "Doubles" : "Singles",
        terrain: terrain,
        weather: weather,
        isInverse: battle.status.inverse,
        isGravity: battle.status.fields.has(BattleFields.Gravity),
        isWonderRoom: battle.status.fields.has(BattleFields.WonderRoom),
        isMagicRoom: battle.status.fields.has(BattleFields.MagicRoom),
        isAuraBreak: battle.status.abilityEffects.has(AbilityEffects.AuraBreak),
        isDarkAura: battle.status.abilityEffects.has(AbilityEffects.DarkAura),
        isFairyAura: battle.status.abilityEffects.has(AbilityEffects.FairyAura),
        isBeadsOfRuin: battle.status.abilityEffects.has(AbilityEffects.BeadsOfRuin),
        isSwordOfRuin: battle.status.abilityEffects.has(AbilityEffects.SwordOfRuin),
        isTabletsOfRuin: battle.status.abilityEffects.has(AbilityEffects.TabletsOfRuin),
        isVesselOfRuin: battle.status.abilityEffects.has(AbilityEffects.VesselOfRuin),
        attackerSide: new Side({
            isTailwind: attackerPlayer.sideConditions.has(SideConditions.Tailwind),
            isHelpingHand: options.isHelpingHand,
            isReflect: attackerPlayer.sideConditions.has(SideConditions.Reflect) || attacker.volatiles.has(VolatileStatuses.Reflect),
            isLightScreen: attackerPlayer.sideConditions.has(SideConditions.LightScreen),
            isForesight: attacker.volatiles.has(VolatileStatuses.Foresight),
            isFlowerGift: checkFlowerGift(battle, attackerPlayer, attacker.slot),
            isFriendGuard: checkFriendGuard(battle, attackerPlayer, attacker.slot),
            isPowerSpot: checkPowerSpot(battle, attackerPlayer, attacker.slot),
            isBattery: checkBattery(battle, attackerPlayer, attacker.slot),
        }),
        defenderSide: new Side({
            isTailwind: defenderPlayer.sideConditions.has(SideConditions.Tailwind),
            isReflect: defenderPlayer.sideConditions.has(SideConditions.Reflect) || defender.volatiles.has(VolatileStatuses.Reflect),
            isLightScreen: defenderPlayer.sideConditions.has(SideConditions.LightScreen),
            isForesight: defender.volatiles.has(VolatileStatuses.Foresight),
            isFlowerGift: checkFlowerGift(battle, defenderPlayer, defender.slot),
            isFriendGuard: checkFriendGuard(battle, defenderPlayer, defender.slot),
            isPowerSpot: checkPowerSpot(battle, defenderPlayer, defender.slot),
            isBattery: checkBattery(battle, defenderPlayer, defender.slot),
        }),
    });

    // Calculate

    const result = calculate(
        Generations.get(Math.min(LAST_GEN, Math.max(1, battle.status.gen)) as GenerationNum),
        attackerData,
        defenderData,
        moveData,
        field,
    );

    let [min, max] = result.range();

    if (moveData.hits && typeof moveData.hits === "number") {
        min *= moveData.hits;
        max *= moveData.hits;
    }

    if (options.usePercent) {
        if (options.ignoreCurrentHP) {
            min = min * 100 / (defenderData.maxHP(true) || 1);
            max = max * 100 / (defenderData.maxHP(true) || 1);
        } else {
            min = min * 100 / (defenderData.curHP(true) || 1);
            max = max * 100 / (defenderData.curHP(true) || 1);
        }
    }

    return {
        min: min,
        max: max,
        priority: moveData.priority,
    };
}

