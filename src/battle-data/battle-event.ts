// Battle event definition

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";
import { BattleEventMajor, BattleEventMajorSchema } from "./battle-event-major";
import { BattleEventMinor, BattleEventMinorSchema } from "./battle-event-minor";

export type BattleEvent = BattleEventMajor | BattleEventMinor;

export const BattleEventSchema = ObjectSchema.anyOf([BattleEventMajorSchema, BattleEventMinorSchema]).withDefaultSchema(ObjectSchema.null());

/**
 * Battle event kind
 */
export type BattleEventKind = BattleEvent['type'];
