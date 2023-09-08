// Pokemon teams

"use strict";

import { toId } from "../utils";

/**
 * Team member
 */
export interface PokemonTeamMember {
    /**
     * Name
     */
    name: string;

    /**
     * Species
     */
    species: string;

    /**
     * Gender
     */
    gender: "M" | "F" | "";

    /**
     * Level
     */
    level?: number;

    /**
     * Hold item
     */
    item: string;

    /**
     * Ability
     */
    ability: string;

    /**
     * True if it's shiny
     */
    shiny?: boolean;

    /**
     * True if GigantaMax
     */
    gigantamax?: boolean;

    /**
     * Dynamax level
     */
    dynamaxLevel?: number;

    /**
     * Tera type
     */
    teraType?: string;

    /**
     * Effort values
     */
    evs?: {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
    };

    /**
     * Individual values
     */
    ivs?: {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
    };

    /**
     * Nature
     */
    nature: string;

    /**
     * Happiness
     */
    happiness?: number;

    /**
     * Moves
     */
    moves: string[];
}

/**
 * Pokemon team
 */
export type PokemonTeam = PokemonTeamMember[];

const BattleStatIDs = {
    HP: 'hp',
    hp: 'hp',
    Atk: 'atk',
    atk: 'atk',
    Def: 'def',
    def: 'def',
    SpA: 'spa',
    SAtk: 'spa',
    SpAtk: 'spa',
    spa: 'spa',
    SpD: 'spd',
    SDef: 'spd',
    SpDef: 'spd',
    spd: 'spd',
    Spe: 'spe',
    Spd: 'spe',
    spe: 'spe',
};

const BattleTypeChart = {
    "Bug": {
        HPivs: { "atk": 30, "def": 30, "spd": 30 },
        HPdvs: { "atk": 13, "def": 13 },
    },
    "Dark": {
        HPivs: Object.create(null),
    },
    "Dragon": {
        HPivs: { "atk": 30 },
        HPdvs: { "def": 14 },
    },
    "Electric": {
        HPivs: { "spa": 30 },
        HPdvs: { "atk": 14 },
    },
    "Fairy": {
    },
    "Fighting": {
        HPivs: { "def": 30, "spa": 30, "spd": 30, "spe": 30 },
        HPdvs: { "atk": 12, "def": 12 },
    },
    "Fire": {
        HPivs: { "atk": 30, "spa": 30, "spe": 30 },
        HPdvs: { "atk": 14, "def": 12 },
    },
    "Flying": {
        HPivs: { "hp": 30, "atk": 30, "def": 30, "spa": 30, "spd": 30 },
        HPdvs: { "atk": 12, "def": 13 },
    },
    "Ghost": {
        HPivs: { "def": 30, "spd": 30 },
        HPdvs: { "atk": 13, "def": 14 },
    },
    "Grass": {
        HPivs: { "atk": 30, "spa": 30 },
        HPdvs: { "atk": 14, "def": 14 },
    },
    "Ground": {
        HPivs: { "spa": 30, "spd": 30 },
        HPdvs: { "atk": 12 },
    },
    "Ice": {
        HPivs: { "atk": 30, "def": 30 },
        HPdvs: { "def": 13 },
    },
    "Normal": {
    },
    "Poison": {
        HPivs: { "def": 30, "spa": 30, "spd": 30 },
        HPdvs: { "atk": 12, "def": 14 },
    },
    "Psychic": {
        HPivs: { "atk": 30, "spe": 30 },
        HPdvs: { "def": 12 },
    },
    "Rock": {
        HPivs: { "def": 30, "spd": 30, "spe": 30 },
        HPdvs: { "atk": 13, "def": 12 },
    },
    "Steel": {
        HPivs: { "spd": 30 },
        HPdvs: { "atk": 13 },
    },
    "Water": {
        HPivs: { "atk": 30, "def": 30, "spa": 30 },
        HPdvs: { "atk": 14, "def": 13 },
    }
};

/**
 * Parses pokemon team
 * @param text The team in Pokemon Showdown exportable format
 * @returns The parsed team
 */
export function parsePokemonTeam(text: string): PokemonTeam {
    const lines = text.split("\n");
    const team: PokemonTeam = [];
    let curSet: PokemonTeamMember | null = null;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line === '' || line === '---') {
            curSet = null;
        } else if (!curSet) {
            curSet = { name: '', species: '', gender: '', item: '', ability: '', nature: '', moves: [] };
            team.push(curSet);
            const atIndex = line.lastIndexOf(' @ ');
            if (atIndex !== -1) {
                curSet.item = line.substring(atIndex + 3);
                if (toId(curSet.item) === 'noitem') curSet.item = '';
                line = line.substring(0, atIndex);
            }
            if (line.substring(line.length - 4) === ' (M)') {
                curSet.gender = 'M';
                line = line.substring(0, line.length - 4);
            }
            if (line.substring(line.length - 4) === ' (F)') {
                curSet.gender = 'F';
                line = line.substring(0, line.length - 4);
            }
            const parenIndex = line.lastIndexOf(' (');
            if (line.substring(line.length - 1) === ')' && parenIndex !== -1) {
                line = line.substring(0, line.length - 1);
                curSet.species = line.substring(parenIndex + 2);
                line = line.substring(0, parenIndex);
                curSet.name = line;
            } else {
                curSet.species = line;
                curSet.name = curSet.species;
            }
        } else if (line.substring(0, 7) === 'Trait: ') {
            line = line.substring(7);
            curSet.ability = line;
        } else if (line.substring(0, 9) === 'Ability: ') {
            line = line.substring(9);
            curSet.ability = line;
        } else if (line === 'Shiny: Yes') {
            curSet.shiny = true;
        } else if (line === 'Gigantamax: Yes') {
            curSet.gigantamax = true;
        } else if (line.substring(0, 7) === 'Level: ') {
            line = line.substring(7);
            curSet.level = parseInt(line);
        } else if (line.substring(0, 11) === 'Happiness: ') {
            line = line.substring(11);
            curSet.happiness = parseInt(line);
        } else if (line.substring(0, 15) === 'Dynamax Level: ') {
            line = line.substring(15);
            curSet.dynamaxLevel = +line;
        } else if (line.substring(0, 11) === 'Tera Type: ') {
            line = line.substring(11);
            curSet.teraType = line;
        } else if (line.substring(0, 5) === 'EVs: ') {
            line = line.substring(5);
            const evLines = line.split('/');
            curSet.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
            for (let j = 0; j < evLines.length; j++) {
                const evLine = evLines[j].trim();
                const spaceIndex = evLine.indexOf(' ');
                if (spaceIndex === -1) continue;
                const statid = BattleStatIDs[evLine.substring(spaceIndex + 1)];
                const statval = parseInt(evLine.substring(0, spaceIndex));
                if (!statid) continue;
                curSet.evs[statid] = statval;
            }
        } else if (line.substring(0, 5) === 'IVs: ') {
            line = line.substring(5);
            const ivLines = line.split(' / ');
            curSet.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
            for (let j = 0; j < ivLines.length; j++) {
                const ivLine = ivLines[j];
                const spaceIndex = ivLine.indexOf(' ');
                if (spaceIndex === -1) continue;
                const statid = BattleStatIDs[ivLine.substring(spaceIndex + 1)];
                const statval = parseInt(ivLine.substring(0, spaceIndex));
                if (!statid) continue;
                curSet.ivs[statid] = statval;
            }
        } else if (line.match(/^[A-Za-z]+ (N|n)ature/)) {
            let natureIndex = line.indexOf(' Nature');
            if (natureIndex === -1) natureIndex = line.indexOf(' nature');
            if (natureIndex === -1) continue;
            line = line.substring(0, natureIndex);
            curSet.nature = line;
        } else if (line.substring(0, 1) === '-' || line.substring(0, 1) === '~') {
            line = line.substring(1);
            if (line.substring(0, 1) === ' ') line = line.substring(1);
            if (line.substring(0, 14) === 'Hidden Power [') {
                const hptype = line.substring('Hidden Power ['.length, line.length - 1);
                line = 'Hidden Power ' + hptype;
                if (!curSet.ivs && BattleTypeChart[hptype] && BattleTypeChart[hptype].HPivs) {
                    curSet.ivs = Object.create(null);
                    for (const stat of Object.keys(BattleTypeChart[hptype].HPivs)) {
                        curSet.ivs[stat] = BattleTypeChart[hptype].HPivs[stat];
                    }
                }
            }
            if (line === 'Frustration') {
                curSet.happiness = 0;
            }
            curSet.moves.push(line);
        }
    }
    return team;
}

/**
 * Packs pokemon team to be send to Pokemon Showdown
 * @param team The team
 * @returns The team in packed format
 */
export function packPokemonTeam(team: PokemonTeam): string {
    let buf = '';
    if (!team) return '';
    for (let i = 0; i < team.length; i++) {
        const set = team[i];
        if (buf) buf += ']';
        // name
        buf += (set.name || set.species);
        // species
        const id = toId(set.species || set.name);
        buf += '|' + (toId(set.name || set.species) === id ? '' : id);
        // item
        buf += '|' + toId(set.item);
        // ability
        buf += '|' + toId(set.ability);
        // moves
        buf += '|';
        if (set.moves) {
            for (let j = 0; j < set.moves.length; j++) {
                const moveid = toId(set.moves[j]);
                if (j && !moveid) continue;
                buf += (j ? ',' : '') + moveid;
            }
        }
        // nature
        buf += '|' + set.nature;
        // evs
        let evs = '|';
        if (set.evs) {
            evs = '|' + (set.evs['hp'] || '') + ',' + (set.evs['atk'] || '') + ',' + (set.evs['def'] || '') + ',' +
                (set.evs['spa'] || '') + ',' + (set.evs['spd'] || '') + ',' + (set.evs['spe'] || '');
        }
        if (evs === '|,,,,,') {
            buf += '|';
        } else {
            buf += evs;
        }
        // gender
        if (set.gender) {
            buf += '|' + set.gender;
        } else {
            buf += '|';
        }
        // ivs
        let ivs = '|';
        if (set.ivs) {
            ivs = '|' + (set.ivs['hp'] === 31 || set.ivs['hp'] === undefined ? '' : set.ivs['hp']) + ',' + (set.ivs['atk'] === 31 || set.ivs['atk'] === undefined ? '' : set.ivs['atk']) + ',' + (set.ivs['def'] === 31 || set.ivs['def'] === undefined ? '' : set.ivs['def']) + ',' + (set.ivs['spa'] === 31 || set.ivs['spa'] === undefined ? '' : set.ivs['spa']) + ',' + (set.ivs['spd'] === 31 || set.ivs['spd'] === undefined ? '' : set.ivs['spd']) + ',' + (set.ivs['spe'] === 31 || set.ivs['spe'] === undefined ? '' : set.ivs['spe']);
        }
        if (ivs === '|,,,,,') {
            buf += '|';
        } else {
            buf += ivs;
        }
        // shiny
        if (set.shiny) {
            buf += '|S';
        } else {
            buf += '|';
        }
        // level
        if (set.level && set.level !== 100) {
            buf += '|' + set.level;
        } else {
            buf += '|';
        }
        // happiness
        if (set.happiness !== undefined && set.happiness !== 255) {
            buf += '|' + set.happiness;
        } else {
            buf += '|';
        }

        if (set.gigantamax || (set.dynamaxLevel !== undefined && set.dynamaxLevel !== 10) || set.teraType) {
            buf += ',' + ''; // HP type;
            buf += ',' + ''; // Pokeball
            buf += ',' + (set.gigantamax ? 'G' : '');
            buf += ',' + (set.dynamaxLevel !== undefined && set.dynamaxLevel !== 10 ? set.dynamaxLevel : '');
            buf += ',' + (set.teraType || '');
        }
    }
    return buf;
}
