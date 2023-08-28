// Battle events parsing test

"use strict";

import { BattleEventMinor, BattleEventMinorSchema } from "../src/battle-data/battle-event-minor";
import { parsePokemonShowdownBattleEvent } from "../src/showdown-battle-parser";

import { expect } from 'chai';

function testBattleEvent(line: string, ev: BattleEventMinor) {
    // Check parser
    const parsed = parsePokemonShowdownBattleEvent(line);
    expect(parsed).to.deep.equal(ev);

    // Check sanitizer
    expect(BattleEventMinorSchema.sanitize(parsed)).to.deep.equal(parsed);
    expect(BattleEventMinorSchema.sanitize(ev)).to.deep.equal(ev);
}

describe("Battle events parsing test (Minor events)", () => {
    it("Damage", async () => {
        testBattleEvent(
            '|-damage|p2a: Dragonite|50/100',
            {
                "type": "Damage",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
                condition: {
                    hp: 50,
                    maxHP: 100,
                    status: "",
                    fainted: false,
                },
            },
        );
    });


    it("Damage (Effect - Self)", async () => {
        testBattleEvent(
            '|-damage|p2a: Dragonite|50/100 brn|[from] brn',
            {
                "type": "Damage",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
                condition: {
                    hp: 50,
                    maxHP: 100,
                    status: "BRN",
                    fainted: false,
                },
                fromEffect: {
                    kind: "pure",
                    id: "brn",
                }
            },
        );
    });

    it("Damage (Effect - Of)", async () => {
        testBattleEvent(
            '|-damage|p2a: Dragonite|50/100|[from] item: Rocky Helmet|[of] p1a: Toxapex',
            {
                "type": "Damage",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
                condition: {
                    hp: 50,
                    maxHP: 100,
                    status: "",
                    fainted: false,
                },
                fromEffect: {
                    kind: "item",
                    id: "rockyhelmet",
                },
                ofPokemon: {
                    name: "Toxapex",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });


    it("Damage (Effect - Self)", async () => {
        testBattleEvent(
            '|-damage|p2a: Dragonite|50/100 brn|[from] brn',
            {
                "type": "Damage",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
                condition: {
                    hp: 50,
                    maxHP: 100,
                    status: "BRN",
                    fainted: false,
                },
                fromEffect: {
                    kind: "pure",
                    id: "brn",
                }
            },
        );
    });

    it("Heal", async () => {
        testBattleEvent(
            '|-heal|p1a: Dragonite|100/100',
            {
                "type": "Heal",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                condition: {
                    hp: 100,
                    maxHP: 100,
                    status: "",
                    fainted: false,
                },
            },
        );
    });

    it("Heal (Revive)", async () => {
        testBattleEvent(
            '|-heal|p1: Mew|50/100',
            {
                "type": "Heal",
                pokemon: {
                    name: "Mew",
                    playerIndex: 1,
                    active: false,
                },
                condition: {
                    hp: 50,
                    maxHP: 100,
                    status: "",
                    fainted: false,
                },
            },
        );
    });

    it("Heal (Effect)", async () => {
        testBattleEvent(
            '|-heal|p1a: Dragonite|100/100 par|[from] ability: Volt Absorb|[of] p1a: Dragonite',
            {
                "type": "Heal",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                condition: {
                    hp: 100,
                    maxHP: 100,
                    status: "PAR",
                    fainted: false,
                },
                fromEffect: {
                    kind: "ability",
                    id: "voltabsorb"
                },
                ofPokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("SetHP", async () => {
        testBattleEvent(
            '|-sethp|p1a: Dragonite|100/100|p2a: Vaporeon|80/100 frz',
            {
                "type": "SetHP",
                targets: [
                    {
                        pokemon: {
                            name: "Dragonite",
                            playerIndex: 1,
                            active: true,
                            slot: 0,
                        },
                        condition: {
                            hp: 100,
                            maxHP: 100,
                            status: "",
                            fainted: false,
                        },
                    },
                    {
                        pokemon: {
                            name: "Vaporeon",
                            playerIndex: 2,
                            active: true,
                            slot: 0,
                        },
                        condition: {
                            hp: 80,
                            maxHP: 100,
                            status: "FRZ",
                            fainted: false,
                        },
                    }
                ]
            },
        );
    });


    it("Boost", async () => {
        testBattleEvent(
            '|-boost|p1a: Dragonite|spe|2|[from] ability: Speed Boost|[of] p1a: Dragonite',
            {
                "type": "Boost",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                stat: "spe",
                amount: 2,
                fromEffect: {
                    kind: "ability",
                    id: "speedboost"
                },
                ofPokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("UnBoost", async () => {
        testBattleEvent(
            '|-unboost|p1a: Dragonite|atk|1|[from] ability: Intimidate|[of] p2a: Gyarados',
            {
                "type": "UnBoost",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                stat: "atk",
                amount: 1,
                fromEffect: {
                    kind: "ability",
                    id: "intimidate"
                },
                ofPokemon: {
                    name: "Gyarados",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("SetBoost", async () => {
        testBattleEvent(
            '|-setboost|p1a: Dragonite|atk|6',
            {
                "type": "SetBoost",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                stat: "atk",
                amount: 6,
            },
        );
    });

    it("SwapBoost", async () => {
        testBattleEvent(
            '|-swapboost|p1a: Dragonite|p2a: Mew|atk,spa',
            {
                "type": "SwapBoost",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                target: {
                    name: "Mew",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
                stats: ['atk', 'spa'],
            },
        );
    });


    it("ClearPositiveBoost", async () => {
        testBattleEvent(
            '|-clearpositiveboost|p1a: Dragonite|[from] move: Spectral Thief|[of] p2a: Marshadow',
            {
                "type": "ClearPositiveBoost",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                fromEffect: {
                    kind: "move",
                    id: "spectralthief",
                },
                ofPokemon: {
                    name: "Marshadow",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("ClearNegativeBoost", async () => {
        testBattleEvent(
            '|-clearnegativeboost|p1a: Dragonite|',
            {
                "type": "ClearNegativeBoost",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("CopyBoost", async () => {
        testBattleEvent(
            '|-copyboost|p1a: Dragonite|p1b: Mew|[from] ability: Costar',
            {
                "type": "CopyBoost",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                fromPokemon: {
                    name: "Mew",
                    playerIndex: 1,
                    active: true,
                    slot: 1,
                },
                stats: ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'],
                fromEffect: {
                    kind: "ability",
                    id: "costar",
                }
            },
        );
    });

    it("ClearBoost", async () => {
        testBattleEvent(
            '|-clearboost|p1a: Dragonite|[from] move: Haze|[of] p2a: Mew',
            {
                "type": "ClearBoost",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                fromEffect: {
                    kind: "move",
                    id: "haze",
                },
                ofPokemon: {
                    name: "Mew",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("InvertBoost", async () => {
        testBattleEvent(
            '|-invertboost|p1a: Dragonite',
            {
                "type": "InvertBoost",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("ClearAllBoosts", async () => {
        testBattleEvent(
            '|-clearallboost',
            {
                "type": "ClearAllBoosts",
            },
        );
    });

    it("CriticalHit", async () => {
        testBattleEvent(
            '|-crit|p1a: Dragonite',
            {
                "type": "CriticalHit",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("SuperEffectiveHit", async () => {
        testBattleEvent(
            '|-supereffective|p1a: Dragonite',
            {
                "type": "SuperEffectiveHit",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("ResistedHit", async () => {
        testBattleEvent(
            '|-resisted|p1a: Dragonite',
            {
                "type": "ResistedHit",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });


    it("Immune", async () => {
        testBattleEvent(
            '|-immune|p1a: Dragonite|[from] ability: Wonder Guard|[of] p1a: Dragonite',
            {
                "type": "Immune",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                fromEffect: {
                    kind: "ability",
                    id: "wonderguard",
                },
                ofPokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("Miss", async () => {
        testBattleEvent(
            '|-miss|p1a: Dragonite|p2a: Mew',
            {
                "type": "Miss",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                target: {
                    name: "Mew",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                }
            },
        );
    });

    it("Fail", async () => {
        testBattleEvent(
            '|-fail|p1a: Dragonite|unboost|Defense|[from] ability: Big Pecks|[of] p1a: Dragonite',
            {
                "type": "Fail",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "pure",
                    id: "unboost",
                },
                fromEffect: {
                    kind: "ability",
                    id: "bigpecks",
                },
                ofPokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("Block", async () => {
        testBattleEvent(
            '|-block|p1a: Dragonite|ability: Sweet Veil|[of] p1a: Dragonite',
            {
                "type": "Block",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "ability",
                    id: "sweetveil",
                },
                ofPokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("PrepareMove", async () => {
        testBattleEvent(
            '|-prepare|p1a: Dragonite|Focus Punch',
            {
                "type": "PrepareMove",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                move: "Focus Punch",
            },
        );
    });

    it("MustRecharge", async () => {
        testBattleEvent(
            '|-mustrecharge|p1a: Dragonite',
            {
                "type": "MustRecharge",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("Status", async () => {
        testBattleEvent(
            '|-status|p1a: Dragonite|brn|[from] ability: Flame Body|[of] p2a: Volcarona',
            {
                "type": "Status",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                status: "BRN",
                fromEffect: {
                    kind: "ability",
                    id: "flamebody",
                },
                ofPokemon: {
                    name: "Volcarona",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("CureStatus", async () => {
        testBattleEvent(
            '|-curestatus|p1a: Dragonite|slp|[from] ability: Natural Cure',
            {
                "type": "CureStatus",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                status: "SLP",
                fromEffect: {
                    kind: "ability",
                    id: "naturalcure",
                },
            },
        );
    });

    it("CureTeam", async () => {
        testBattleEvent(
            '|-cureteam|p1',
            {
                "type": "CureTeam",
               playerIndex: 1,
            },
        );
    });


    it("ItemReveal", async () => {
        testBattleEvent(
            '|-item|p1a: Dragonite|Leftovers|[from] ability: Frisk|[of] p2a: Gothitelle',
            {
                "type": "ItemReveal",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                item: "Leftovers",
                fromEffect: {
                    kind: "ability",
                    id: "frisk",
                },
                ofPokemon: {
                    name: "Gothitelle",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("ItemRemove", async () => {
        testBattleEvent(
            '|-enditem|p1a: Dragonite|Oran Berry|[eat]|[from] ability: Gluttony',
            {
                "type": "ItemRemove",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                item: "Oran Berry",
                fromEffect: {
                    kind: "ability",
                    id: "gluttony",
                },
                eaten: true,
            },
        );
    });

    it("AbilityReveal", async () => {
        testBattleEvent(
            '|-ability|p1a: Dragonite|Multiscale|[from] ability: Trace|[of] p2a: Gardevoir',
            {
                "type": "AbilityReveal",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                ability: "Multiscale",
                fromEffect: {
                    kind: "ability",
                    id: "trace",
                },
                ofPokemon: {
                    name: "Gardevoir",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
                activationFailed: false,
            },
        );
    });

    it("Transform", async () => {
        testBattleEvent(
            '|-transform|p1a: Ditto|p2a: Mew|[from] ability: Imposter',
            {
                "type": "Transform",
                pokemon: {
                    name: "Ditto",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                target: {
                    name: "Mew",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
                fromEffect: {
                    kind: "ability",
                    id: "imposter",
                },
            },
        );
    });

    it("FormeChange", async () => {
        testBattleEvent(
            '|-formechange|p1a: Zygarde|Zygarde-Complete|[from] ability: Power Construct',
            {
                "type": "FormeChange",
                pokemon: {
                    name: "Zygarde",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                species: "Zygarde-Complete",
                fromEffect: {
                    kind: "ability",
                    id: "powerconstruct",
                },
            },
        );
    });

    it("MegaEvolution", async () => {
        testBattleEvent(
            '|-mega|p1a: Venusaur|Venusaur-Mega|Venusaurite',
            {
                "type": "MegaEvolution",
                pokemon: {
                    name: "Venusaur",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                species: "Venusaur-Mega",
                stone: "Venusaurite",
            },
        );
    });

    it("UltraBurst", async () => {
        testBattleEvent(
            '|-burst|p1a: Necrozma-Dawn-Wings|Necrozma-Ultra|Ultranecrozium Z',
            {
                "type": "UltraBurst",
                pokemon: {
                    name: "Necrozma-Dawn-Wings",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                species: "Necrozma-Ultra",
                item: "Ultranecrozium Z",
            },
        );
    });

    it("Terastallize", async () => {
        testBattleEvent(
            '|-terastallize|p1a: Dragonite|Normal',
            {
                "type": "Terastallize",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                teraType: "Normal"
            },
        );
    });

    it("EffectStart", async () => {
        testBattleEvent(
            '|-start|p1a: Dragonite|perish3|[from] ability: Perish Body|[of] p2a: Cursola',
            {
                "type": "EffectStart",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "pure",
                    id: "perish3",
                },
                fromEffect: {
                    kind: "ability",
                    id: "perishbody",
                },
                ofPokemon: {
                    name: "Cursola",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("EffectStart (TypeChange)", async () => {
        testBattleEvent(
            '|-start|p1a: Dragonite|typechange|Fire|[from] ability: Libero',
            {
                "type": "EffectStart",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "pure",
                    id: "typechange",
                },
                fromEffect: {
                    kind: "ability",
                    id: "libero",
                },
                extraData: {
                    typesChanged: ["Fire"],
                },
            },
        );
    });

    it("EffectStart (TypeAdd)", async () => {
        testBattleEvent(
            '|-start|p1a: Dragonite|typeadd|Grass|[from] move: Forest\'s Curse|[of] p2a: Mew',
            {
                "type": "EffectStart",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "pure",
                    id: "typeadd",
                },
                fromEffect: {
                    kind: "move",
                    id: "forestscurse",
                },
                ofPokemon: {
                    name: "Mew",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
                extraData: {
                    typeAdded: "Grass",
                },
            },
        );
    });

    it("EffectStart (Disable)", async () => {
        testBattleEvent(
            '|-start|p1a: Dragonite|disable|Extreme Speed',
            {
                "type": "EffectStart",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "pure",
                    id: "disable",
                },
                extraData: {
                    moveDisabled: "Extreme Speed",
                },
            },
        );
    });

    it("EffectStart (Mimic)", async () => {
        testBattleEvent(
            '|-start|p1a: Dragonite|mimic|Extreme Speed',
            {
                "type": "EffectStart",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "pure",
                    id: "mimic",
                },
                extraData: {
                    moveMimic: "Extreme Speed",
                },
            },
        );
    });

    it("EffectEnd", async () => {
        testBattleEvent(
            '|-end|p1a: Dragonite|move: Substitute',
            {
                "type": "EffectEnd",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "move",
                    id: "substitute",
                },
            },
        );
    });

    it("TurnStatus", async () => {
        testBattleEvent(
            '|-singleturn|p1a: Dragonite|move: Roost',
            {
                "type": "TurnStatus",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "move",
                    id: "roost",
                },
            },
        );
    });

    it("MoveStatus", async () => {
        testBattleEvent(
            '|-singlemove|p1a: Dragonite|move: Destiny Bond',
            {
                "type": "MoveStatus",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "move",
                    id: "destinybond",
                },
            },
        );
    });

    it("ActivateEffect (Item)", async () => {
        testBattleEvent(
            '|-activate|p1a: Dragonite|move: Poltergeist|[item] Leftovers',
            {
                "type": "ActivateEffect",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "move",
                    id: "poltergeist",
                },
                extraData: {
                    item: "Leftovers",
                },
            },
        );
    });

    it("ActivateEffect (Skill Swap)", async () => {
        testBattleEvent(
            '|-activate|p1a: Dragonite|move: Skill Swap|p2a: Mew|[ability] Synchronize|[ability2] Multiscale',
            {
                "type": "ActivateEffect",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                target: {
                    name: "Mew",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "move",
                    id: "skillswap",
                },
                extraData: {
                    ability: "Synchronize",
                    ability2: "Multiscale",
                },
            },
        );
    });

    it("ActivateEffect (Spite)", async () => {
        testBattleEvent(
            '|-activate|p1a: Dragonite|move: Spite|p2a: Mew|[number] 4',
            {
                "type": "ActivateEffect",
                pokemon: {
                    name: "Dragonite",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
                target: {
                    name: "Mew",
                    playerIndex: 2,
                    active: true,
                    slot: 0,
                },
                effect: {
                    kind: "move",
                    id: "spite",
                },
                extraData: {
                    number: 4,
                },
            },
        );
    });

    it("SideStart", async () => {
        testBattleEvent(
            '|-sidestart|p1|move: Spikes',
            {
                "type": "SideStart",
                playerIndex: 1,
                effect: {
                    kind: "move",
                    id: "spikes",
                },
                persistent: false,
            },
        );
    });

    it("SideStart", async () => {
        testBattleEvent(
            '|-sidestart|p1|move: Spikes',
            {
                "type": "SideStart",
                playerIndex: 1,
                effect: {
                    kind: "move",
                    id: "spikes",
                },
                persistent: false,
            },
        );
    });

    it("SideEnd", async () => {
        testBattleEvent(
            '|-sideend|p1|move: Reflect',
            {
                "type": "SideEnd",
                playerIndex: 1,
                effect: {
                    kind: "move",
                    id: "reflect",
                },
            },
        );
    });

    it("SwapSideConditions", async () => {
        testBattleEvent(
            '|-swapsideconditions',
            {
                "type": "SwapSideConditions",
            },
        );
    });

    it("Weather", async () => {
        testBattleEvent(
            '|-weather|RainDance|[from] ability: Drizzle|[of] p1a: Pelipper',
            {
                "type": "Weather",
                effect: {
                    kind: "pure",
                    id: "raindance"
                },
                fromEffect: {
                    kind: "ability",
                    id: "drizzle",
                },
                ofPokemon: {
                    name: "Pelipper",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("FieldStart", async () => {
        testBattleEvent(
            '|-fieldstart|Electric Terrain|[from] ability: Electric Surge|[of] p1a: Tapu Koko',
            {
                "type": "FieldStart",
                effect: {
                    kind: "pure",
                    id: "electricterrain"
                },
                persistent: false,
                fromEffect: {
                    kind: "ability",
                    id: "electricsurge",
                },
                ofPokemon: {
                    name: "Tapu Koko",
                    playerIndex: 1,
                    active: true,
                    slot: 0,
                },
            },
        );
    });

    it("FieldEnd", async () => {
        testBattleEvent(
            '|-fieldend|Electric Terrain',
            {
                "type": "FieldEnd",
                effect: {
                    kind: "pure",
                    id: "electricterrain"
                },
            },
        );
    });
});