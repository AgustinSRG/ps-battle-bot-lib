// Battle events parsing test

"use strict";

import { BattleEventMajor, BattleEventMajorSchema } from "../src/battle-data/battle-event-major";
import { parsePokemonShowdownBattleEvent } from "../src/showdown-battle-parser";

import { expect } from 'chai';

function testBattleEvent(line: string, ev: BattleEventMajor) {
    // Check parser
    const parsed = parsePokemonShowdownBattleEvent(line);
    expect(parsed).to.deep.equal(ev);

    // Check sanitizer
    expect(BattleEventMajorSchema.sanitize(parsed)).to.deep.equal(parsed);
    expect(BattleEventMajorSchema.sanitize(ev)).to.deep.equal(ev);
}

describe("Battle events parsing test (Major events)", () => {
    it("GameType", async () => {
        testBattleEvent(
            '|gametype|singles',
            {
                "type": "GameType",
                "gameType": "singles"
            },
        );
    });

    it("Player", async () => {
        testBattleEvent(
            '|player|p1|nlp|1|',
            {
                "type": "Player",
                "playerIndex": 1,
                "playerName": "nlp",
                "playerAvatar": "1"
            },
        );
    });

    it("TeamPreview", async () => {
        testBattleEvent(
            '|teampreview',
            {
                "type": "TeamPreview",
            },
        );
    });

    it("TeamPreview (Size)", async () => {
        testBattleEvent(
            '|teampreview|3',
            {
                "type": "TeamPreview",
                maxTeamSize: 3,
            },
        );
    });

    it("Start", async () => {
        testBattleEvent(
            '|start',
            {
                "type": "Start",
            },
        );
    });

    it("CallbackTrapped", async () => {
        testBattleEvent(
            '|callback|trapped|p1a: Pikachu',
            {
                "type": "CallbackTrapped",
                slot: 0,
            },
        );
    });

    it("CallbackCannotUseMove", async () => {
        testBattleEvent(
            '|callback|cant|p1a: Pikachu|imprison|taunt',
            {
                "type": "CallbackCannotUseMove",
                slot: 0,
                move: "taunt"
            },
        );
    });

    it("Gen", async () => {
        testBattleEvent(
            '|gen|9',
            {
                "type": "Gen",
                gen: 9,
            },
        );
    });

    it("Tier", async () => {
        testBattleEvent(
            '|tier|[Gen 9] OU',
            {
                "type": "Tier",
                tier: "[Gen 9] OU",
            },
        );
    });

    it("Rule", async () => {
        testBattleEvent(
            '|rule|Sleep Clause Mod: Limit one foe put to sleep',
            {
                "type": "Rule",
                "name": "Sleep Clause Mod",
                "description": "Limit one foe put to sleep"
            },
        );
    });

    it("TeamSize", async () => {
        testBattleEvent(
            '|teamsize|p1|6',
            {
                "type": "TeamSize",
                playerIndex: 1,
                teamSize: 6,
            },
        );
    });

    it("ClearPokemon", async () => {
        testBattleEvent(
            '|clearpoke',
            {
                "type": "ClearPokemon",
            },
        );
    });

    it("RevealTeamPreviewPokemon", async () => {
        testBattleEvent(
            '|poke|p1|Corviknight, F|',
            {
                "type": "RevealTeamPreviewPokemon",
                "playerIndex": 1,
                "details": {
                    "species": "corviknight",
                    "level": 100,
                    "shiny": false,
                    "gender": "F",
                    "terastallized": ""
                }
            },
        );
    });

    it("Turn", async () => {
        testBattleEvent(
            '|turn|1',
            {
                "type": "Turn",
                turn: 1,
            },
        );
    });

    it("Switch", async () => {
        testBattleEvent(
            '|switch|p1a: Corviknight|Corviknight, F|399/399',
            {
                "type": "Switch",
                "pokemon": {
                    "name": "Corviknight",
                    "playerIndex": 1,
                    "active": true,
                    "slot": 0
                },
                "details": {
                    "species": "corviknight",
                    "level": 100,
                    "shiny": false,
                    "gender": "F",
                    "terastallized": ""
                },
                "condition": {
                    "hp": 399,
                    "maxHP": 399,
                    "status": "",
                    "fainted": false
                }
            },
        );
    });


    it("Drag", async () => {
        testBattleEvent(
            '|drag|p1a: Corviknight|Corviknight, F|399/399',
            {
                "type": "Drag",
                "pokemon": {
                    "name": "Corviknight",
                    "playerIndex": 1,
                    "active": true,
                    "slot": 0
                },
                "details": {
                    "species": "corviknight",
                    "level": 100,
                    "shiny": false,
                    "gender": "F",
                    "terastallized": ""
                },
                "condition": {
                    "hp": 399,
                    "maxHP": 399,
                    "status": "",
                    "fainted": false
                }
            },
        );
    });


    it("Replace", async () => {
        testBattleEvent(
            '|replace|p2a: Zoroark|Zoroark-Hisui, F',
            {
                "type": "Replace",
                "pokemon": {
                    "name": "Zoroark",
                    "playerIndex": 2,
                    "active": true,
                    "slot": 0
                },
                "details": {
                    "species": "zoroarkhisui",
                    "level": 100,
                    "shiny": false,
                    "gender": "F",
                    "terastallized": ""
                },
            },
        );
    });


    it("DetailsChange", async () => {
        testBattleEvent(
            '|detailschange|p1a: Manectric|Manectric-Mega, M',
            {
                "type": "DetailsChange",
                "pokemon": {
                    "name": "Manectric",
                    "playerIndex": 1,
                    "active": true,
                    "slot": 0
                },
                "details": {
                    "species": "manectricmega",
                    "level": 100,
                    "shiny": false,
                    "gender": "M",
                    "terastallized": ""
                },
            },
        );
    });

    it("Faint", async () => {
        testBattleEvent(
            '|faint|p2a: Zoroark',
            {
                "type": "Faint",
                "pokemon": {
                    "name": "Zoroark",
                    "playerIndex": 2,
                    "active": true,
                    "slot": 0
                }
            },
        );
    });


    it("Swap", async () => {
        testBattleEvent(
            '|swap|p1a: Mew|p1b: Dragonite',
            {
                "type": "Swap",
                "pokemon": {
                    "name": "Mew",
                    "playerIndex": 1,
                    "active": true,
                    "slot": 0
                },
                slot: 1,
            },
        );
    });


    it("Move (Basic)", async () => {
        testBattleEvent(
            '|move|p1a: Ting-Lu|Ruination|p2a: Dragonite',
            {
                "type": "Move",
                "pokemon": {
                    "name": "Ting-Lu",
                    "playerIndex": 1,
                    "active": true,
                    "slot": 0
                },
                "move": "Ruination",
                "target": {
                    "name": "Dragonite",
                    "playerIndex": 2,
                    "active": true,
                    "slot": 0
                },
            },
        );
    });

    it("Move (Bounced)", async () => {
        testBattleEvent(
            '|move|p1a: Espeon|Spikes|p2a: Ting-Lu|[from] ability: Magic Bounce',
            {
                "type": "Move",
                "pokemon": {
                    "name": "Espeon",
                    "playerIndex": 1,
                    "active": true,
                    "slot": 0
                },
                "move": "Spikes",
                "target": {
                    "name": "Ting-Lu",
                    "playerIndex": 2,
                    "active": true,
                    "slot": 0
                },
                fromEffect: {
                    kind: "ability",
                    id: "magicbounce",
                },
            },
        );
    });


    it("Move (Spread)", async () => {
        testBattleEvent(
            '|move|p1a: Kyogre|Water Spout|p2a: Ting-Lu|[spread] p2b: Dragonite',
            {
                "type": "Move",
                "pokemon": {
                    "name": "Kyogre",
                    "playerIndex": 1,
                    "active": true,
                    "slot": 0
                },
                "move": "Water Spout",
                "target": {
                    "name": "Ting-Lu",
                    "playerIndex": 2,
                    "active": true,
                    "slot": 0
                },
                spread: [
                    {
                        "name": "Dragonite",
                        "playerIndex": 2,
                        "active": true,
                        "slot": 1
                    }
                ],
            },
        );
    });


    it("MoveCannotUse", async () => {
        testBattleEvent(
            '|cant|p1a: Ting-Lu|move: Taunt|Spikes',
            {
                "type": "MoveCannotUse",
                "pokemon": {
                    "name": "Ting-Lu",
                    "playerIndex": 1,
                    "active": true,
                    "slot": 0
                },
                "move": "Spikes",
                effect: {
                    kind: "move",
                    id: "taunt",
                },
            },
        );
    });

    it("Win", async () => {
        testBattleEvent(
            '|win|Player 1',
            {
                "type": "BattleEnded",
                "tie": false,
                winner: "Player 1",
            },
        );
    });

    it("Tie", async () => {
        testBattleEvent(
            '|tie',
            {
                "type": "BattleEnded",
                "tie": true,
            },
        );
    });

    it("Request (Preview)", async () => {
        testBattleEvent(
            '|request|{"teamPreview":true,"side":{"name":"nlp","id":"p1","pokemon":[{"ident":"p1: Ting-Lu","details":"Ting-Lu","condition":"514/514","active":true,"stats":{"atk":257,"def":383,"spa":146,"spd":196,"spe":113},"moves":["spikes","whirlwind","earthquake","ruination"],"baseAbility":"vesselofruin","item":"leftovers","pokeball":"pokeball","ability":"vesselofruin","commanding":false,"reviving":false,"teraType":"Ground","terastallized":""},{"ident":"p1: Corviknight","details":"Corviknight, F","condition":"399/399","active":false,"stats":{"atk":212,"def":339,"spa":127,"spd":206,"spe":170},"moves":["bravebird","roost","defog","uturn"],"baseAbility":"pressure","item":"rockyhelmet","pokeball":"pokeball","ability":"pressure","commanding":false,"reviving":false,"teraType":"Flying","terastallized":""},{"ident":"p1: Gholdengo","details":"Gholdengo","condition":"378/378","active":false,"stats":{"atk":112,"def":226,"spa":401,"spd":219,"spe":204},"moves":["nastyplot","recover","makeitrain","shadowball"],"baseAbility":"goodasgold","item":"airballoon","pokeball":"pokeball","ability":"goodasgold","commanding":false,"reviving":false,"teraType":"Steel","terastallized":""},{"ident":"p1: Tyranitar","details":"Tyranitar, F","condition":"404/404","active":false,"stats":{"atk":304,"def":257,"spa":203,"spd":328,"spe":158},"moves":["stealthrock","rockblast","earthquake","thunderwave"],"baseAbility":"sandstream","item":"heavydutyboots","pokeball":"pokeball","ability":"sandstream","commanding":false,"reviving":false,"teraType":"Fairy","terastallized":""},{"ident":"p1: Dondozo","details":"Dondozo, M","condition":"503/503","active":false,"stats":{"atk":238,"def":361,"spa":149,"spd":166,"spe":106},"moves":["curse","rest","liquidation","bodypress"],"baseAbility":"unaware","item":"chestoberry","pokeball":"pokeball","ability":"unaware","commanding":false,"reviving":false,"teraType":"Fighting","terastallized":""},{"ident":"p1: Clodsire","details":"Clodsire, F","condition":"464/464","active":false,"stats":{"atk":187,"def":156,"spa":113,"spd":328,"spe":76},"moves":["toxic","recover","earthquake","bodypress"],"baseAbility":"unaware","item":"leftovers","pokeball":"pokeball","ability":"unaware","commanding":false,"reviving":false,"teraType":"Water","terastallized":""}]},"rqid":2}',
            {
                "type": "Request",
                "request": {
                    "id": 2,
                    "side": {
                        "name": "nlp",
                        "playerIndex": 1,
                        "pokemon": [
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Ting-Lu"
                                },
                                "details": {
                                    "species": "tinglu",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "N",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 514,
                                    "maxHP": 514,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": true,
                                "stats": {
                                    "atk": 257,
                                    "def": 383,
                                    "spa": 146,
                                    "spd": 196,
                                    "spe": 113
                                },
                                "moves": [
                                    "spikes",
                                    "whirlwind",
                                    "earthquake",
                                    "ruination"
                                ],
                                "item": "leftovers",
                                "ball": "pokeball",
                                "ability": "vesselofruin",
                                "baseAbility": "vesselofruin",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Ground",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Corviknight"
                                },
                                "details": {
                                    "species": "corviknight",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "F",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 399,
                                    "maxHP": 399,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 212,
                                    "def": 339,
                                    "spa": 127,
                                    "spd": 206,
                                    "spe": 170
                                },
                                "moves": [
                                    "bravebird",
                                    "roost",
                                    "defog",
                                    "uturn"
                                ],
                                "item": "rockyhelmet",
                                "ball": "pokeball",
                                "ability": "pressure",
                                "baseAbility": "pressure",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Flying",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Gholdengo"
                                },
                                "details": {
                                    "species": "gholdengo",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "N",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 378,
                                    "maxHP": 378,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 112,
                                    "def": 226,
                                    "spa": 401,
                                    "spd": 219,
                                    "spe": 204
                                },
                                "moves": [
                                    "nastyplot",
                                    "recover",
                                    "makeitrain",
                                    "shadowball"
                                ],
                                "item": "airballoon",
                                "ball": "pokeball",
                                "ability": "goodasgold",
                                "baseAbility": "goodasgold",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Steel",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Tyranitar"
                                },
                                "details": {
                                    "species": "tyranitar",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "F",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 404,
                                    "maxHP": 404,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 304,
                                    "def": 257,
                                    "spa": 203,
                                    "spd": 328,
                                    "spe": 158
                                },
                                "moves": [
                                    "stealthrock",
                                    "rockblast",
                                    "earthquake",
                                    "thunderwave"
                                ],
                                "item": "heavydutyboots",
                                "ball": "pokeball",
                                "ability": "sandstream",
                                "baseAbility": "sandstream",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Fairy",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Dondozo"
                                },
                                "details": {
                                    "species": "dondozo",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "M",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 503,
                                    "maxHP": 503,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 238,
                                    "def": 361,
                                    "spa": 149,
                                    "spd": 166,
                                    "spe": 106
                                },
                                "moves": [
                                    "curse",
                                    "rest",
                                    "liquidation",
                                    "bodypress"
                                ],
                                "item": "chestoberry",
                                "ball": "pokeball",
                                "ability": "unaware",
                                "baseAbility": "unaware",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Fighting",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Clodsire"
                                },
                                "details": {
                                    "species": "clodsire",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "F",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 464,
                                    "maxHP": 464,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 187,
                                    "def": 156,
                                    "spa": 113,
                                    "spd": 328,
                                    "spe": 76
                                },
                                "moves": [
                                    "toxic",
                                    "recover",
                                    "earthquake",
                                    "bodypress"
                                ],
                                "item": "leftovers",
                                "ball": "pokeball",
                                "ability": "unaware",
                                "baseAbility": "unaware",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Water",
                                "terastallized": ""
                            }
                        ]
                    },
                    "teamPreview": true
                }
            },
        );
    });


    it("Request (Active)", async () => {
        testBattleEvent(
            '|request|{"active":[{"moves":[{"move":"Brave Bird","id":"bravebird","pp":24,"maxpp":24,"target":"any","disabled":false},{"move":"Roost","id":"roost","pp":8,"maxpp":8,"target":"self","disabled":false},{"move":"Defog","id":"defog","pp":24,"maxpp":24,"target":"normal","disabled":false},{"move":"U-turn","id":"uturn","pp":32,"maxpp":32,"target":"normal","disabled":false}],"canTerastallize":"Flying"}],"side":{"name":"nlp","id":"p1","pokemon":[{"ident":"p1: Corviknight","details":"Corviknight, F","condition":"399/399","active":true,"stats":{"atk":212,"def":339,"spa":127,"spd":206,"spe":170},"moves":["bravebird","roost","defog","uturn"],"baseAbility":"pressure","item":"rockyhelmet","pokeball":"pokeball","ability":"pressure","commanding":false,"reviving":false,"teraType":"Flying","terastallized":""},{"ident":"p1: Ting-Lu","details":"Ting-Lu","condition":"514/514","active":false,"stats":{"atk":257,"def":383,"spa":146,"spd":196,"spe":113},"moves":["spikes","whirlwind","earthquake","ruination"],"baseAbility":"vesselofruin","item":"leftovers","pokeball":"pokeball","ability":"vesselofruin","commanding":false,"reviving":false,"teraType":"Ground","terastallized":""},{"ident":"p1: Gholdengo","details":"Gholdengo","condition":"378/378","active":false,"stats":{"atk":112,"def":226,"spa":401,"spd":219,"spe":204},"moves":["nastyplot","recover","makeitrain","shadowball"],"baseAbility":"goodasgold","item":"airballoon","pokeball":"pokeball","ability":"goodasgold","commanding":false,"reviving":false,"teraType":"Steel","terastallized":""},{"ident":"p1: Tyranitar","details":"Tyranitar, F","condition":"404/404","active":false,"stats":{"atk":304,"def":257,"spa":203,"spd":328,"spe":158},"moves":["stealthrock","rockblast","earthquake","thunderwave"],"baseAbility":"sandstream","item":"heavydutyboots","pokeball":"pokeball","ability":"sandstream","commanding":false,"reviving":false,"teraType":"Fairy","terastallized":""},{"ident":"p1: Dondozo","details":"Dondozo, M","condition":"503/503","active":false,"stats":{"atk":238,"def":361,"spa":149,"spd":166,"spe":106},"moves":["curse","rest","liquidation","bodypress"],"baseAbility":"unaware","item":"chestoberry","pokeball":"pokeball","ability":"unaware","commanding":false,"reviving":false,"teraType":"Fighting","terastallized":""},{"ident":"p1: Clodsire","details":"Clodsire, F","condition":"464/464","active":false,"stats":{"atk":187,"def":156,"spa":113,"spd":328,"spe":76},"moves":["toxic","recover","earthquake","bodypress"],"baseAbility":"unaware","item":"leftovers","pokeball":"pokeball","ability":"unaware","commanding":false,"reviving":false,"teraType":"Water","terastallized":""}]},"rqid":4}',
            {
                "type": "Request",
                "request": {
                    "id": 4,
                    "side": {
                        "name": "nlp",
                        "playerIndex": 1,
                        "pokemon": [
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Corviknight"
                                },
                                "details": {
                                    "species": "corviknight",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "F",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 399,
                                    "maxHP": 399,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": true,
                                "stats": {
                                    "atk": 212,
                                    "def": 339,
                                    "spa": 127,
                                    "spd": 206,
                                    "spe": 170
                                },
                                "moves": [
                                    "bravebird",
                                    "roost",
                                    "defog",
                                    "uturn"
                                ],
                                "item": "rockyhelmet",
                                "ball": "pokeball",
                                "ability": "pressure",
                                "baseAbility": "pressure",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Flying",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Ting-Lu"
                                },
                                "details": {
                                    "species": "tinglu",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "N",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 514,
                                    "maxHP": 514,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 257,
                                    "def": 383,
                                    "spa": 146,
                                    "spd": 196,
                                    "spe": 113
                                },
                                "moves": [
                                    "spikes",
                                    "whirlwind",
                                    "earthquake",
                                    "ruination"
                                ],
                                "item": "leftovers",
                                "ball": "pokeball",
                                "ability": "vesselofruin",
                                "baseAbility": "vesselofruin",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Ground",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Gholdengo"
                                },
                                "details": {
                                    "species": "gholdengo",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "N",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 378,
                                    "maxHP": 378,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 112,
                                    "def": 226,
                                    "spa": 401,
                                    "spd": 219,
                                    "spe": 204
                                },
                                "moves": [
                                    "nastyplot",
                                    "recover",
                                    "makeitrain",
                                    "shadowball"
                                ],
                                "item": "airballoon",
                                "ball": "pokeball",
                                "ability": "goodasgold",
                                "baseAbility": "goodasgold",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Steel",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Tyranitar"
                                },
                                "details": {
                                    "species": "tyranitar",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "F",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 404,
                                    "maxHP": 404,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 304,
                                    "def": 257,
                                    "spa": 203,
                                    "spd": 328,
                                    "spe": 158
                                },
                                "moves": [
                                    "stealthrock",
                                    "rockblast",
                                    "earthquake",
                                    "thunderwave"
                                ],
                                "item": "heavydutyboots",
                                "ball": "pokeball",
                                "ability": "sandstream",
                                "baseAbility": "sandstream",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Fairy",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Dondozo"
                                },
                                "details": {
                                    "species": "dondozo",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "M",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 503,
                                    "maxHP": 503,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 238,
                                    "def": 361,
                                    "spa": 149,
                                    "spd": 166,
                                    "spe": 106
                                },
                                "moves": [
                                    "curse",
                                    "rest",
                                    "liquidation",
                                    "bodypress"
                                ],
                                "item": "chestoberry",
                                "ball": "pokeball",
                                "ability": "unaware",
                                "baseAbility": "unaware",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Fighting",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Clodsire"
                                },
                                "details": {
                                    "species": "clodsire",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "F",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 464,
                                    "maxHP": 464,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 187,
                                    "def": 156,
                                    "spa": 113,
                                    "spd": 328,
                                    "spe": 76
                                },
                                "moves": [
                                    "toxic",
                                    "recover",
                                    "earthquake",
                                    "bodypress"
                                ],
                                "item": "leftovers",
                                "ball": "pokeball",
                                "ability": "unaware",
                                "baseAbility": "unaware",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Water",
                                "terastallized": ""
                            }
                        ]
                    },
                    "active": [
                        {
                            "moves": [
                                {
                                    "id": "bravebird",
                                    "pp": 24,
                                    "maxPP": 24,
                                    "target": "any",
                                    "disabled": false
                                },
                                {
                                    "id": "roost",
                                    "pp": 8,
                                    "maxPP": 8,
                                    "target": "self",
                                    "disabled": false
                                },
                                {
                                    "id": "defog",
                                    "pp": 24,
                                    "maxPP": 24,
                                    "target": "normal",
                                    "disabled": false
                                },
                                {
                                    "id": "uturn",
                                    "pp": 32,
                                    "maxPP": 32,
                                    "target": "normal",
                                    "disabled": false
                                }
                            ],
                            "canTerastallize": "Flying",
                        }
                    ]
                }
            },
        );
    });


    it("Request (Force Switch)", async () => {
        testBattleEvent(
            '|request|{"forceSwitch":[true],"side":{"name":"nlp","id":"p1","pokemon":[{"ident":"p1: Corviknight","details":"Corviknight, F","condition":"399/399","active":true,"stats":{"atk":212,"def":339,"spa":127,"spd":206,"spe":170},"moves":["bravebird","roost","defog","uturn"],"baseAbility":"pressure","item":"rockyhelmet","pokeball":"pokeball","ability":"pressure","commanding":false,"reviving":false,"teraType":"Flying","terastallized":""},{"ident":"p1: Ting-Lu","details":"Ting-Lu","condition":"514/514","active":false,"stats":{"atk":257,"def":383,"spa":146,"spd":196,"spe":113},"moves":["spikes","whirlwind","earthquake","ruination"],"baseAbility":"vesselofruin","item":"leftovers","pokeball":"pokeball","ability":"vesselofruin","commanding":false,"reviving":false,"teraType":"Ground","terastallized":""},{"ident":"p1: Gholdengo","details":"Gholdengo","condition":"378/378","active":false,"stats":{"atk":112,"def":226,"spa":401,"spd":219,"spe":204},"moves":["nastyplot","recover","makeitrain","shadowball"],"baseAbility":"goodasgold","item":"airballoon","pokeball":"pokeball","ability":"goodasgold","commanding":false,"reviving":false,"teraType":"Steel","terastallized":""},{"ident":"p1: Tyranitar","details":"Tyranitar, F","condition":"404/404","active":false,"stats":{"atk":304,"def":257,"spa":203,"spd":328,"spe":158},"moves":["stealthrock","rockblast","earthquake","thunderwave"],"baseAbility":"sandstream","item":"heavydutyboots","pokeball":"pokeball","ability":"sandstream","commanding":false,"reviving":false,"teraType":"Fairy","terastallized":""},{"ident":"p1: Dondozo","details":"Dondozo, M","condition":"503/503","active":false,"stats":{"atk":238,"def":361,"spa":149,"spd":166,"spe":106},"moves":["curse","rest","liquidation","bodypress"],"baseAbility":"unaware","item":"chestoberry","pokeball":"pokeball","ability":"unaware","commanding":false,"reviving":false,"teraType":"Fighting","terastallized":""},{"ident":"p1: Clodsire","details":"Clodsire, F","condition":"464/464","active":false,"stats":{"atk":187,"def":156,"spa":113,"spd":328,"spe":76},"moves":["toxic","recover","earthquake","bodypress"],"baseAbility":"unaware","item":"leftovers","pokeball":"pokeball","ability":"unaware","commanding":false,"reviving":false,"teraType":"Water","terastallized":""}]},"noCancel":true,"rqid":6}',
            {
                "type": "Request",
                "request": {
                    "id": 6,
                    "side": {
                        "name": "nlp",
                        "playerIndex": 1,
                        "pokemon": [
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Corviknight"
                                },
                                "details": {
                                    "species": "corviknight",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "F",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 399,
                                    "maxHP": 399,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": true,
                                "stats": {
                                    "atk": 212,
                                    "def": 339,
                                    "spa": 127,
                                    "spd": 206,
                                    "spe": 170
                                },
                                "moves": [
                                    "bravebird",
                                    "roost",
                                    "defog",
                                    "uturn"
                                ],
                                "item": "rockyhelmet",
                                "ball": "pokeball",
                                "ability": "pressure",
                                "baseAbility": "pressure",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Flying",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Ting-Lu"
                                },
                                "details": {
                                    "species": "tinglu",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "N",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 514,
                                    "maxHP": 514,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 257,
                                    "def": 383,
                                    "spa": 146,
                                    "spd": 196,
                                    "spe": 113
                                },
                                "moves": [
                                    "spikes",
                                    "whirlwind",
                                    "earthquake",
                                    "ruination"
                                ],
                                "item": "leftovers",
                                "ball": "pokeball",
                                "ability": "vesselofruin",
                                "baseAbility": "vesselofruin",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Ground",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Gholdengo"
                                },
                                "details": {
                                    "species": "gholdengo",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "N",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 378,
                                    "maxHP": 378,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 112,
                                    "def": 226,
                                    "spa": 401,
                                    "spd": 219,
                                    "spe": 204
                                },
                                "moves": [
                                    "nastyplot",
                                    "recover",
                                    "makeitrain",
                                    "shadowball"
                                ],
                                "item": "airballoon",
                                "ball": "pokeball",
                                "ability": "goodasgold",
                                "baseAbility": "goodasgold",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Steel",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Tyranitar"
                                },
                                "details": {
                                    "species": "tyranitar",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "F",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 404,
                                    "maxHP": 404,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 304,
                                    "def": 257,
                                    "spa": 203,
                                    "spd": 328,
                                    "spe": 158
                                },
                                "moves": [
                                    "stealthrock",
                                    "rockblast",
                                    "earthquake",
                                    "thunderwave"
                                ],
                                "item": "heavydutyboots",
                                "ball": "pokeball",
                                "ability": "sandstream",
                                "baseAbility": "sandstream",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Fairy",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Dondozo"
                                },
                                "details": {
                                    "species": "dondozo",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "M",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 503,
                                    "maxHP": 503,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 238,
                                    "def": 361,
                                    "spa": 149,
                                    "spd": 166,
                                    "spe": 106
                                },
                                "moves": [
                                    "curse",
                                    "rest",
                                    "liquidation",
                                    "bodypress"
                                ],
                                "item": "chestoberry",
                                "ball": "pokeball",
                                "ability": "unaware",
                                "baseAbility": "unaware",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Fighting",
                                "terastallized": ""
                            },
                            {
                                "ident": {
                                    "playerIndex": 1,
                                    "name": "Clodsire"
                                },
                                "details": {
                                    "species": "clodsire",
                                    "level": 100,
                                    "shiny": false,
                                    "gender": "F",
                                    "terastallized": ""
                                },
                                "condition": {
                                    "hp": 464,
                                    "maxHP": 464,
                                    "status": "",
                                    "fainted": false
                                },
                                "active": false,
                                "stats": {
                                    "atk": 187,
                                    "def": 156,
                                    "spa": 113,
                                    "spd": 328,
                                    "spe": 76
                                },
                                "moves": [
                                    "toxic",
                                    "recover",
                                    "earthquake",
                                    "bodypress"
                                ],
                                "item": "leftovers",
                                "ball": "pokeball",
                                "ability": "unaware",
                                "baseAbility": "unaware",
                                "commanding": false,
                                "reviving": false,
                                "teraType": "Water",
                                "terastallized": ""
                            }
                        ]
                    },
                    "forceSwitch": [
                        true
                    ]
                }
            },
        );
    });
});
