// List of ignored messages

"use strict";

const IGNORE_LIST = [
    'init', 'noinit', 'deinit',
    'j', 'l', 'n',
    'c',
    't:',
    'inactive', 'inactiveoff',
    'upkeep',
    '-center', '-notarget', '-ohko',
    '-combine', '-hitcount', '-waiting', '-zbroken', '-zpower',
    '-primal', '-burst',
    '-fieldactivate',
    '-anim', '-hint', '-message', '-candynamax',
];

export const IgnoredBattleMessageTypes = new Set<string>(IGNORE_LIST);
