// Default analyzer

"use strict";

import { Battle, BattleActivePokemon, BattleEffect, BattleEvent, PokemonIdentTarget, PokemonMove, VolatileStatuses } from "../../battle-data";
import { BattleAnalyzer } from "../analyzer";
import { MajorEventsAnalyzer } from "./majors";
import { MinorEventsAnalyzer } from "./minors";
import { findPokemonInBattle } from "../../battle-helpers";
import { toId } from "../../utils/id";
import { getMaxPPFromBasePP, getMoveBasePP } from "../../battle-helpers/move-pp-data";
import { EventEmitter } from "events";

/**
 * Default battle analyzer
 */
export class DefaultBattleAnalyzer extends EventEmitter implements BattleAnalyzer {
    public battle: Battle; // Reference to the current battle status

    public currentMove: PokemonMove | null;
    public currentMoveUser: BattleActivePokemon | null;
    public currentMoveTargets: BattleActivePokemon[];
    public currentMoveTargetsDamage: Map<string, {
        receivedMove: boolean;
        immune: boolean;
        crit: boolean;
        miss: boolean;
        damageDealt: number;
    }>;

    constructor(battle: Battle) {
        super();

        this.battle = battle;
        this.currentMove = null;
        this.currentMoveUser = null;
        this.currentMoveTargets = [];
        this.currentMoveTargetsDamage = new Map();
    }

    /**
     * Handles the event, updating the battle.
     * @param event The event to handle
     * The call may throw if the event is invalid
     */
    public nextEvent(event: BattleEvent): void {
        if (!event) {
            return;
        }
        if (event.type in MajorEventsAnalyzer) {
            MajorEventsAnalyzer[event.type](this, this.battle, event);
        } else if (event.type in MinorEventsAnalyzer) {
            MinorEventsAnalyzer[event.type](this, this.battle, event);
        }
    }

    /**
     * Logs debug message
     * @param msg Debug message
     */
    public debug(msg: string) {
        this.emit("debug", msg);
    }

    /**
     * Releases any resources allocated by the analyzer
     */
    public destroy(): void {
        if (!this.battle.ended) {
            this.battle.ended = true;
        }
    }

    /**
     * Remembers a move that has been revealed
     * @param pokemon The active pokemon
     * @param moveName The move name
     * @returns The move status
     */
    public rememberMove(pokemon: BattleActivePokemon, moveName: string): PokemonMove {
        const moveId = toId(moveName);

        let move: PokemonMove;

        if (pokemon.volatiles.has(VolatileStatuses.Transform)) {
            if (pokemon.volatilesData.transformedInfo && moveId && !pokemon.volatilesData.transformedInfo.moves.has(moveId)) {
                move = {
                    id: moveId,
                    revealed: true,
                    pp: 5,
                    maxPP: 5,
                    disabled: false,
                };
                pokemon.volatilesData.transformedInfo.moves.set(moveId, move);
            }
        } else if (!pokemon.moves.has(moveId)) {
            const pp = getMaxPPFromBasePP(getMoveBasePP(this.battle.status.gen, moveId));

            move = {
                id: moveId,
                revealed: true,
                pp: pp,
                maxPP: pp,
                disabled: false,
            };

            pokemon.moves.set(moveId, move);
        } else {
            move = pokemon.moves.get(moveId);
        }

        move.revealed = true;

        return move;
    }

    /**
     * Marks ability or item from an effect, if the ability or item was unknown
     * @param pokemon The pokemon
     * @param effect The effect
     */
    public markItemOrAbility(pokemon: PokemonIdentTarget, effect: BattleEffect): void {
        const poke = findPokemonInBattle(this.battle, pokemon);

        if (!poke) {
            return;
        }

        if (effect.kind === "ability") {
            if (poke.active && !poke.active.ability.known) {
                poke.active.ability.known = true;
                poke.active.ability.revealed = true;
                poke.active.ability.ability = effect.id;

                if (!poke.active.ability.baseAbility) {
                    poke.active.ability.baseAbility = effect.id;
                }

                poke.active.ability.activationCount++;
            } else if (poke.pokemon && !poke.pokemon.ability.known) {
                poke.pokemon.ability.known = true;
                poke.pokemon.ability.revealed = true;
                poke.pokemon.ability.ability = effect.id;

                if (!poke.pokemon.ability.baseAbility) {
                    poke.pokemon.ability.baseAbility = effect.id;
                }
            }
        } else if (effect.kind === "item") {
            if (poke.active && !poke.active.item.known) {
                poke.active.item.known = true;
                poke.active.item.revealed = true;
                poke.active.item.item = effect.id;
            } else if (poke.pokemon && !poke.pokemon.item.known) {
                poke.pokemon.item.known = true;
                poke.pokemon.item.revealed = true;
                poke.pokemon.item.item = effect.id;
            }
        }
    }
}


export function DefaultBattleAnalyzerFactory(battle: Battle): DefaultBattleAnalyzer {
    return new DefaultBattleAnalyzer(battle);
}
