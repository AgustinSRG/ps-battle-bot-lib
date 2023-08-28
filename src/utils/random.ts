// Random utils

"use strict";

/**
 * Randomly chooses an element of an array
 * @param array The array
 * @returns A random element
 */
export function randomlyChoose<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}
