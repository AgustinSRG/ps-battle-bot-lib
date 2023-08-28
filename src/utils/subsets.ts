// Subsets utils

"use strict";

function getSubsets<T>(source: T[], sourceIndex: number, subsetSize: number, current: T[], currentIndex: number, result: T[][]) {
    if (currentIndex === subsetSize) {
        result.push(current.slice());
        return;
    }

    if (sourceIndex >= source.length) {
        return;
    }

    current[currentIndex] = source[sourceIndex];

    // Included
    getSubsets(source, sourceIndex + 1, subsetSize, current, currentIndex + 1, result);

    // Excluded
    getSubsets(source, sourceIndex + 1, subsetSize, current, currentIndex, result);
}

/**
 * Finds all subsets of fixed size for a given set
 * @param set The set to create subsets
 * @param subSetSize The subset size
 * @returns The list of existing subsets
 */
export function findSubSets<T>(set: T[], subSetSize: number): T[][] {
    if (subSetSize >= set.length) {
        return [set.slice()];
    }

    const result: T[][] = [];

    const current = new Array(subSetSize);

    getSubsets(set, 0, subSetSize, current, 0, result);

    return result;
}
