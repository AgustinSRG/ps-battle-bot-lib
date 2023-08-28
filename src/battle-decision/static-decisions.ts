// Static decisions

"use strict";

import { PassSubDecision, ShiftSubDecision } from "./active-decision";
import { WaitDecision } from "./decision";

/**
 * Wait decision
 */
export const WAIT_DECISION: WaitDecision = { type: "wait" };

Object.freeze(WAIT_DECISION);

/**
 * Pass decision
 */
export const PASS_DECISION: PassSubDecision = { type: "pass" };

Object.freeze(PASS_DECISION);

/**
 * Shift decision
 */
export const SHIFT_DECISION: ShiftSubDecision = { type: "shift" };

Object.freeze(SHIFT_DECISION);
