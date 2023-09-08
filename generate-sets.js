// Generate set from calc sets

"use strict";

const FS = require("fs");
const Path = require("path");

function toId(str) {
    if (!str) {
        return "";
    }
    return (str + "").toLowerCase().replace(/[^a-z0-9]/g, '');
}

function main() {
    console.log("Generating sets...");

    for (let gen = 1; gen <= 9; gen++) {
        const setFile = Path.resolve(__dirname, "..", "damage-calc", "src", "js", "data", "sets", "gen" + gen + ".js");

        console.log("Loading file: " + setFile);

        let txt = FS.readFileSync(setFile).toString();

        let bracketIndex = txt.indexOf('{');

        txt = txt.substring(bracketIndex);

        let endIndex = txt.lastIndexOf("}");

        txt = txt.substring(0, endIndex + 1);

        const jsonData = JSON.parse(txt);

        let res = [];

        for (let species of Object.keys(jsonData)) {
            const speciesId = toId(species);

            const firstSet = Object.values(jsonData[species])[0];

            if (!firstSet) {
                continue;
            }

            const setData = {};

            if (firstSet.ability !== undefined) {
                setData.ability = toId(firstSet.ability);
            }

            if (firstSet.item !== undefined) {
                setData.item = toId(firstSet.item);
            }

            if (firstSet.nature !== undefined) {
                setData.nature = firstSet.nature + "";
            }

            if (firstSet.moves !== undefined) {
                setData.moves = firstSet.moves.map(toId);
            }

            if (firstSet.ivs !== undefined) {
                const ivs = {};

                if (firstSet.ivs.hp !== undefined) {
                    ivs.hp = firstSet.ivs.hp;
                }

                if (firstSet.ivs.at !== undefined) {
                    ivs.atk = firstSet.ivs.at;
                }

                if (firstSet.ivs.df !== undefined) {
                    ivs.def = firstSet.ivs.df;
                }

                if (firstSet.ivs.sa !== undefined) {
                    ivs.spa = firstSet.ivs.sa;
                }

                if (firstSet.ivs.sd !== undefined) {
                    ivs.spd = firstSet.ivs.sd;
                }

                if (firstSet.ivs.sp !== undefined) {
                    ivs.spe = firstSet.ivs.sp;
                }

                setData.ivs = ivs;
            }

            if (firstSet.evs !== undefined) {
                const evs = {};

                if (firstSet.evs.hp !== undefined) {
                    evs.hp = firstSet.evs.hp;
                }

                if (firstSet.evs.at !== undefined) {
                    evs.atk = firstSet.evs.at;
                }

                if (firstSet.evs.df !== undefined) {
                    evs.def = firstSet.evs.df;
                }

                if (firstSet.evs.sa !== undefined) {
                    evs.spa = firstSet.evs.sa;
                }

                if (firstSet.evs.sd !== undefined) {
                    evs.spd = firstSet.evs.sd;
                }

                if (firstSet.evs.sp !== undefined) {
                    evs.spe = firstSet.evs.sp;
                }

                setData.evs = evs;
            }

            res.push([speciesId, setData]);
        }

        const resFile = Path.resolve(__dirname, "lib-data", "sets", "sets-" + gen + ".json");

        FS.writeFileSync(resFile, JSON.stringify(res, null, "\t"));

        console.log("Wrote result: " + resFile);
    }
}

main();
