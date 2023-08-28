// List of volatiles in the game

"use strict";

import { toId } from "../utils/id";

/**
 * List of existing volatile statuses
 */
export const VolatileStatuses = {
    AirBalloon: toId("Air Balloon"),

    TypeChange: toId("Type Change"), // Extra data: List of types
    TypeAdd: toId("Type Add"), // Extra data: Type

    Imprison: toId("Imprison"),

    PerishSong: toId("Perish"), // This volatile has an argument (turns left)

    Mimic: toId("Mimic"), // Extra data: move mimic

    Disable: toId("Disable"), // Extra data: Move disabled
    Taunt: toId("Taunt"),
    Encore: toId("Encore"),
    Confusion: toId("Confusion"),
    Attract: toId("Attract"),
    Curse: toId("Curse"),
    Embargo: toId("Embargo"),
    Foresight: toId("Foresight"),
    HealBlock: toId("Heal Block"),
    LeechSeed: toId("Leech Seed"),
    MiracleEye: toId("Miracle Eye"),
    Nightmare: toId("Nightmare"),
    Octolock: toId("Octolock"),
    SaltCure: toId("Salt Cure"),
    SmackDown: toId("Smack Down"),
    Telekinesis: toId("Telekinesis"),
    ThroatChop: toId("Throat Chop"),
    Torment: toId("Torment"),

    FocusEnergy: toId("Focus Energy"),
    GMaxChiStrike: toId("G-Max Chi Strike"),
    LaserFocus: toId("Laser Focus"),
    LockOn: toId("Lock-On"),

    AquaRing: toId("Aqua Ring"),
    Ingrain: toId("Ingrain"),

    NoRetreat: toId("No Retreat"),
    Bide: toId("Bide"),

    MagnetRise: toId("Magnet Rise"),

    GastroAcid: toId("Gastro Acid"),

    FlashFire: toId("Flash Fire"),
    Charge: toId("Charge"),

    ProtoSynthesis: toId("Proto Synthesis"), // This volatile has an argument (the boosted base stat)
    QuarkDrive: toId("Quark Drive"), // This volatile has an argument (the boosted base stat)

    SlowStart: toId("Slow Start"),

    Fallen: toId("Fallen"), // This volatile has an argument (the number of fallen pokemon)

    PowerShift: toId("Power Shift"),
    PowerTrick: toId("Power Trick"),

    Stockpile: toId("Stockpile"), // This volatile has an argument (stockpile level)

    Substitute: toId("Substitute"),

    Uproar: toId("Uproar"),
    Yawn: toId("Yawn"),

    Reflect: toId("Reflect"),
    LightScreen: toId("Light Screen"),

    Dynamax: toId("Dynamax"),

    Transform: toId("Transform"), // Extra data: Pokemon transformed

    Illusion: toId("Illusion"), // Extra data: Pokemon being impersonated

    Trapped: toId("Trapped"),

    Mist: toId("Mist"),
    Rage: toId("Rage"),
};

/**
 * List of volatiles not passed by baton pass
 */
export const VolatilesNotBatonPassing = new Set([
    'airballoon',
    'attract',
    'autotomize',
    'disable',
    'encore',
    'foresight',
    'gmaxchistrike',
    'imprison',
    'laserfocus',
    'mimic',
    'miracleeye',
    'nightmare',
    'saltcure',
    'smackdown',
    'stockpile',
    'torment',
    'typeadd',
    'typechange',
    'yawn',
]);

/**
 * List of existing single turn statuses
 */
export const SingleTurnStatuses = {
    Protect: toId("Protect"),
    BeakBlast: toId("Beak Blast"),
    CraftyShield: toId("Crafty Shield"),
    Electrify: toId("Electrify"),
    Endure: toId("Endure"),
    FocusPunch: toId("Focus Punch"),
    FollowMe: toId("Follow Me"),
    HelpingHand: toId("Helping Hand"),
    Instruct: toId("Instruct"),
    MagicCoat: toId("Magic Coat"),
    MatBlock: toId("Mat Block"),
    MaxGuard: toId("Max Guard"),
    Powder: toId("Powder"),
    QuickGuard: toId("Quick Guard"),
    RagePowder: toId("Rage Powder"),
    Roost: toId("Roost"),
    ShellTrap: toId("Shell Trap"),
    Snatch: toId("Snatch"),
    Spotlight: toId("Spotlight"),
    WideGuard: toId("Wide Guard"),
    BatonPass: toId("Baton Pass"),
    ShedTail: toId("Shed Tail"),
};

/**
 * List of existing single move statuses
 */
export const SingleMoveStatuses = {
    DestinyBond: toId("Destiny Bond"),
    GlaiveRush: toId("Glaive Rush"),
    Grudge: toId("Grudge"),
    Rage: toId("Rage"),
    MustRecharge: toId("Must Recharge"),
    Charge: toId("Charge"),
};
