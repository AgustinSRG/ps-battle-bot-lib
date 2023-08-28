// Search data

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";
import { isBattle } from "../utils";

export const SearchDataSchema = ObjectSchema.object({
    searching: ObjectSchema.array(ObjectSchema.string()),
    games: ObjectSchema.dict(isBattle, () => ObjectSchema.string()),
});

/**
 * Search data
 */
export interface SearchData {
    searching: string[];
    games: { [room: string]: string },
}
