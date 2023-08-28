// Battle effects

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";
import { STRING_SCHEMA } from "../utils/schemas";

/**
 * Battle effect
 */
export interface BattleEffect {
    kind: "item" | "ability" | "move" | "pure";
    id: string;
}

export const BattleEffectSchema = ObjectSchema.object({
    kind: ObjectSchema.string().withEnumeration(['item', 'ability', 'move', 'pure']).withDefaultValue("pure"),
    id: STRING_SCHEMA,
});
