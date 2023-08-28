// Parser utility functions

"use strict";

import { PokemonCondition, PokemonStatus } from "../battle-data/condition";
import { PokemonDetails } from "../battle-data/details";
import { BattleEffect } from "../battle-data/effect";
import { PokemonIdentTarget } from "../battle-data/ident";
import { BattleRequest, BattleRequestActivePokemon, BattleRequestActivePokemonMove, BattleRequestSidePokemon, MoveTarget, MoveTargetSchema } from "../battle-data/request";
import { PokemonStatsSchema } from "../battle-data/stats";
import { toId } from "../utils/id";
import { POSITIVE_INT_SCHEMA } from "../utils/schemas";

/**
 * Parses player index
 * @param playerId Player id (p1, p2, p3, p4)
 * @returns The player index (1, 2, 3, 4)
 */
export function parsePlayerIndex(playerId: string): number {
    if (/^p[1-9]/.test(playerId)) {
        return parseInt(playerId.charAt(1), 10);
    } else {
        return 0;
    }
}

/**
 * Map each slot into the active index
 */
export const SlotChart: { [k: string]: number } = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };

/**
 * Parses pokemon ident in pokemon showdown format
 * @param ident The pokemon ident
 * @returns The parsed result
 */
export function parsePokemonIdent(ident: string): PokemonIdentTarget {
    let name = ident;

    let playerIndex = 0;
    let slot = -1; // if there is an explicit slot for this pokemon
    if (/^p[1-9]($|: )/.test(name)) {
        playerIndex = parseInt(name.charAt(1), 10);
        name = name.slice(4);
    } else if (/^p[1-9][a-f]: /.test(name)) {
        playerIndex = parseInt(name.charAt(1), 10);
        slot = SlotChart[name.charAt(2)];
        name = name.slice(5);
    }

    if (slot >= 0) {
        return {
            name: name,
            playerIndex: playerIndex,
            active: true,
            slot: slot,
        };
    } else {
        return {
            name: name,
            playerIndex: playerIndex,
            active: false,
        };
    }
}

/**
 * Parses pokemon details in pokemon showdown format
 * @param details The details in showdown format
 * @returns The parsed result
 */
export function parseDetails(details: string): PokemonDetails {
    const result: PokemonDetails = {
        species: "",
        level: 100,
        shiny: false,
        gender: "N",
        terastallized: "",
    };

    const splitDetails = details.split(', ');

    if (splitDetails[splitDetails.length - 1].startsWith('tera:')) {
        result.terastallized = toId(splitDetails[splitDetails.length - 1].slice(5));
        splitDetails.pop();
    }
    if (splitDetails[splitDetails.length - 1] === 'shiny') {
        result.shiny = true;
        splitDetails.pop();
    }
    if (splitDetails[splitDetails.length - 1] === 'M' || splitDetails[splitDetails.length - 1] === 'F') {
        result.gender = splitDetails[splitDetails.length - 1] as ("M" | "F");
        splitDetails.pop();
    }
    if (splitDetails[1]) {
        result.level = parseInt(splitDetails[1].substr(1), 10) || 100;
    }
    if (splitDetails[0]) {
        result.species = toId(splitDetails[0]);
    }

    return result;
}

/**
 * Parses pokemon condition in pokemon showdown format
 * @param condition The condition in showdown format
 * @returns The parsed result
 */
export function parseCondition(condition: string): PokemonCondition {
    const result: PokemonCondition = {
        hp: 100,
        maxHP: 100,
        status: "",
        fainted: false,
    };

    const [hp, status] = condition.split(' ');

    // Parse HP
    if (hp === '0' || hp === '0.0') {
        result.hp = 0;
    } else if (hp.indexOf('/') > 0) {
        const [currentHP, maxHP] = hp.split('/');
        if (!isNaN(Number(currentHP)) && !isNaN(Number(currentHP))) {
            result.hp = parseFloat(currentHP);
            result.maxHP = parseFloat(maxHP);
            if (result.hp > result.maxHP) result.hp = result.maxHP;
        }
    } else if (!isNaN(Number(hp))) {
        result.hp = parseFloat(hp);
    }

    // Parse status
    if (!status) {
        result.status = '';
    } else if (status.toUpperCase() === 'FNT') {
        result.hp = 0;
        result.fainted = true;
    } else {
        result.status = status.toUpperCase() as PokemonStatus;
    }

    return result;
}

/**
 * Gets the HP from the pokemon condition as percent
 * @param condition The condition
 * @returns The HP percent
 */
export function getHPPercent(condition: PokemonCondition): number {
    if (condition.fainted || condition.maxHP === 0) {
        return 0;
    }

    return condition.hp * 100 / condition.maxHP;
}

/**
 * Parses battle effect
 * @param effectName The effect name
 * @returns The parsed result
 */
export function parseEffect(effectName: string): BattleEffect {
    effectName = (effectName || "").trim();
    if (effectName.substring(0, 5) === 'item:') {
        return {
            kind: "item",
            id: toId(effectName.substring(5)),
        };
    } else if (effectName.substring(0, 8) === 'ability:') {
        return {
            kind: "ability",
            id: toId(effectName.substring(8)),
        };
    } else if (effectName.substring(0, 5) === 'move:') {
        return {
            kind: "move",
            id: toId(effectName.substring(5)),
        };
    }

    return {
        kind: "pure",
        id: toId(effectName),
    };
}

/**
 * Parses battle request as received from pokemon showdown
 * @param request The JSON parsed battle request
 * @returns The parsed result
 */
export function parseRequest(request: unknown): BattleRequest {
    const result: BattleRequest = {
        id: 0,
        side: {
            name: "",
            playerIndex: 0,
            pokemon: [],
        },
    };

    if (request && typeof request === "object") {
        if ("rqid" in request && typeof request.rqid === "number" && !isNaN(request.rqid)) {
            result.id = request.rqid;
        }

        if ("wait" in request && request.wait) {
            result.wait = true;
        }

        if ("teamPreview" in request && request.teamPreview) {
            result.teamPreview = true;
        }

        if ("forceSwitch" in request && request.forceSwitch) {
            if (Array.isArray(request.forceSwitch)) {
                result.forceSwitch = request.forceSwitch.map(fs => {
                    return !!fs;
                });
            } else {
                result.forceSwitch = [true];
            }
        }

        if ("active" in request && request.active && Array.isArray(request.active)) {
            result.active = request.active.map((active: unknown) => {
                const activeResult: BattleRequestActivePokemon = {
                    moves: [],
                };

                if (active && typeof active === "object") {
                    if ("trapped" in active) {
                        activeResult.trapped = !!active.trapped;
                    }

                    if ("canTerastallize" in active) {
                        activeResult.canTerastallize = active.canTerastallize + "";
                    }

                    if ("canMegaEvo" in active) {
                        activeResult.canMegaEvo = !!active.canMegaEvo;
                    }

                    if ("canUltraBurst" in active) {
                        activeResult.canUltraBurst = !!active.canUltraBurst;
                    }

                    let maxMoves: { id: string, target: MoveTarget }[] = [];

                    if ("maxMoves" in active && typeof active.maxMoves === "object" && active.maxMoves && "maxMoves" in active.maxMoves && Array.isArray(active.maxMoves.maxMoves)) {
                        maxMoves = active.maxMoves.maxMoves.map((maxMove: unknown) => {
                            if (typeof maxMove === "object" && maxMove) {
                                const maxMoveRes: { id: string, target: MoveTarget } = {
                                    id: "",
                                    target: "scripted",
                                };

                                if ("move" in maxMove) {
                                    maxMoveRes.id = toId(maxMove.move + "");
                                }

                                if ("target" in maxMove) {
                                    maxMoveRes.target = MoveTargetSchema.sanitize(maxMove.target);
                                }

                                return maxMoveRes;
                            } else {
                                return null;
                            }
                        });
                    }

                    let zMoves: { id: string, target: MoveTarget }[] = [];

                    if ("canZMove" in active && typeof active.canZMove === "object" && active.canZMove && Array.isArray(active.canZMove)) {
                        zMoves = active.canZMove.map((zMove: unknown) => {
                            if (typeof zMove === "object" && zMove) {
                                const zMoveRes: { id: string, target: MoveTarget } = {
                                    id: "",
                                    target: "scripted",
                                };

                                if ("move" in zMove) {
                                    zMoveRes.id = toId(zMove.move + "");
                                }

                                if ("target" in zMove) {
                                    zMoveRes.target = MoveTargetSchema.sanitize(zMove.target);
                                }

                                return zMoveRes;
                            } else {
                                return null;
                            }
                        });
                    }

                    if ("moves" in active && Array.isArray(active.moves)) {
                        activeResult.moves = active.moves.map((move: unknown, index) => {
                            if (!move || typeof move !== "object") {
                                return {
                                    id: "",
                                    target: "scripted",
                                    disabled: false,
                                };
                            }

                            const moveRes: BattleRequestActivePokemonMove = {
                                id: "",
                                target: "scripted",
                                disabled: false,
                            };

                            if ("move" in move) {
                                moveRes.id = toId(move.move + "");
                            }

                            if ("pp" in move) {
                                moveRes.pp = POSITIVE_INT_SCHEMA.sanitize(move.pp);
                            }

                            if ("maxpp" in move) {
                                moveRes.maxPP = POSITIVE_INT_SCHEMA.sanitize(move.maxpp);
                            }

                            if ("target" in move) {
                                moveRes.target = MoveTargetSchema.sanitize(move.target);
                            }

                            if ("disabled" in move) {
                                moveRes.disabled = !!move.disabled;
                            }

                            if (maxMoves[index]) {
                                moveRes.maxMove = maxMoves[index];
                            }

                            if (zMoves[index]) {
                                moveRes.zMove = zMoves[index];
                            }

                            return moveRes;
                        });
                    }

                }

                return activeResult;
            });
        }

        if ("side" in request && request.side && typeof request.side === "object") {
            if ("name" in request.side) {
                result.side.name = request.side.name + "";
            }

            if ("id" in request.side) {
                result.side.playerIndex = parsePlayerIndex(request.side.id + "");
            }

            if ("pokemon" in request.side && Array.isArray(request.side.pokemon)) {
                result.side.pokemon = request.side.pokemon.map((poke: unknown) => {
                    const pokeRes: BattleRequestSidePokemon = {
                        ident: {
                            playerIndex: 0,
                            name: "",
                        },
                        details: {
                            species: "",
                            level: 100,
                            gender: "N",
                            shiny: false,
                            terastallized: "",
                        },
                        condition: {
                            hp: 100,
                            maxHP: 100,
                            status: "",
                            fainted: false,
                        },
                        active: false,
                        stats: {
                            atk: 0,
                            def: 0,
                            spa: 0,
                            spd: 0,
                            spe: 0,
                        },
                        moves: [],
                        item: "",
                        ball: "",
                        ability: "",
                        baseAbility: "",
                    };

                    if (!poke || typeof poke !== "object") {
                        return pokeRes;
                    }

                    if ("ident" in poke) {
                        const pIdent = parsePokemonIdent(poke.ident + "");
                        pokeRes.ident.playerIndex = pIdent.playerIndex;
                        pokeRes.ident.name = pIdent.name;
                    }

                    if ("details" in poke) {
                        pokeRes.details = parseDetails(poke.details + "");
                    }

                    if ("condition" in poke) {
                        pokeRes.condition = parseCondition(poke.condition + "");
                    }

                    if ("active" in poke) {
                        pokeRes.active = !!poke.active;
                    }

                    if ("stats" in poke) {
                        pokeRes.stats = PokemonStatsSchema.sanitize(poke.stats);
                    }

                    if ("moves" in poke && Array.isArray(poke.moves)) {
                        pokeRes.moves = poke.moves.map(m => {
                            return m + "";
                        });
                    }

                    if ("commanding" in poke) {
                        pokeRes.commanding = !!poke.commanding;
                    }

                    if ("reviving" in poke) {
                        pokeRes.reviving = !!poke.reviving;
                    }

                    if ("baseAbility" in poke) {
                        pokeRes.baseAbility = poke.baseAbility + "";
                        pokeRes.ability = poke.baseAbility + "";
                    }

                    if ("ability" in poke) {
                        pokeRes.ability = poke.ability + "";
                        if (!pokeRes.baseAbility) {
                            pokeRes.baseAbility = pokeRes.ability;
                        }
                    }

                    if ("teraType" in poke) {
                        pokeRes.teraType = poke.teraType + "";
                    }

                    if ("terastallized" in poke) {
                        pokeRes.terastallized = poke.terastallized + "";
                    }

                    if ("item" in poke) {
                        pokeRes.item = poke.item + "";
                    }

                    if ("pokeball" in poke) {
                        pokeRes.ball = poke.pokeball + "";
                    }

                    return pokeRes;
                });
            }
        }
    }

    return result;
}
