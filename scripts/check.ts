// Smallest thing that fails if the menu helpers break: node scripts/check.ts
import assert from "node:assert/strict";
import { formatPrice, slugify } from "../src/lib/format.ts";
import { menuTypeFromSlug, MENU_TYPES } from "../src/lib/types.ts";
import { passwordProblem } from "../src/lib/password.ts";

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

// Password change: quiet while empty, but nothing weak or mistyped gets through.
assert.equal(passwordProblem("", "", ""), null);
assert.equal(passwordProblem("old-one", "", ""), null);
assert.equal(passwordProblem("old-one", "short", ""), "Use at least 8 characters.");
assert.equal(passwordProblem("old-one", "longenough", "longenouh"), "The two new passwords do not match.");
assert.equal(passwordProblem("same-pass-1", "same-pass-1", "same-pass-1"), "That is already the current password.");
assert.equal(passwordProblem("old-one", "longenough", "longenough"), null);
// Exactly 8 is allowed; 7 is not.
assert.equal(passwordProblem("old-one", "12345678", "12345678"), null);
assert.equal(passwordProblem("old-one", "1234567", "1234567"), "Use at least 8 characters.");

console.log("checks passed");
