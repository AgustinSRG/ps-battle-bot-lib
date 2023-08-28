// Context extra data

"use strict";

/**
 * Decision type for a slot
 */
export type OtherSlotDecisionType = "switch" | "damage-move" | "status-move";

/**
 * Generic NPC context data
 */
export interface GenericNPCContext {
    otherDecisions: Map<number, OtherSlotDecisionType>;
}

/**
 * @returns Initial NPC context data
 */
export function initGenericNPCContext(): GenericNPCContext {
    return {
        otherDecisions: new Map(),
    };
}
