// Request knowledge

"use strict";

import { Battle, BattleRequest, BattleRequestSidePokemon, VolatileStatuses, compareDetails, findActiveByRequestIndex, findActiveSlotByRequestIndex } from "../../battle-data";
import { createSidePokemonFromRequest, findSidePokemon } from "../../battle-helpers";
import { getMaxPPFromBasePP, getMoveBasePP } from "../../battle-helpers/move-pp-data";
import { toId } from "../../utils/id";
import { clone } from "../../utils/clone";

/**
 * Applies knowledge from the request to the battle status
 * @param battle The battle
 */
export function applyRequestKnowledge(battle: Battle) {
    if (battle.mainPlayer === undefined || !battle.request) {
        return;
    }

    const mainPlayer = battle.players.get(battle.mainPlayer);

    if (!mainPlayer) {
        return;
    }

    // Update team
    for (let i = 0; i < battle.request.side.pokemon.length; i++) {
        const reqSidePoke = battle.request.side.pokemon[i];

        let teamPoke = findSidePokemon(mainPlayer, reqSidePoke.ident.name, reqSidePoke.details, reqSidePoke.condition, false);

        if (!teamPoke) {
            // Not found, maybe add it

            if (mainPlayer.team.length >= mainPlayer.teamSize) {
                continue; // Too many pokemon already
            }

            teamPoke = createSidePokemonFromRequest(battle.status.gen, mainPlayer.team.length, reqSidePoke);

            mainPlayer.team.push(teamPoke);
        }

        teamPoke.details = clone(reqSidePoke.details);

        teamPoke.ident = clone(reqSidePoke.ident);

        teamPoke.condition = clone(reqSidePoke.condition);

        teamPoke.stats = {
            hp: {
                known: true,
                min: reqSidePoke.condition.maxHP,
                max: reqSidePoke.condition.maxHP,
            },
            atk: {
                known: true,
                min: reqSidePoke.stats.atk,
                max: reqSidePoke.stats.atk,
            },
            def: {
                known: true,
                min: reqSidePoke.stats.def,
                max: reqSidePoke.stats.def,
            },
            spa: {
                known: true,
                min: reqSidePoke.stats.spa,
                max: reqSidePoke.stats.spa,
            },
            spd: {
                known: true,
                min: reqSidePoke.stats.spd,
                max: reqSidePoke.stats.spd,
            },
            spe: {
                known: true,
                min: reqSidePoke.stats.spe,
                max: reqSidePoke.stats.spe,
            }
        };

        teamPoke.item.known = true;
        teamPoke.item.item = reqSidePoke.item;

        teamPoke.ability.known = true;
        teamPoke.ability.ability = reqSidePoke.ability;
        teamPoke.ability.baseAbility = reqSidePoke.baseAbility || reqSidePoke.ability;

        if (teamPoke.active && battle.request.active) {
            continue; // Moves are set in the active section
        }

        for (const m of reqSidePoke.moves) {
            const moveId = toId(m);
            if (!teamPoke.moves.has(moveId)) {
                const pp = getMaxPPFromBasePP(getMoveBasePP(battle.status.gen, m));
                teamPoke.moves.set(moveId, {
                    id: toId(m),
                    revealed: false,
                    maxPP: pp,
                    pp: pp,
                    disabled: false,
                });
            }
        }
    }

    // Update active
    if (battle.request.active) {
        for (let i = 0; i < battle.request.active.length && i < battle.request.side.pokemon.length; i++) {
            const reqSidePoke = battle.request.side.pokemon[i];

            const activeSlot = findActiveSlotByRequestIndex(mainPlayer, i);
            const active = findActiveByRequestIndex(mainPlayer, i);

            if (!active) {
                continue;
            }

            if (reqSidePoke.ident.name === active.ident.name && compareDetails(reqSidePoke.details, active.details)) {
                active.condition = clone(reqSidePoke.condition);

                active.stats = {
                    hp: {
                        known: true,
                        min: reqSidePoke.condition.maxHP,
                        max: reqSidePoke.condition.maxHP,
                    },
                    atk: {
                        known: true,
                        min: reqSidePoke.stats.atk,
                        max: reqSidePoke.stats.atk,
                    },
                    def: {
                        known: true,
                        min: reqSidePoke.stats.def,
                        max: reqSidePoke.stats.def,
                    },
                    spa: {
                        known: true,
                        min: reqSidePoke.stats.spa,
                        max: reqSidePoke.stats.spa,
                    },
                    spd: {
                        known: true,
                        min: reqSidePoke.stats.spd,
                        max: reqSidePoke.stats.spd,
                    },
                    spe: {
                        known: true,
                        min: reqSidePoke.stats.spe,
                        max: reqSidePoke.stats.spe,
                    }
                };

                active.item.known = true;
                active.item.item = reqSidePoke.item;

                active.ability.known = true;
                active.ability.ability = reqSidePoke.ability;
                active.ability.baseAbility = reqSidePoke.baseAbility || reqSidePoke.ability;
            } else {
                // Illusion detected

                const impersonator = findSidePokemon(mainPlayer, reqSidePoke.ident.name, reqSidePoke.details, null, true);
                const impersonated = mainPlayer.team[active.index];

                if (!impersonator || !impersonated) {
                    continue;
                }

                impersonator.active = true;
                impersonator.activeSlot = activeSlot;

                impersonated.active = false;
                delete impersonated.activeSlot;

                active.index = impersonator.index;

                active.ident = clone(impersonator.ident);

                active.details = clone(impersonator.details);

                active.condition = clone(impersonator.condition);

                active.stats = clone(impersonator.stats);

                active.item = clone(impersonator.item);

                active.ability = clone(impersonator.ability);
                
                active.moves = clone(impersonator.moves);

                active.timesHit = impersonator.timesHit;

                active.volatiles.add(VolatileStatuses.Illusion);
                active.volatilesData.impersonating = impersonated.index;
            }
        }

        for (let i = 0; i < battle.request.active.length; i++) {
            const reqActive = battle.request.active[i];
            const active = findActiveByRequestIndex(mainPlayer, i);

            if (!active) {
                continue;
            }

            for (const move of reqActive.moves) {
                const moveId = toId(move.id);

                if (active.volatiles.has(VolatileStatuses.Transform)) {
                    if (active.volatilesData.transformedInfo) {
                        if (active.volatilesData.transformedInfo.moves.has(moveId)) {
                            const knownMove = active.volatilesData.transformedInfo.moves.get(moveId);
        
                            if ("pp" in move) {
                                knownMove.pp = move.pp;
                            }

                            if ("maxPP" in move) {
                                knownMove.maxPP = move.maxPP;
                            }
                            
                            knownMove.disabled = move.disabled;
                        } else {
                            const knownMove = {
                                id: moveId,
                                revealed: false,
                                maxPP: move.maxPP,
                                pp: move.pp,
                                disabled: move.disabled,
                            };
        
                            active.volatilesData.transformedInfo.moves.set(moveId, knownMove);
                        }
                    }
                } else if (active.moves.has(moveId)) {
                    const knownMove = active.moves.get(moveId);

                    if ("pp" in move) {
                        knownMove.pp = move.pp;
                    }

                    if ("maxPP" in move) {
                        knownMove.maxPP = move.maxPP;
                    }

                    knownMove.disabled = move.disabled;
                } else {
                    const knownMove = {
                        id: moveId,
                        revealed: false,
                        maxPP: move.maxPP || 1,
                        pp: move.pp || 0,
                        disabled: move.disabled,
                    };

                    active.moves.set(moveId, knownMove);
                }
            }
        }
    }
}

/**
 * Finds index of a pokemon from a previous request
 * @param request The new request
 * @param sidePoke The side pokemon of the other request
 * @param alreadyChosen The set of indexes it cannot choose from
 * @returns The index, or -1 if not found
 */
export function findCrossRequestSideIndex(request: BattleRequest, sidePoke: BattleRequestSidePokemon, alreadyChosen: Set<number>): number {
    const possibleMons = request.side.pokemon.filter((p, i) => {
        if (alreadyChosen.has(i)) {
            return false;
        }

        if (p.ident.name !== sidePoke.ident.name) {
            return false;
        }

        return compareDetails(p.details, sidePoke.details);
    });

    if (possibleMons.length === 0) {
        return -1;
    }

    if (possibleMons.length === 1) {
        return request.side.pokemon.indexOf(possibleMons[0]);
    }

    // Filter by item and ability

    const filteredMons = possibleMons.filter(p => {
        return p.item === sidePoke.item && p.baseAbility === sidePoke.baseAbility;
    });

    if (filteredMons.length === 0) {
        return request.side.pokemon.indexOf(possibleMons[0]);
    }

    return request.side.pokemon.indexOf(filteredMons[0]);
}