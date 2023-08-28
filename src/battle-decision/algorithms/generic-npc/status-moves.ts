// Status moves

"use strict";

import { Move } from "@asanrom/poke-calc";
import { Battle, BattleActivePokemon, BattleFields, BattlePlayer, PokemonTypes, SideConditions, SingleMoveStatuses, StatName, VolatileStatuses, Weathers, compareDetails, getCombinedEffectivenessMultiplier, getTypeChart } from "../../../battle-data";
import { MoveSubDecision, SwitchSubDecision, playersAreAllies } from "../../active-decision";
import { GenericNPCContext } from "./context-extra-data";
import { compareIds, toId } from "../../../utils";
import { StallMoves, canBeTypeAdded, canBeTypeChanged, canBoost, canUnBoostTarget, checkOffensiveBoostViability, countBoosts, countHazards, findAdjacentAlly, hazardsMoveViable, hazardsMoveWillBeBounced, isStatusViable, moveDoesDamage } from "./status-moves-utils";
import { PermanentAbilities, abilityIsEnabled, findItemData, findMove, getMoveFlags, getMoveRealType, getPokemonCurrentTypes, isGrounded, isSnowy, isTrappable, itemIsEnabled, moveBreaksAbility } from "../../../battle-helpers";
import { getHPPercent } from "../../../showdown-battle-parser/parser-utils";
import { TypeName } from "@asanrom/poke-calc/dist/data/interface";

/**
 * Context to check a status move
 */
export interface StatusMoveContext {
    battle: Battle;
    mainPlayer: BattlePlayer;
    active: BattleActivePokemon;
    decision: MoveSubDecision;
    targetPlayer: BattlePlayer;
    target: BattleActivePokemon;
    move: Move;
    contextExtraData: GenericNPCContext;
    bestSwitch: SwitchSubDecision;
}

export type StatusMoveHandler = (context: StatusMoveContext) => boolean;

export const StatusMovesHandlers = new Map<string, StatusMoveHandler>();

/**
 * Adds a handler for a status move
 * @param moves Move or list of moves
 * @param handler The handler
 */
function statusMove(moves: string | string[], handler: StatusMoveHandler) {
    if (typeof moves === "string") {
        StatusMovesHandlers.set(toId(moves), handler);
    } else {
        moves.forEach(move => {
            StatusMovesHandlers.set(toId(move), handler);
        });
    }
}

/* Self Boosting Moves */

statusMove([
    "Acid Armor",
    "Barrier",
    "Cotton Guard",
    "Defense Curl",
    "Harden",
    "Iron Defense",
    "Shelter",
    "Withdraw",
], context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return canBoost(context.active, "def");
});

statusMove("Acupressure", context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return canBoost(context.active, "atk") ||
        canBoost(context.active, "def") ||
        canBoost(context.active, "spa") ||
        canBoost(context.active, "spd") ||
        canBoost(context.active, "spe") ||
        canBoost(context.active, "accuracy") ||
        canBoost(context.active, "evasion");
});

statusMove(["Agility", "Autotomize", "Rock Polish"], context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return canBoost(context.active, "spe") && checkOffensiveBoostViability(context.active);
});

statusMove("Amnesia", context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return canBoost(context.active, "spd");
});

statusMove("Belly Drum", context => {
    return canBoost(context.active, "atk") && getHPPercent(context.active.condition) > 50;
});

statusMove(["Bulk Up", "Coil"], context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return (canBoost(context.active, "atk") || canBoost(context.active, "def")) && checkOffensiveBoostViability(context.active);
});

statusMove("Calm Mind", context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return (canBoost(context.active, "spa") || canBoost(context.active, "spd")) && checkOffensiveBoostViability(context.active);
});

statusMove(["Cosmic Power", "Defend Order"], context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return (canBoost(context.active, "def") || canBoost(context.active, "spd"));
});

statusMove(["Celebrate", "Conversion", "Happy Hour", "Hold Hands"], context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    if (context.decision.gimmick !== "z-move") {
        return false;
    }

    return canBoost(context.active, "atk") ||
        canBoost(context.active, "def") ||
        canBoost(context.active, "spa") ||
        canBoost(context.active, "spd") ||
        canBoost(context.active, "spe");
});

statusMove("Clangorous Soul", context => {
    if (!checkOffensiveBoostViability(context.active)) {
        return false;
    }

    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return canBoost(context.active, "atk") ||
        canBoost(context.active, "def") ||
        canBoost(context.active, "spa") ||
        canBoost(context.active, "spd") ||
        canBoost(context.active, "spe");
});

statusMove(["Double Team", "Minimize"], context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return canBoost(context.active, "evasion");
});

statusMove(["Dragon Dance", "Shift Gear"], context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return (canBoost(context.active, "atk") || canBoost(context.active, "spe")) && checkOffensiveBoostViability(context.active);
});

statusMove("Extreme Evoboost", context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return canBoost(context.active, "atk") ||
        canBoost(context.active, "def") ||
        canBoost(context.active, "spa") ||
        canBoost(context.active, "spd") ||
        canBoost(context.active, "spe");
});

statusMove("Fillet Away", context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    if (getHPPercent(context.active.condition) <= 50) {
        return false;
    }

    return canBoost(context.active, "atk") ||
        canBoost(context.active, "spa") ||
        canBoost(context.active, "spe");
});

statusMove(["Geomancy", "Quiver Dance"], context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return (canBoost(context.active, "spa") || canBoost(context.active, "spd") || canBoost(context.active, "spe")) && checkOffensiveBoostViability(context.active);
});

statusMove(["Growth", "Work Up"], context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return (canBoost(context.active, "atk") || canBoost(context.active, "spa")) && checkOffensiveBoostViability(context.active);
});

statusMove("Hone Claws", context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return (canBoost(context.active, "atk") || canBoost(context.active, "accuracy")) && checkOffensiveBoostViability(context.active);
});

statusMove(["Howl", "Meditate", "Sharpen", "Swords Dance"], context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return (canBoost(context.active, "atk")) && checkOffensiveBoostViability(context.active);
});

statusMove(["Nasty Plot", "Tail Glow"], context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return (canBoost(context.active, "spa")) && checkOffensiveBoostViability(context.active);
});

statusMove("No Retreat", context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    if (context.active.volatiles.has(VolatileStatuses.NoRetreat)) {
        return false;
    }

    return canBoost(context.active, "atk") ||
        canBoost(context.active, "def") ||
        canBoost(context.active, "spa") ||
        canBoost(context.active, "spd") ||
        canBoost(context.active, "spe");
});

statusMove("Shell Smash", context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return (canBoost(context.active, "atk") || canBoost(context.active, "spa") || canBoost(context.active, "spe")) && checkOffensiveBoostViability(context.active);
});

statusMove("Stockpile", context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    if (context.active.volatiles.has(VolatileStatuses.Stockpile) && context.active.volatilesData.stockpileLevel) {
        if (context.active.volatilesData.stockpileLevel >= 3) {
            return false;
        }
    }

    return (canBoost(context.active, "def") || canBoost(context.active, "spd"));
});

statusMove("Stuff Cheeks", context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    if (!context.active.item.item) {
        return false;
    }

    const itemData = findItemData(context.battle.status.gen, context.active.item.item);

    if (!itemData.isBerry) {
        return false;
    }

    return canBoost(context.active, "def");
});

statusMove("Victory Dance", context => {
    if (compareIds(context.active.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    return (canBoost(context.active, "atk") || canBoost(context.active, "def") || canBoost(context.active, "spe")) && checkOffensiveBoostViability(context.active);
});

/* Self positive volatiles */

statusMove("Aqua Ring", context => {
    return !context.active.volatiles.has(VolatileStatuses.AquaRing);
});

statusMove("Camouflage", context => {
    let newType: TypeName = 'Normal';

    if (context.battle.status.fields.has(BattleFields.ElectricTerrain)) {
        newType = "Electric";
    } else if (context.battle.status.fields.has(BattleFields.GrassyTerrain)) {
        newType = "Psychic";
    } else if (context.battle.status.fields.has(BattleFields.MistyTerrain)) {
        newType = "Fairy";
    } else if (context.battle.status.fields.has(BattleFields.PsychicTerrain)) {
        newType = "Psychic";
    }

    return canBeTypeChanged(context.battle, context.active, [newType]);
});

statusMove("Charge", context => {
    return !context.active.volatiles.has(VolatileStatuses.Charge);
});

statusMove("Focus Energy", context => {
    return !context.active.volatiles.has(VolatileStatuses.FocusEnergy);
});

statusMove("Imprison", context => {
    return !context.active.volatiles.has(VolatileStatuses.Imprison);
});

statusMove("Ingrain", context => {
    if (context.active.volatiles.has(VolatileStatuses.PerishSong)) {
        return false;
    }

    return !context.active.volatiles.has(VolatileStatuses.Ingrain);
});

statusMove(["Laser Focus", "Lock-On", "Mind Reader"], context => {
    return !context.active.volatiles.has(VolatileStatuses.LaserFocus) &&
        !context.active.volatiles.has(VolatileStatuses.LockOn);
});

statusMove("Magnet Rise", context => {
    if (!isGrounded(context.battle, context.active)) {
        return false;
    }

    return !context.active.volatiles.has(VolatileStatuses.MagnetRise);
});

statusMove("Mimic", context => {
    return !context.active.volatiles.has(VolatileStatuses.Mimic);
});

statusMove("Power Trick", context => {
    return !context.active.volatiles.has(VolatileStatuses.PowerTrick);
});

statusMove("Substitute", context => {
    if (getHPPercent(context.active.condition) <= 25) {
        return false;
    }

    return !context.active.volatiles.has(VolatileStatuses.Substitute);
});

/* Status cure moves */

statusMove(["Aromatherapy", "Heal Bell"], context => {
    for (const pokemon of context.mainPlayer.team) {
        if (pokemon.condition.fainted) {
            return;
        }

        if (pokemon.condition.status) {
            return true;
        }
    }

    return false;
});

statusMove(["Lunar Blessing", "Refresh", "Purify", "Take Heart"], context => {
    return !!context.active.condition.status;
});

/* Healing moves */

statusMove([
    "Heal Order",
    "Jungle Healing",
    "Life Dew",
    "Milk Drink",
    "Moonlight",
    "Morning Sun",
    "Recover",
    "Roost",
    "Shore Up",
    "Slack Off",
    "Soft-Boiled",
    "Synthesis",
], context => {
    if (context.active.volatiles.has(VolatileStatuses.HealBlock)) {
        return false;
    }

    return getHPPercent(context.active.condition) < 85;
});

statusMove("Rest", context => {
    if (context.active.volatiles.has(VolatileStatuses.HealBlock)) {
        return false;
    }

    if (isGrounded(context.battle, context.active) && context.battle.status.fields.has(BattleFields.ElectricTerrain)) {
        return false;
    }

    if (compareIds(context.active.ability.ability, "Comatose") && abilityIsEnabled(context.battle, context.active)) {
        return false;
    }

    if (context.active.condition.status === "SLP") {
        return false;
    }

    return getHPPercent(context.active.condition) < 85 || !!context.active.condition.status;
});

statusMove("Swallow", context => {
    if (context.active.volatiles.has(VolatileStatuses.HealBlock)) {
        return false;
    }

    if (!context.active.volatiles.has(VolatileStatuses.Stockpile)) {
        return false;
    }

    return getHPPercent(context.active.condition) < 85;
});

statusMove("Wish", context => {
    return !context.active.lastMove || !compareIds(context.active.lastMove, "Wish");
});

statusMove("Pain Split", context => {
    return (context.active.stats.hp.max * getHPPercent(context.active.condition)) < (context.target.stats.hp.max * getHPPercent(context.target.condition));
});

/* Positive side conditions */

statusMove("Aurora Veil", context => {
    if (context.mainPlayer.sideConditions.has(SideConditions.AuroraVeil)) {
        return false;
    }

    return isSnowy(context.battle);
});

statusMove("Light Screen", context => {
    if (context.battle.status.gen === 1 && context.active.volatiles.has(VolatileStatuses.LightScreen)) {
        return false;
    }

    return !context.mainPlayer.sideConditions.has(SideConditions.LightScreen);
});

statusMove("Lucky Chant", context => {
    return !context.mainPlayer.sideConditions.has(SideConditions.LuckyChant);
});

statusMove("Mist", context => {
    if (context.battle.status.gen === 1 && context.active.volatiles.has(VolatileStatuses.Mist)) {
        return false;
    }

    return !context.mainPlayer.sideConditions.has(SideConditions.Mist);
});

statusMove("Reflect", context => {
    if (context.battle.status.gen === 1 && context.active.volatiles.has(VolatileStatuses.Reflect)) {
        return false;
    }

    return !context.mainPlayer.sideConditions.has(SideConditions.Reflect);
});

statusMove("Safeguard", context => {
    return !context.mainPlayer.sideConditions.has(SideConditions.Safeguard);
});

statusMove("Tailwind", context => {
    return !context.mainPlayer.sideConditions.has(SideConditions.Tailwind);
});

/* Hazards removal */

statusMove(["Rapid Spin", "Mortal Spin", "G-Max Wind Rage"], context => {
    if (!moveDoesDamage(context)) {
        return false;
    }

    if (context.active.volatiles.has(VolatileStatuses.LeechSeed)) {
        return true;
    }

    let futureSwitches = false;

    for (const poke of context.battle.request.side.pokemon) {
        if (poke.condition.fainted || poke.active) {
            continue;
        }

        futureSwitches = true;
        break;
    }

    if (!futureSwitches) {
        return false;
    }

    return context.mainPlayer.sideConditions.has(SideConditions.StealthRock) ||
        context.mainPlayer.sideConditions.has(SideConditions.Spikes) ||
        context.mainPlayer.sideConditions.has(SideConditions.StickyWeb) ||
        context.mainPlayer.sideConditions.has(SideConditions.ToxicSpikes);
});

statusMove(["Defog", "Tidy Up"], context => {
    let futureSwitches = false;

    for (const poke of context.battle.request.side.pokemon) {
        if (poke.condition.fainted || poke.active) {
            continue;
        }

        futureSwitches = true;
        break;
    }

    if (!futureSwitches) {
        return false;
    }

    return context.mainPlayer.sideConditions.has(SideConditions.StealthRock) ||
        context.mainPlayer.sideConditions.has(SideConditions.Spikes) ||
        context.mainPlayer.sideConditions.has(SideConditions.StickyWeb) ||
        context.mainPlayer.sideConditions.has(SideConditions.ToxicSpikes);
});

statusMove("Court Change", context => {
    return countHazards(context.mainPlayer) > countHazards(context.targetPlayer);
});

/* Target de-boosting moves */

statusMove(["Baby-Doll Eyes", "Leer", "Screech", "Tail Whip"], context => {
    if (compareIds(context.target.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.target)) {
        return false;
    }

    return canUnBoostTarget(context, "def");
});

statusMove(["Captivate", "Confide", "Eerie Impulse"], context => {
    if (compareIds(context.target.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.target)) {
        return false;
    }

    return canUnBoostTarget(context, "spa");
});

statusMove(["Charm", "Feather Dance", "Growl", "Strength Sap", "Play Nice"], context => {
    if (compareIds(context.target.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.target)) {
        return false;
    }

    return canUnBoostTarget(context, "atk");
});

statusMove(["Cotton Spore", "Scary Face", "String Shot"], context => {
    if (compareIds(context.target.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.target)) {
        return false;
    }

    return canUnBoostTarget(context, "spe");
});

statusMove(["Fake Tears", "Metal Sound"], context => {
    if (compareIds(context.target.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.target)) {
        return false;
    }

    return canUnBoostTarget(context, "spd");
});

statusMove(["Flash", "Kinesis", "Sand Attack", "Smokescreen"], context => {
    if (compareIds(context.target.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.target)) {
        return false;
    }

    return canUnBoostTarget(context, "accuracy");
});

statusMove(["Memento", "Noble Roar", "Parting Shot", "Tearful Look"], context => {
    if (compareIds(context.target.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.target)) {
        return false;
    }

    return canUnBoostTarget(context, "atk") || canUnBoostTarget(context, "spa");
});

statusMove(["Spicy Extract", "Tickle"], context => {
    if (compareIds(context.target.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.target)) {
        return false;
    }

    return canUnBoostTarget(context, "atk") || canUnBoostTarget(context, "def");
});

statusMove("Sweet Scent", context => {
    if (compareIds(context.target.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.target)) {
        return false;
    }

    return canUnBoostTarget(context, "evasion");
});

statusMove("Venom Drench", context => {
    if (compareIds(context.target.ability.ability, "Contrary") && abilityIsEnabled(context.battle, context.target)) {
        return false;
    }

    if (context.target.condition.status !== "TOX" && context.target.condition.status !== "PSN") {
        return false;
    }

    return canUnBoostTarget(context, "atk") || canUnBoostTarget(context, "spa") || canUnBoostTarget(context, "spe");
});

/* Target negative status moves */

statusMove("Dark Void", context => {
    if (!compareIds(context.active.details.species, "Darkrai")) {
        return;
    }

    return isStatusViable(context, "SLP");
});

statusMove(["Glare", "Stun Spore"], context => {
    return isStatusViable(context, "PAR");
});

statusMove(["Grass Whistle", "Hypnosis", "Lovely Kiss", "Sing", "Sleep Powder", "Spore"], context => {
    return isStatusViable(context, "SLP");
});

statusMove(["Poison Gas", "Poison Powder", "Toxic Thread"], context => {
    return isStatusViable(context, "PSN");
});

statusMove("Psycho Shift", context => {
    if (!context.active.condition.status) {
        return;
    }

    return isStatusViable(context, context.active.condition.status);
});

statusMove("Thunder Wave", context => {
    const typeChart = getTypeChart(context.battle.status.gen);

    if (getCombinedEffectivenessMultiplier(typeChart, [PokemonTypes.Electric], getPokemonCurrentTypes(context.battle, context.target), context.battle.status.inverse) === 0) {
        return false; // Thunder Wave is affected by natural immunities
    }

    return isStatusViable(context, "PAR");
});

statusMove("Toxic", context => {
    return isStatusViable(context, "TOX");
});

statusMove("Will-O-Wisp", context => {
    return isStatusViable(context, "BRN");
});

statusMove("Yawn", context => {
    if (context.target.volatiles.has(VolatileStatuses.Yawn)) {
        return false;
    }
    
    return isStatusViable(context, "SLP");
});

/* Negative volatile statuses */

statusMove("Attract", context => {
    if (context.target.volatiles.has(VolatileStatuses.Attract)) {
        return false;
    }

    return (context.target.details.gender === "M" && context.active.details.gender === "F") || (context.target.details.gender === "F" && context.active.details.gender === "M");
});

statusMove(["Block", "Mean Look", "Spider Web"], context => {
    if (context.target.volatiles.has(VolatileStatuses.Trapped)) {
        return false;
    }

    return isTrappable(context.battle, context.target);
});

statusMove(["Confuse Ray", "Flatter", "Swagger", "Sweet Kiss", "Supersonic", "Teeter Dance"], context => {
    if (compareIds(context.target.ability.ability, "Own Tempo") && abilityIsEnabled(context.battle, context.target) && !moveBreaksAbility(context.battle, context.active, context.target, context.move)) {
        return false;
    }

    return !context.target.volatiles.has(VolatileStatuses.Confusion);
});

statusMove("Curse", context => {
    if (getPokemonCurrentTypes(context.battle, context.active).includes("Ghost")) {
        return getHPPercent(context.active.condition) > 50 && !context.target.volatiles.has(VolatileStatuses.Curse);
    } else {
        return canBoost(context.active, "atk") || canBoost(context.active, "def");
    }
});

statusMove("Heal Block", context => {
    return !context.target.volatiles.has(VolatileStatuses.HealBlock);
});

statusMove("Disable", context => {
    if (context.target.volatiles.has(VolatileStatuses.Disable)) {
        return false;
    }

    if (!context.target.lastMove) {
        return false;
    }

    if (compareIds(context.target.lastMove, "Struggle")) {
        return false;
    }

    const moveData = findMove(context.battle.status.gen, context.target.lastMove);

    return !moveData.isMax && !moveData.isZ;
});

statusMove("Embargo", context => {
    return !context.target.volatiles.has(VolatileStatuses.Embargo);
});

statusMove("Encore", context => {
    if (context.target.volatiles.has(VolatileStatuses.Encore)) {
        return false;
    }

    if (!context.target.lastMove) {
        return false;
    }

    if (compareIds(context.target.lastMove, "Struggle")) {
        return false;
    }

    const moveData = findMove(context.battle.status.gen, context.target.lastMove);

    return !moveData.isMax && !moveData.isZ;
});

statusMove(["Foresight", "Odor Sleuth"], context => {
    const targetTypes = getPokemonCurrentTypes(context.battle, context.target);

    if (!targetTypes.includes("Ghost")) {
        return false;
    }

    return !context.target.volatiles.has(VolatileStatuses.Foresight) &&
        !context.target.volatiles.has(VolatileStatuses.MiracleEye);
});

statusMove("Miracle Eye", context => {
    const targetTypes = getPokemonCurrentTypes(context.battle, context.target);

    if (!targetTypes.includes("Dark")) {
        return false;
    }

    return !context.target.volatiles.has(VolatileStatuses.Foresight) &&
        !context.target.volatiles.has(VolatileStatuses.MiracleEye);
});

statusMove("Leech Seed", context => {
    const targetTypes = getPokemonCurrentTypes(context.battle, context.target);

    if (targetTypes.includes("Grass")) {
        return false;
    }

    if (["Magic Guard", "Liquid Ooze"].map(toId).includes(toId(context.target.ability.ability))) {
        if (abilityIsEnabled(context.battle, context.target)) {
            return false;
        }
    }

    return !context.target.volatiles.has(VolatileStatuses.LeechSeed);
});

statusMove("Nightmare", context => {
    return !context.target.volatiles.has(VolatileStatuses.Nightmare) && context.target.condition.status === "SLP";
});

statusMove("Octolock", context => {
    if (context.target.volatiles.has(VolatileStatuses.Octolock)) {
        return false;
    }

    return isTrappable(context.battle, context.target);
});

statusMove("Perish Song", context => {
    if (context.active.volatiles.has(VolatileStatuses.Ingrain)) {
        return false;
    }

    return !context.target.volatiles.has(VolatileStatuses.PerishSong);
});

statusMove("Taunt", context => {
    return !context.target.volatiles.has(VolatileStatuses.Taunt);
});

statusMove("Telekinesis", context => {
    if (context.battle.status.fields.has(BattleFields.Gravity)) {
        return false;
    }

    return !context.target.volatiles.has(VolatileStatuses.Telekinesis);
});

statusMove("Torment", context => {
    return !context.target.volatiles.has(VolatileStatuses.Torment);
});

/* Type change moves */

statusMove("Forest's Curse", context => {
    return canBeTypeAdded(context.battle, context.target, "Grass");
});

statusMove("Magic Powder", context => {
    return canBeTypeChanged(context.battle, context.target, ["Psychic"]);
});

statusMove("Reflect Type", context => {
    return canBeTypeChanged(context.battle, context.active, getPokemonCurrentTypes(context.battle, context.target));
});

statusMove("Soak", context => {
    return canBeTypeChanged(context.battle, context.target, ["Water"]);
});

statusMove("Trick-or-Treat", context => {
    return canBeTypeAdded(context.battle, context.target, "Ghost");
});

/* Negative side conditions (hazards) */

statusMove("Spikes", context => {
    if (hazardsMoveWillBeBounced(context.battle, context.mainPlayer, context.active, context.move)) {
        return false;
    }

    return hazardsMoveViable(context.battle, context.mainPlayer, SideConditions.Spikes, 3, true);
});

statusMove("Stealth Rock", context => {
    if (hazardsMoveWillBeBounced(context.battle, context.mainPlayer, context.active, context.move)) {
        return false;
    }

    return hazardsMoveViable(context.battle, context.mainPlayer, SideConditions.StealthRock, 1, true);
});

statusMove("Sticky Web", context => {
    if (hazardsMoveWillBeBounced(context.battle, context.mainPlayer, context.active, context.move)) {
        return false;
    }

    return hazardsMoveViable(context.battle, context.mainPlayer, SideConditions.StickyWeb, 1, true);
});

statusMove("Toxic Spikes", context => {
    if (hazardsMoveWillBeBounced(context.battle, context.mainPlayer, context.active, context.move)) {
        return false;
    }

    return hazardsMoveViable(context.battle, context.mainPlayer, SideConditions.ToxicSpikes, 2, true);
});

statusMove("G-Max Steelsurge", context => {
    if (!moveDoesDamage(context)) {
        return false;
    }

    return hazardsMoveViable(context.battle, context.mainPlayer, SideConditions.GMaxSteelsurge, 1, true);
});

statusMove(["G-Max Wildfire", "G-Max Volcalith", "G-Max Vine Lash", "G-Max Cannonade"], context => {
    if (!moveDoesDamage(context)) {
        return false;
    }

    return hazardsMoveViable(context.battle, context.mainPlayer, toId(context.move.name), 1, false);
});

/* Ally target moves */

statusMove("Ally Switch", context => {
    if (context.active.lastMove && StallMoves.has(toId(context.active.lastMove))) {
        return false;
    }

    const adjacentAlly = findAdjacentAlly(context.battle, context.mainPlayer, context.active);

    if (!adjacentAlly || adjacentAlly.condition.fainted) {
        return false;
    }

    return context.contextExtraData.otherDecisions.get(adjacentAlly.slot) === "damage-move";
});

statusMove("Aromatic Mist", context => {
    if (context.targetPlayer.index !== context.mainPlayer.index && !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, context.mainPlayer.index)) {
        return false;
    }

    return canBoost(context.target, "spd");
});

statusMove("Coaching", context => {
    if (context.targetPlayer.index !== context.mainPlayer.index && !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, context.mainPlayer.index)) {
        return false;
    }

    return canBoost(context.target, "atk") || canBoost(context.target, "def");
});

statusMove("Decorate", context => {
    if (context.targetPlayer.index !== context.mainPlayer.index && !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, context.mainPlayer.index)) {
        return false;
    }

    return canBoost(context.target, "atk") || canBoost(context.target, "spa");
});

statusMove(["Floral Healing", "Heal Pulse"], context => {
    if (context.targetPlayer.index !== context.mainPlayer.index && !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, context.mainPlayer.index)) {
        return false;
    }

    return getHPPercent(context.target.condition) < 100;
});

statusMove(["Helping Hand", "Instruct"], context => {
    if (context.targetPlayer.index !== context.mainPlayer.index && !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, context.mainPlayer.index)) {
        return false;
    }

    return context.targetPlayer.index !== context.mainPlayer.index || context.contextExtraData.otherDecisions.get(context.target.slot) === "damage-move";
});

/* Randomized moves */

statusMove("Assist", context => {
    return context.mainPlayer.team.length > 1;
});

statusMove("Metronome", () => {
    return true;
});

/* Protect moves */

statusMove([
    "Protect",
    "Baneful Bunker",
    "Detect",
    "Endure",
    "King's Shield",
    "Max Guard",
    "Obstruct",
    "Silk Trap",
    "Spiky Shield"
], context => {
    return !context.active.lastMove || !StallMoves.has(toId(context.active.lastMove));
});

statusMove("Mat Block", context => {
    return context.active.switchedOnTurn === context.battle.turn || context.active.switchedOnTurn === context.battle.turn - 1;
});

/* Passing moves */

statusMove("Baton Pass", context => {
    if (!context.bestSwitch) {
        return false;
    }

    if (context.active.volatiles.has(VolatileStatuses.PerishSong)) {
        return false;
    }

    let boostsToPass = 0;

    for (const stat of context.active.boosts.keys()) {
        boostsToPass += context.active.boosts.get(stat);
    }

    return boostsToPass > 0;
});

statusMove("Shed Tail", context => {
    return !!context.bestSwitch && getHPPercent(context.active.condition) > 50;
});

statusMove("Teleport", context => {
    return !!context.bestSwitch;
});

/* Weather moves */

statusMove(["Chilly Reception", "Hail", "Snowscape"], context => {
    if (context.battle.status.weather) {
        if ([Weathers.PrimordialSea, Weathers.DesolateLand, Weathers.DeltaStream].includes(context.battle.status.weather.id)) {
            return false;
        }

        return [Weathers.Hail, Weathers.Snow].includes(context.battle.status.weather.id);
    } else {
        return true;
    }
});

statusMove("Rain Dance", context => {
    if (context.battle.status.weather) {
        if ([Weathers.PrimordialSea, Weathers.DesolateLand, Weathers.DeltaStream].includes(context.battle.status.weather.id)) {
            return false;
        }

        return [Weathers.RainDance].includes(context.battle.status.weather.id);
    } else {
        return true;
    }
});

statusMove("Sandstorm", context => {
    if (context.battle.status.weather) {
        if ([Weathers.PrimordialSea, Weathers.DesolateLand, Weathers.DeltaStream].includes(context.battle.status.weather.id)) {
            return false;
        }

        return [Weathers.Sandstorm].includes(context.battle.status.weather.id);
    } else {
        return true;
    }
});

statusMove("Sunny Day", context => {
    if (context.battle.status.weather) {
        if ([Weathers.PrimordialSea, Weathers.DesolateLand, Weathers.DeltaStream].includes(context.battle.status.weather.id)) {
            return false;
        }

        return [Weathers.SunnyDay].includes(context.battle.status.weather.id);
    } else {
        return true;
    }
});

/* Field moves */

statusMove([
    "Electric Terrain",
    "Grassy Terrain",
    "Gravity",
    "Magic Room",
    "Misty Terrain",
    "Mud Sport",
    "Psychic Terrain",
    "Trick Room",
    "Water Sport",
    "Wonder Room"
], context => {
    return !context.battle.status.fields.has(toId(context.move.name));
});

/* Ability changing moves */

statusMove(["Doodle", "Role Play"], context => {
    if (PermanentAbilities.has(toId(context.active.ability.ability))) {
        return false;
    }

    if (PermanentAbilities.has(toId(context.target.ability.ability))) {
        return false;
    }

    return !compareIds(context.active.ability.ability, context.target.ability.ability);
});

const EntrainmentFails = new Set([
    "Truant",
    "Multitype",
    "Stance Change",
    "Schooling",
    "Comatose",
    "Shields Down",
    "Disguise",
    "RKS System",
    "Battle Bond",
    "Ice Face",
    "Gulp Missile"
].map(toId));

statusMove("Entrainment", context => {
    if (PermanentAbilities.has(toId(context.active.ability.ability))) {
        return false;
    }

    if (PermanentAbilities.has(toId(context.target.ability.ability))) {
        return false;
    }

    if (compareIds(context.target.item.item, "Ability Shield") && itemIsEnabled(context.battle, context.target)) {
        return false;
    }

    if (EntrainmentFails.has(toId(context.active.ability.ability))) {
        return false;
    }

    if (EntrainmentFails.has(toId(context.target.ability.ability))) {
        return false;
    }

    if (context.target.ability.cannotBeChanged) {
        return false;
    }

    return !compareIds(context.active.ability.ability, context.target.ability.ability);
});

statusMove("Gastro Acid", context => {
    if (PermanentAbilities.has(toId(context.target.ability.ability))) {
        return false;
    }

    if (compareIds(context.target.item.item, "Ability Shield") && itemIsEnabled(context.battle, context.target)) {
        return false;
    }

    if (context.target.ability.cannotBeDisabled) {
        return false;
    }

    return abilityIsEnabled(context.battle, context.target);
});


const SkillSwapFails = new Set([
    "Wonder Guard",
    "Multitype",
    "Illusion",
    "Stance Change",
    "Schooling",
    "Comatose",
    "Shields Down",
    "Disguise",
    "RKS System",
    "Battle Bond",
    "Power Construct",
    "Ice Face",
    "Gulp Missile",
    "Neutralizing Gas"
].map(toId));

statusMove("Skill Swap", context => {
    if (PermanentAbilities.has(toId(context.active.ability.ability))) {
        return false;
    }

    if (PermanentAbilities.has(toId(context.target.ability.ability))) {
        return false;
    }

    if (compareIds(context.target.item.item, "Ability Shield") && itemIsEnabled(context.battle, context.target)) {
        return false;
    }

    if (SkillSwapFails.has(toId(context.active.ability.ability))) {
        return false;
    }

    if (SkillSwapFails.has(toId(context.target.ability.ability))) {
        return false;
    }

    if (context.target.ability.cannotBeChanged || context.target.ability.cannotBeSwapped) {
        return false;
    }

    return !compareIds(context.active.ability.ability, context.target.ability.ability);
});

statusMove("Simple Beam", context => {
    if (PermanentAbilities.has(toId(context.target.ability.ability))) {
        return false;
    }

    if (compareIds(context.target.item.item, "Ability Shield") && itemIsEnabled(context.battle, context.target)) {
        return false;
    }

    if (context.target.ability.cannotBeChanged) {
        return false;
    }

    return !compareIds(context.target.ability.ability, "Simple");
});

statusMove("Worry Seed", context => {
    if (PermanentAbilities.has(toId(context.target.ability.ability))) {
        return false;
    }

    if (compareIds(context.target.item.item, "Ability Shield") && itemIsEnabled(context.battle, context.target)) {
        return false;
    }

    if (context.target.ability.cannotBeChanged) {
        return false;
    }

    return !compareIds(context.target.ability.ability, "Insomnia");
});

/* Item changing moves */

statusMove("Corrosive Gas", context => {
    if (context.target.item.trickMoveFailed) {
        return false;
    }

    return !!context.target.item.item;
});

const ItemsToTrick = new Set<string>([
    "Choice Scarf",
    "Choice Band",
    "Choice Specs",
    "Sticky Barb",
    "Ring Target"
].map(toId));

statusMove(["Trick", "Switcheroo"], context => {
    if (context.target.item.trickMoveFailed) {
        return false;
    }

    return ItemsToTrick.has(toId(context.active.item.item));
});

statusMove("Recycle", context => {
    if (context.active.item.item || !context.active.item.previousItem) {
        return false;
    }

    return context.active.item.itemLostCause === "consumed" || context.active.item.itemLostCause === "eaten";
});

/* Moves only for doubles battles */

statusMove(["Follow Me", "Quash", "Rage Powder", "Spotlight"], context => {
    return ["doubles", "triples", "multi"].includes(context.battle.status.gameType);
});

/* Counter moves */

statusMove("Destiny Bond", context => {
    if (context.active.lastMove && compareIds(context.active.lastMove, "Destiny Bond")) {
        return false;
    }
    return !context.active.singleMoveStatuses.has(SingleMoveStatuses.DestinyBond);
});

statusMove("Counter", context => {
    if (!moveDoesDamage(context, 50)) {
        return false;
    }

    // Check if any foe has any Physical move
    for (const player of context.battle.players.values()) {
        if (player.index === context.targetPlayer.index || !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, player.index)) {
            continue;
        }

        for (const active of player.active.values()) {
            if (active.condition.fainted) {
                continue;
            }

            for (const move of active.moves.values()) {
                if (move.disabled || move.pp <= 0) {
                    continue;
                }

                const moveData = findMove(context.battle.status.gen, move.id);

                if (moveData.category === "Physical") {
                    return true;
                }
            }
        }
    }

    return false;
});

statusMove("Mirror Coat", context => {
    if (!moveDoesDamage(context, 50)) {
        return false;
    }

    // Check if any foe has any Special move
    for (const player of context.battle.players.values()) {
        if (player.index === context.targetPlayer.index || !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, player.index)) {
            continue;
        }

        for (const active of player.active.values()) {
            if (active.condition.fainted) {
                continue;
            }

            for (const move of active.moves.values()) {
                if (move.disabled || move.pp <= 0) {
                    continue;
                }

                const moveData = findMove(context.battle.status.gen, move.id);

                if (moveData.category === "Special") {
                    return true;
                }
            }
        }
    }

    return false;
});

statusMove(["Comeuppance", "Metal Burst"], context => {
    if (!moveDoesDamage(context, 50)) {
        return false;
    }

    // Check if any foe has any damage move
    for (const player of context.battle.players.values()) {
        if (player.index === context.targetPlayer.index || !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, player.index)) {
            continue;
        }

        for (const active of player.active.values()) {
            if (active.condition.fainted) {
                continue;
            }

            for (const move of active.moves.values()) {
                if (move.disabled || move.pp <= 0) {
                    continue;
                }

                const moveData = findMove(context.battle.status.gen, move.id);

                if (moveData.category === "Physical" || moveData.category === "Special") {
                    return true;
                }
            }
        }
    }

    return false;
});

statusMove("Grudge", context => {
    if (context.active.lastMove && compareIds(context.active.lastMove, "Grudge")) {
        return false;
    }
    return !context.active.singleMoveStatuses.has(SingleMoveStatuses.Grudge);
});

statusMove("Magic Coat", context => {
    if (!moveDoesDamage(context, 50)) {
        return false;
    }

    // Check if any foe has any reflectable move
    for (const player of context.battle.players.values()) {
        if (player.index === context.targetPlayer.index || !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, player.index)) {
            continue;
        }

        for (const active of player.active.values()) {
            if (active.condition.fainted) {
                continue;
            }

            for (const move of active.moves.values()) {
                if (move.disabled || move.pp <= 0) {
                    continue;
                }

                const moveFlags = getMoveFlags(context.battle.status.gen, move.id);

                if (moveFlags.has("reflectable")) {
                    return true;
                }
            }
        }
    }

    return false;
});

statusMove("Mirror Move", context => {
    if (!context.target.lastMove) {
        return false;
    }

    if (compareIds(context.target.lastMove, "Struggle")) {
        return false;
    }

    const moveData = findMove(context.battle.status.gen, context.target.lastMove);
    const moveFlags = getMoveFlags(context.battle.status.gen, context.target.lastMove);

    return !moveData.isMax && !moveData.isZ && moveFlags.has("mirror");
});

statusMove("Powder", context => {
    if (!moveDoesDamage(context, 50)) {
        return false;
    }

    // Check if any foe has any fire move
    for (const player of context.battle.players.values()) {
        if (player.index === context.targetPlayer.index || !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, player.index)) {
            continue;
        }

        for (const active of player.active.values()) {
            if (active.condition.fainted) {
                continue;
            }

            for (const move of active.moves.values()) {
                if (move.disabled || move.pp <= 0) {
                    continue;
                }

                const moveType = getMoveRealType(context.battle, active, move.id);

                if (moveType === "Fire") {
                    return true;
                }
            }
        }
    }

    return false;
});

statusMove("Snatch", context => {
    if (!context.target.lastMove) {
        return false;
    }

    // Check if any foe has any move affected by Snatch
    for (const player of context.battle.players.values()) {
        if (player.index === context.targetPlayer.index || !playersAreAllies(context.battle.status.gameType, context.targetPlayer.index, player.index)) {
            continue;
        }

        for (const active of player.active.values()) {
            if (active.condition.fainted) {
                continue;
            }

            for (const move of active.moves.values()) {
                if (move.disabled || move.pp <= 0) {
                    continue;
                }

                const moveFlags = getMoveFlags(context.battle.status.gen, move.id);

                if (moveFlags.has("snatch")) {
                    return true;
                }
            }
        }
    }

    return false;
});

statusMove("Spite", context => {
    if (!context.target.lastMove) {
        return false;
    }

    if (compareIds(context.target.lastMove, "Struggle")) {
        return false;
    }

    const lastMove = context.target.moves.get(toId(context.target.lastMove));

    return lastMove && lastMove.pp > 0;
});

statusMove("Tar Shot", context => {
    if (!context.target.lastMove) {
        return false;
    }

    if (compareIds(context.target.lastMove, "Struggle")) {
        return false;
    }

    const moveType = getMoveRealType(context.battle, context.target, context.target.lastMove);

    return moveType === "Fire";
});

/* Boost swap moves */

statusMove("Guard Swap", context => {
    const stats: StatName[] = ["def", "spd"];
    return countBoosts(context.target, stats) > countBoosts(context.active, stats);
});

statusMove("Power Swap", context => {
    const stats: StatName[] = ["atk", "spa"];
    return countBoosts(context.target, stats) > countBoosts(context.active, stats);
});

statusMove(["Heart Swap", "Haze", "Psych Up"], context => {
    const stats: StatName[] = ["atk", "def", "spa", "spd", "spe", "accuracy", "evasion"];
    return countBoosts(context.target, stats) > countBoosts(context.active, stats);
});

statusMove("Topsy-Turvy", context => {
    const stats: StatName[] = ["atk", "def", "spa", "spd", "spe", "accuracy", "evasion"];
    return countBoosts(context.target, stats) > 0;
});

/* Phasing moves */

statusMove(["Roar", "Whirlwind"], context => {
    if (context.target.volatiles.has(VolatileStatuses.Ingrain)) {
        return false;
    }

    if (compareIds(context.target.ability.ability, "Suction Cups") && abilityIsEnabled(context.battle, context.target)) {
        return false;
    }

    const stats: StatName[] = ["atk", "def", "spa", "spd", "spe", "accuracy", "evasion"];
    return countBoosts(context.target, stats) > 0 || countHazards(context.targetPlayer) > 0;
});

/* Side heal / revival moves */

statusMove(["Healing Wish", "Lunar Dance"], context => {
    if (!context.bestSwitch) {
        return false;
    }

    const bestSwitch = context.battle.request.side.pokemon[context.bestSwitch.pokemonIndex];

    if (!bestSwitch) {
        return false;
    }

    return getHPPercent(bestSwitch.condition) < 100 || !!bestSwitch.condition.status;
});

statusMove("Revival Blessing", context => {
    // Find fainted pokemon
    for (const poke of context.battle.request.side.pokemon) {
        if (poke.condition.fainted) {
            return true;
        }
    }

    return false;
});

/* Other moves */

statusMove("Electrify", () => {
    return true;
});

statusMove("Sleep Talk", context => {
    if (context.active.condition.status !== "SLP") {
        return false;
    }

    if (context.active.totalBurnedSleepTurns === 0) {
        return true; // The pokemon will be asleep for at least 1 turn
    }

    if (context.active.sleptByRest) {
        return context.active.totalBurnedSleepTurns < 2;
    } else {
        return Math.random() > (1 / Math.pow(2, context.active.totalBurnedSleepTurns));
    }
});

statusMove("Transform", context => {
    if (context.target.volatilesData.fake) {
        return false;
    }

    return !context.active.volatiles.has(VolatileStatuses.Transform) && !context.target.volatiles.has(VolatileStatuses.Transform);
});


