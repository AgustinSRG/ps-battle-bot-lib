// Team decision

"use strict";

import { Battle, getActiveSize } from "../battle-data";
import { findSubSets } from "../utils/subsets";

const MAX_TEAM_SIZE_COMBINABLE = 6; // Any bigger than this size, we cannot make all combinations, or it will crash

/**
 * Team decision
 */
export interface TeamDecision {
    type: "team",

    /**
     * Order of the team
     */
    teamOrder: number[];
}

export function makeTeamDecisions(battle: Battle): TeamDecision[] {
    if (!battle.request || !battle.request.teamPreview) {
        return [];
    }

    const gameType = battle.status.gameType;

    const teamSize = battle.request.side.pokemon.length;
    const teamPreviewSize = battle.status.teamPreviewSize || teamSize;

    let hasIllusion = false;

    for (const poke of battle.request.side.pokemon) {
        if (poke.ability === "illusion") {
            hasIllusion = true; // If we have an illusion pokemon, it's relevant to set the last pokemon
            break;
        }
    }

    let teamArray: number[] = [];

    if (teamSize !== teamPreviewSize && (teamSize > MAX_TEAM_SIZE_COMBINABLE || teamPreviewSize > MAX_TEAM_SIZE_COMBINABLE)) {
        // We are in a custom battle with many pokemon
        // We cannot compute all possibilities as they may be too many to handle

        const auxArray: number[] = [];

        for (let i = 0; i < teamSize; i++) {
            auxArray.push(i);
        }

        for (let i = 0; i < teamPreviewSize && i < teamSize; i++) {
            const random = Math.floor(Math.random() *auxArray.length);
            teamArray.push(auxArray[random]);
            auxArray.splice(random, 1);
        }

        teamArray = teamArray.sort((a, b) => {
            if (a < b) {
                return -1;
            } else {
                return 1;
            }
        });
    } else {
        // Full team
        for (let i = 0; i < teamSize; i++) {
            teamArray.push(i);
        }
    }

    const teamSubSets = findSubSets(teamArray, teamPreviewSize);
    const leadSize = getActiveSize(gameType);

    const result: TeamDecision[] = [];

    for (const chosenTeam of teamSubSets) {
        const possibleLeads = findSubSets(chosenTeam, leadSize);

        for (const leads of possibleLeads) {
            if (leads.length >= chosenTeam.length) {
                result.push({
                    type: "team",
                    teamOrder: leads,
                });
                continue;
            }

            const leadSet = new Set(leads);

            if (!hasIllusion) {
                // If no illusion, no need to set the last pokemon
                const finalTeam = leads.slice();

                for (const poke of chosenTeam) {
                    if (leadSet.has(poke)) {
                        continue;
                    }

                    finalTeam.push(poke);
                }

                result.push({
                    type: "team",
                    teamOrder: finalTeam,
                });

                continue;
            }

            for (const lastPokemon of chosenTeam) {
                if (leadSet.has(lastPokemon)) {
                    continue;
                }

                leadSet.add(lastPokemon);

                const finalTeam = leads.slice(); // Add the leads

                for (const poke of chosenTeam) {
                    if (leadSet.has(poke)) {
                        continue;
                    }

                    finalTeam.push(poke);
                }

                finalTeam.push(lastPokemon); // Add the last pokemon

                leadSet.delete(lastPokemon);

                // Push result

                result.push({
                    type: "team",
                    teamOrder: finalTeam,
                });
            }
        }
    }

    return result;
}
