// Formats

"use strict";

import { toId } from "./id";

/**
 * Pokemon showdown format
 */
export interface PokemonShowdownFormat {
    /**
     * Format name
     */
    name: string;

    /**
     * True if the format requires a team
     */
    team: boolean;

    /**
     * True if the format has a ladder
     */
    ladder: boolean;

    /**
     * True if the format is available for challenges
     */
    challenge: boolean;

    /**
     * True if the format is disabled for tournaments
     */
    disableTournaments: boolean;
}

/**
 * Parses formats from Pokemon Showdown
 * @param str The formats in Pokemon Showdown message format
 * @returns The formats
 */
export function parsePokemonShowdownFormats(str: string): Map<string, PokemonShowdownFormat> {
    const result = new Map<string, PokemonShowdownFormat>();
    const formatsArr = str.split('|');
    let commaIndex: number;
    let formatData: PokemonShowdownFormat;
    let code: number;
    let name: string;
    for (let i = 0; i < formatsArr.length; i++) {
        commaIndex = formatsArr[i].indexOf(',');
        if (commaIndex === -1) {
            result.set(toId(formatsArr[i]), {
                name: formatsArr[i],
                team: true,
                ladder: true,
                challenge: true,
                disableTournaments: false,
            });
        } else if (commaIndex === 0) {
            i++;
            continue;
        } else {
            name = formatsArr[i];
            formatData = { name: name, team: true, ladder: true, challenge: true, disableTournaments: false };
            code = commaIndex >= 0 ? parseInt(name.substring(commaIndex + 1), 16) : NaN;
            if (!isNaN(code)) {
                name = name.substring(0, commaIndex);
                if (code & 1) formatData.team = false;
                if (!(code & 2)) formatData.ladder = false;
                if (!(code & 4)) formatData.challenge = false;
                if (!(code & 8)) formatData.disableTournaments = true;
            } else {
                if (name.substring(name.length - 2) === ',#') { // preset teams
                    formatData.team = false;
                    name = name.substring(0, name.length - 2);
                }
                if (name.substring(name.length - 2) === ',,') { // search-only
                    formatData.challenge = false;
                    name = name.substring(0, name.length - 2);
                } else if (name.substring(name.length - 1) === ',') { // challenge-only
                    formatData.ladder = false;
                    name = name.substring(0, name.length - 1);
                }
            }
            formatData.name = name;
            result.set(toId(name), formatData);
        }
    }
    return result;
}