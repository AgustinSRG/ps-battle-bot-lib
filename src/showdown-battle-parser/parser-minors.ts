// Minor events

"use strict";

import { VolatileStatuses } from "../battle-data";
import { BattleEventMinor } from "../battle-data/battle-event-minor";
import { PokemonStatus } from "../battle-data/condition";
import { StatName } from "../battle-data/stats";
import { getHPPercent, parseCondition, parseEffect, parsePlayerIndex, parsePokemonIdent } from "./parser-utils";

type ParserFuncMinor = (args: string[], knowledgeArgs: Map<string, string>) => BattleEventMinor | null;

export const ProtocolParserMap_Minor: { [msgType: string]: ParserFuncMinor } = {
    "-damage": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "Damage",
            pokemon: parsePokemonIdent(args[0] || ""),
            condition: parseCondition(args[1] || ""),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },

    "-heal": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "Heal",
            pokemon: parsePokemonIdent(args[0] || ""),
            condition: parseCondition(args[1] || ""),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },

    "-sethp": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "SetHP",
            targets: [],
        };

        for (let i = 0; i < args.length; i += 2) {
            if (i === args.length - 1) {
                break;
            }

            res.targets.push({
                pokemon: parsePokemonIdent(args[i] || ""),
                condition: parseCondition(args[i + 1] || ""),
            });
        }

        return res;
    },


    "-boost": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "Boost",
            pokemon: parsePokemonIdent(args[0] || ""),
            stat: (args[1] || "") as StatName,
            amount: parseInt(args[2], 10) || 0,
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },


    "-unboost": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "UnBoost",
            pokemon: parsePokemonIdent(args[0] || ""),
            stat: (args[1] || "") as StatName,
            amount: parseInt(args[2], 10) || 0,
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },


    "-setboost": args => {
        const res: BattleEventMinor = {
            type: "SetBoost",
            pokemon: parsePokemonIdent(args[0] || ""),
            stat: (args[1] || "") as StatName,
            amount: parseInt(args[2], 10) || 0,
        };

        return res;
    },


    "-swapboost": args => {
        const res: BattleEventMinor = {
            type: "SwapBoost",
            pokemon: parsePokemonIdent(args[0] || ""),
            target: parsePokemonIdent(args[1] || ""),
            stats: args[2] ? (args[2].split(',').map(a => {
                return a.trim().toLowerCase() as StatName;
            })) : ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'],
        };

        return res;
    },


    "-clearpositiveboost": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "ClearPositiveBoost",
            pokemon: parsePokemonIdent(args[0] || ""),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },


    "-clearnegativeboost": args => {
        const res: BattleEventMinor = {
            type: "ClearNegativeBoost",
            pokemon: parsePokemonIdent(args[0] || ""),
        };

        return res;
    },


    "-copyboost": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "CopyBoost",
            pokemon: parsePokemonIdent(args[0] || ""),
            fromPokemon: parsePokemonIdent(args[1] || ""),
            stats: args[2] ? (args[2].split(',').map(a => {
                return a.trim().toLowerCase() as StatName;
            })) : ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'],
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        return res;
    },


    "-clearboost": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "ClearBoost",
            pokemon: parsePokemonIdent(args[0] || ""),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },

    "-invertboost": args => {
        const res: BattleEventMinor = {
            type: "InvertBoost",
            pokemon: parsePokemonIdent(args[0] || ""),
        };

        return res;
    },

    "-clearallboost": () => {
        const res: BattleEventMinor = {
            type: "ClearAllBoosts",
        };

        return res;
    },


    "-crit": args => {
        const res: BattleEventMinor = {
            type: "CriticalHit",
            pokemon: parsePokemonIdent(args[0] || ""),
        };

        return res;
    },


    "-supereffective": args => {
        const res: BattleEventMinor = {
            type: "SuperEffectiveHit",
            pokemon: parsePokemonIdent(args[0] || ""),
        };

        return res;
    },


    "-resisted": args => {
        const res: BattleEventMinor = {
            type: "ResistedHit",
            pokemon: parsePokemonIdent(args[0] || ""),
        };

        return res;
    },


    "-immune": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "Immune",
            pokemon: parsePokemonIdent(args[0] || ""),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },

    "-miss": args => {
        const res: BattleEventMinor = {
            type: "Miss",
            pokemon: parsePokemonIdent(args[0] || ""),
            target: parsePokemonIdent(args[1] || ""),
        };

        return res;
    },

    "-fail": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "Fail",
            pokemon: parsePokemonIdent(args[0] || ""),
        };

        if (args[1]) {
            res.effect = parseEffect(args[1]);
        }

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },

    "-block": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "Block",
            pokemon: parsePokemonIdent(args[0] || ""),
        };

        if (args[1]) {
            res.effect = parseEffect(args[1]);
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },

    "-prepare": args => {
        const res: BattleEventMinor = {
            type: "PrepareMove",
            pokemon: parsePokemonIdent(args[0] || ""),
            move: args[1] || "",
        };

        if (args[2]) {
            res.target = parsePokemonIdent(args[2]);
        }

        return res;
    },

    "-mustrecharge": args => {
        const res: BattleEventMinor = {
            type: "MustRecharge",
            pokemon: parsePokemonIdent(args[0] || ""),
        };

        return res;
    },

    "-status": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "Status",
            pokemon: parsePokemonIdent(args[0] || ""),
            status: (args[1] || "").toUpperCase() as PokemonStatus,
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },

    "-curestatus": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "CureStatus",
            pokemon: parsePokemonIdent(args[0] || ""),
            status: (args[1] || "").toUpperCase() as PokemonStatus,
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        return res;
    },

    "-cureteam": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "CureTeam",
            playerIndex: parsePlayerIndex(args[0] || ""),
        };

        return res;
    },

    "-item": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "ItemReveal",
            pokemon: parsePokemonIdent(args[0] || ""),
            item: args[1] || "",
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },

    "-enditem": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "ItemRemove",
            pokemon: parsePokemonIdent(args[0] || ""),
            item: args[1] || "",
            eaten: kArgs.has("eat") || kArgs.has("weaken"),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        return res;
    },

    "-ability": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "AbilityReveal",
            pokemon: parsePokemonIdent(args[0] || ""),
            ability: args[1] || "",
            activationFailed: kArgs.has("fail"),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },

    "-transform": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "Transform",
            pokemon: parsePokemonIdent(args[0] || ""),
            target: parsePokemonIdent(args[1] || ""),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        return res;
    },


    "-formechange": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "FormeChange",
            pokemon: parsePokemonIdent(args[0] || ""),
            species: args[1] || "",
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        return res;
    },


    "-mega": args => {
        const res: BattleEventMinor = {
            type: "MegaEvolution",
            pokemon: parsePokemonIdent(args[0] || ""),
            species: args[1] || "",
            stone: args[2] || "",
        };

        return res;
    },

    "-burst": args => {
        const res: BattleEventMinor = {
            type: "UltraBurst",
            pokemon: parsePokemonIdent(args[0] || ""),
            species: args[1] || "",
            item: args[2] || "",
        };

        return res;
    },

    "-terastallize": args => {
        const res: BattleEventMinor = {
            type: "Terastallize",
            pokemon: parsePokemonIdent(args[0] || ""),
            teraType: args[1] || "",
        };

        return res;
    },


    "-endability": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "EffectStart",
            pokemon: parsePokemonIdent(args[0] || ""),
            effect: {
                kind: "pure",
                id: VolatileStatuses.GastroAcid,
            }
        };

        return res;
    },


    "-start": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "EffectStart",
            pokemon: parsePokemonIdent(args[0] || ""),
            effect: parseEffect(args[1] || ""),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        switch (res.effect.id) {
            case 'typechange':
                if (args[2]) {
                    res.extraData = {
                        typesChanged: args[2].split("/"),
                    };
                }
                break;
            case 'typeadd':
                if (args[2]) {
                    res.extraData = {
                        typeAdded: args[2],
                    };
                }
                break;
            case 'disable':
                if (args[2]) {
                    res.extraData = {
                        moveDisabled: args[2],
                    };
                }
                break;
            case 'mimic':
                if (args[2]) {
                    res.extraData = {
                        moveMimic: args[2],
                    };
                }
                break;
        }

        return res;
    },


    "-end": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "EffectEnd",
            pokemon: parsePokemonIdent(args[0] || ""),
            effect: parseEffect(args[1] || ""),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        return res;
    },

    "-singleturn": args => {
        const res: BattleEventMinor = {
            type: "TurnStatus",
            pokemon: parsePokemonIdent(args[0] || ""),
            effect: parseEffect(args[1] || ""),
        };

        return res;
    },

    "-singlemove": args => {
        const res: BattleEventMinor = {
            type: "MoveStatus",
            pokemon: parsePokemonIdent(args[0] || ""),
            effect: parseEffect(args[1] || ""),
        };

        return res;
    },

    "-activate": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "ActivateEffect",
            pokemon: parsePokemonIdent(args[0] || ""),
            effect: parseEffect(args[1] || ""),
        };

        if (args[2]) {
            res.target = parsePokemonIdent(args[2] || "");
        }

        if (kArgs.has("item") || kArgs.has("move") || kArgs.has("ability") || kArgs.has("ability2") || kArgs.has("number")) {
            res.extraData = {};

            if (kArgs.has("item")) {
                res.extraData.item = kArgs.get("item");
            }

            if (kArgs.has("move")) {
                res.extraData.move = kArgs.get("move");
            }

            if (kArgs.has("ability")) {
                res.extraData.ability = kArgs.get("ability");
            }

            if (kArgs.has("ability2")) {
                res.extraData.ability2 = kArgs.get("ability2");
            }

            if (kArgs.has("number")) {
                res.extraData.number = parseInt(kArgs.get("number"), 10) || 0;
            }
        }

        return res;
    },

    "-sidestart": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "SideStart",
            playerIndex: parsePlayerIndex(args[0] || ""),
            effect: parseEffect(args[1] || ""),
            persistent: kArgs.has("persistent"),
        };

        return res;
    },

    "-sideend": args => {
        const res: BattleEventMinor = {
            type: "SideEnd",
            playerIndex: parsePlayerIndex(args[0] || ""),
            effect: parseEffect(args[1] || ""),
        };

        return res;
    },

    "-swapsideconditions": () => {
        const res: BattleEventMinor = {
            type: "SwapSideConditions",
        };

        return res;
    },


    "-weather": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "Weather",
            effect: parseEffect(args[0] || ""),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },


    "-fieldstart": (args, kArgs) => {
        const res: BattleEventMinor = {
            type: "FieldStart",
            effect: parseEffect(args[0] || ""),
            persistent: kArgs.has("persistent"),
        };

        if (kArgs.has("from")) {
            res.fromEffect = parseEffect(kArgs.get("from"));
        }

        if (kArgs.has("of")) {
            res.ofPokemon = parsePokemonIdent(kArgs.get("of"));
        }

        return res;
    },


    "-fieldend": args => {
        const res: BattleEventMinor = {
            type: "FieldEnd",
            effect: parseEffect(args[0] || ""),
        };

        return res;
    },
};