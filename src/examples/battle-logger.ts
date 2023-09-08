// Battle logger

"use strict";

import { WriteStream, createWriteStream, existsSync, mkdirSync } from "fs";
import Path from "path";

interface BattleInProgress {
    logFile: string;
    stream: WriteStream;
}

export class BattleLogger {
    private path: string;
    private extension: string;

    private battles: Map<string, BattleInProgress>;

    constructor(path: string, extension = ".log") {
        this.path = path;
        this.extension = extension;
        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true });
        }

        this.battles = new Map();
    }

    public hasBattle(battle: string): boolean {
        return this.battles.has(battle);
    }

    public initBattle(battle: string) {
        if (this.battles.has(battle)) {
            return;
        }
        const file = Path.resolve(this.path, battle + (this.extension || ".log"));

        if (existsSync(file)) {
            return; // Don't overwrite
        }

        const stream = createWriteStream(file, { flags: 'w' });
        this.battles.set(battle, {
            logFile: file,
            stream: stream,
        });

        stream.write("|init|battle\n");
    }

    public log(battle: string, line: string) {
        if (!this.battles.has(battle)) {
            return;
        }

        this.battles.get(battle).stream.write(line + "\n");
    }

    public close(battle: string) {
        if (!this.battles.has(battle)) {
            return;
        }

        this.battles.get(battle).stream.close();
        this.battles.delete(battle);
    }

    public closeAll() {
        this.battles.forEach(battle => {
            battle.stream.close();
        });
        this.battles.clear();
    }
}
