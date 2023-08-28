// Move status

"use strict";

/**
 * Pokemon move status
 */
export interface PokemonMove {
    /**
     * Move ID
     */
    id: string;

    /**
     * True if revealed. False means it's known by the request.
     */
    revealed: boolean;

    /**
     * Known PP remaining
     */
    pp: number;

    /**
     * Max PP of the move
     */
    maxPP: number;

    /**
     * True if disabled
     */
    disabled: boolean;
}
