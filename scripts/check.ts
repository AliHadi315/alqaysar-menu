// Smallest thing that fails if the menu helpers break: node scripts/check.ts
import assert from "node:assert/strict";
import { formatPrice, slugify } from "../src/lib/format.ts";
import { menuTypeFromSlug, MENU_TYPES } from "../src/lib/types.ts";

// Prices arrive from PostgREST as numbers or strings; both must render.
assert.equal(formatPrice(260, "P"), "P260.00");
assert.equal(formatPrice("1234.5", "P"), "P1,234.50");
assert.equal(formatPrice(0, "P"), "P0.00");
assert.equal(formatPrice("not a price", "P"), "");

assert.equal(slugify("Lahm Bi Ajeen"), "lahm-bi-ajeen");
assert.equal(slugify("  Pizza & Pide  "), "pizza-pide");
assert.equal(slugify("Shisha / Cigarette"), "shisha-cigarette");

assert.equal(menuTypeFromSlug("takeaway"), "TAKE_AWAY");
assert.equal(menuTypeFromSlug("tables"), "TABLES");
assert.equal(menuTypeFromSlug("nonsense"), null);
assert.equal(MENU_TYPES.length, 2);

console.log("checks passed");
