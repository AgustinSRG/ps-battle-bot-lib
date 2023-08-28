// Identifier utils

"use strict";

/**
 * Gets ID by name
 * @param str The name string
 * @returns The ID
 */
export function toId(str: unknown): string {
    if (!str) {
        return "";
    }
    return (str + "").toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Gets room ID by name
 * @param str The room name
 * @returns The room ID
 */
export function toRoomId(str: unknown): string {
    if (!str) {
        return "";
    }
    return (str + "").toLowerCase().replace(/[^a-z0-9-]/g, '');
}

/**
 * Checks iof a room is a valid battle ID
 * @param room The room ID
 * @returns True if valid battle ID
 */
export function isBattle(room: string): boolean {
    return (/battle-[a-z0-9]+-[a-z0-9]+(-[a-z0-9]+)?/i).test(room);
}

/**
 * Simplifies battle room ID, removing the join code
 * @param room The battle room ID
 * @returns The simplified ID
 */
export function simplifyBattleId(room: string): string {
    return toRoomId(room.split("-").slice(0, 3).join("-"));
}

/**
 * Compares two string by ID
 * @param str1 The string 1
 * @param str2 The string 2
 * @returns True if they are equal by ID
 */
export function compareIds(str1: string, str2: string): boolean {
    return (toId(str1) === toId(str2));
}
