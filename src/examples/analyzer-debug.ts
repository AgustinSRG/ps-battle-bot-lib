// Battle analyzer debugging tool

"use strict";

import dotenv from "dotenv";
dotenv.config();

import { Stats, statSync } from "fs";
import { Log } from "./log";
import { readdirSync } from "fs";
import Path from "path";
import { readFileSync } from "fs";
import { writeFileSync } from "fs";
import { parsePokemonShowdownBattleEvent } from "../showdown-battle-parser";
import { createBattle } from "../battle-helpers";
import { DefaultBattleAnalyzer } from "../battle-analyzer";

/**
 * JSON stringifies
 * @param o The object to stringify
 * @returns The JSON
 */
function stringifyObject(o: any) {
    return JSON.stringify(o, (key, value) => {
        if (value instanceof Set) {
            return Array.from(value);
        } else if (value instanceof Map) {
            const m = Object.create(null);

            for (const [k, v] of value) {
                m[k] = v;
            }

            return m;
        } else {
            return value;
        }
    });
}

function parseFile(file: string) {
    const newLogName = file.substring(0, file.length - 4) + ".debug.log";

    try {
        const log = readFileSync(file).toString().split("\n");

        const newLog: string[] = [];
        const analyzer = new DefaultBattleAnalyzer(createBattle(Path.basename(file)));

        for (const line of log) {
            newLog.push(line);

            const event = parsePokemonShowdownBattleEvent(line);

            if (event) {
                newLog.push("|debug|Event: " + JSON.stringify(event));

                analyzer.nextEvent(event);
                newLog.push("|debug|Battle Status: " + stringifyObject(analyzer.battle));
            }
        }

        writeFileSync(newLogName, newLog.join("\n"));

        Log.info(`Parsed log: '${file}'. Saved: '${newLogName}'`);
    } catch (ex) {
        Log.error(`Error parsing file: '${file}'. Error: ${ex.message}`);
    }
}

export async function main(path: string) {

    let s: Stats;

    try {
        s = statSync(path);
    } catch (ex) {
        Log.error(`Could not open file: '${path}'. Error: ${ex.message}`);
        return;
    }

    if (s.isFile()) {
        if ((path.endsWith(".txt") || path.endsWith(".log")) && !path.endsWith(".debug.log")) {
            parseFile(path);
        } else {
            Log.error(`Not a log file: '${path}'`);
        }
    } else if (s.isDirectory) {
        const files = readdirSync(path);

        for (const file of files) {
            if ((file.endsWith(".txt") || file.endsWith(".log")) && !file.endsWith(".debug.log")) {
                parseFile(Path.resolve(path, file));
            }
        }
    } else {
        Log.error(`Not a file: '${path}'`);
    }
}

main(process.env.LOGS_PATH || "logs");
