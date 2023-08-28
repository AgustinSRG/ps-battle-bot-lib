// Item knowledge

"use strict";

/**
 * Item knowledge
 */
export interface ItemKnowledge {
    /**
     * True if known
     */
    known: boolean;

    /**
     * True if revealed
     */
    revealed: boolean;

    /**
     * Name of the item
     */
    item: string;

    /**
     * Name of the previous item
     * In case the item was removed
     */
    previousItem?: string;

    /**
     * Cause of the item lost
     */
    itemLostCause?: "eaten" | "flung" | "knocked off" | "stolen" | "consumed" | "incinerated" | "popped" | "held up";

    /**
     * True means a trick / switcheroo move failed, this indicates the item cannot be removed
     */
    trickMoveFailed?: boolean;
}
