// Smallest thing that fails if the menu helpers break: node scripts/check.ts
import assert from "node:assert/strict";
import { formatPrice, slugify } from "../src/lib/format.ts";
import { menuTypeFromSlug, MENU_TYPES } from "../src/lib/types.ts";
import { passwordProblem } from "../src/lib/password.ts";
import { favouritesOf, moveBy } from "../src/lib/favourites.ts";

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

// Guest favourites: only is_featured counts, and featured_order decides the row.
const fav = (slug: string, is_featured: boolean, featured_order?: number) =>
  ({ slug, is_featured, featured_order });

assert.deepEqual(
  favouritesOf([fav("a", true, 2), fav("b", false, 0), fav("c", true, 1)]).map((i) => i.slug),
  ["c", "a"]
);
// A best seller that is not featured stays off the homepage.
assert.deepEqual(favouritesOf([{ slug: "x", is_featured: false, is_best_seller: true }]), []);
// Equal positions keep the menu's own order.
assert.deepEqual(
  favouritesOf([fav("a", true, 0), fav("b", true, 0), fav("c", true, 0)]).map((i) => i.slug),
  ["a", "b", "c"]
);
// A dish that predates the migration has no position at all.
assert.deepEqual(
  favouritesOf([fav("a", true, 1), fav("b", true)]).map((i) => i.slug),
  ["b", "a"]
);

// Reordering: swaps in range, refuses to fall off either end.
assert.deepEqual(moveBy([1, 2, 3], 2, -1), [1, 3, 2]);
assert.deepEqual(moveBy([1, 2, 3], 0, 1), [2, 1, 3]);
const edge = [1, 2, 3];
assert.equal(moveBy(edge, 0, -1), edge, "first item cannot move up");
assert.equal(moveBy(edge, 2, 1), edge, "last item cannot move down");
assert.equal(moveBy(edge, 9, 1), edge, "index outside the list is a no-op");

console.log("checks passed");
