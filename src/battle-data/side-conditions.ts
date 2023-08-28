// Side conditions

"use strict";

import { toId } from "../utils/id";
import { PokemonIdentTarget } from "./ident";

/**
 * Side condition status
 */
export interface SideCondition {
    /**
     * Condition id
     */
    id: string;

    /**
     * Number of instances set (spikes, toxic spikes)
     */
    counter: number;

    /**
     * Turn the side condition was set on
     */
    turn: number;

    /**
     * Estimated duration of the condition (in turns)
     */
    estimatedDuration: number;

    /**
     * Pokemon who set the condition
     */
    setBy?: PokemonIdentTarget;
}

/**
 * List of side conditions
 */
export const SideConditions = {
    AuroraVeil: toId("Aurora Veil"),
    GMaxCannonade: toId("G-Max Cannonade"),
    GMaxSteelsurge: toId("G-Max Steelsurge"),
    GMaxVineLash: toId("G-Max Vine Lash"),
    GMaxVolcalith: toId("G-Max Volcalith"),
    GMaxWildfire: toId("G-Max Wildfire"),
    LightScreen: toId("Light Screen"),
    LuckyChant: toId("Lucky Chant"),
    Mist: toId("Mist"),
    Reflect: toId("Reflect"),
    Safeguard: toId("Safeguard"),
    Spikes: toId("Spikes"),
    StealthRock: toId("Stealth Rock"),
    StickyWeb: toId("Sticky Web"),
    Tailwind: toId("Tailwind"),
    ToxicSpikes: toId("Toxic Spikes"),

    Wish: toId("Wish"),
    HealingWish: toId("Healing Wish"),
    LunarDance: toId("Lunar Dance"),
    DoomDesire: toId("Doom Desire"),
    FutureSight: toId("Future Sight"),
};
