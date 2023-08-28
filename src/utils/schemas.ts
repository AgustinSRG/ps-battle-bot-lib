// Commonly used schemas

"use strict";

import { ObjectSchema } from "@asanrom/javascript-object-sanitizer";

export const STRING_SCHEMA = ObjectSchema.string().withDefaultValue("");

export const POSITIVE_INT_SCHEMA = ObjectSchema.integer().withMin(0).withDefaultValue(0);

export const NUMBER_SCHEMA = ObjectSchema.number().withDefaultValue(0);

export const BOOLEAN_SCHEMA = ObjectSchema.boolean().withDefaultValue(false);
