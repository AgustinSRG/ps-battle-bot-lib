// Battle decision

"use strict";

import { ActiveDecision, ActiveSubDecision } from "./active-decision";
import { ForceSwitchDecision, ForceSwitchSubDecision, ReviveSubDecision } from "./force-switch-decision";
import { TeamDecision } from "./team-decision";

/**
 * Battle decision
 */
export type BattleDecision = TeamDecision | ActiveDecision | ForceSwitchDecision | WaitDecision;

/**
 * Battle decision type
 */
export type BattleDecisionType = "team" | "active" | "force-switch" | "wait";

/**
 * Wait for the foes
 */
export interface WaitDecision {
    type: "wait";
}

/**
 * Battle sub-decision
 */
export type BattleSubDecision = TeamDecision | ActiveSubDecision | ForceSwitchSubDecision | ReviveSubDecision;
