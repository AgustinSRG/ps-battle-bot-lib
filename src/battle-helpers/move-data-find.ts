// Move data finder

"use strict";

import { GenerationNum, Generations, State, toID } from "@asanrom/poke-calc";
import { Move } from "@asanrom/poke-calc";
import { AbilityName, ItemName, SpeciesName } from "@asanrom/poke-calc/dist/data/interface";
import { LAST_GEN } from "./initializers";
import { toId } from "../utils";

const DEFAULT_MOVE = "Splash";

/**
 * Find move data
 * @param gen Generation number
 * @param move The move name
 * @returns The move data
 */
export function findMove(gen: number, move: string, options: Partial<State.Move> & {
    ability?: AbilityName;
    item?: ItemName;
    species?: SpeciesName;
} = {}): Move {
    if (gen < 1 || gen > LAST_GEN) {
        gen = LAST_GEN;
    }

    let generationData = Generations.get(gen as GenerationNum);
    let moveData = generationData.moves.get(toID(move));

    if (moveData) {
        return new Move(generationData.num, moveData.name, options);
    }

    // Try with the last gen

    for (let g = LAST_GEN; g >= 1; g--) {
        generationData = Generations.get(g as GenerationNum);
        moveData = generationData.moves.get(toID(move));

        if (moveData) {
            return new Move(generationData.num, moveData.name, options);
        }
    }

    // Unknown move
    generationData = Generations.get(LAST_GEN as GenerationNum);
    moveData = generationData.moves.get(toID(DEFAULT_MOVE));

    return new Move(generationData.num, moveData.name, options);
}

export const RechargeMoves = new Set<string>([
    'Giga Impact',
    'Hyper Beam',
    'Rock Wrecker',
    'Eternabeam',
    'Blast Burn',
    'Frenzy Plant',
    'Hydro Cannon',
    'Roar of Time'
].map(toId));

