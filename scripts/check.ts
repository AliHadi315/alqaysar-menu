// Smallest thing that fails if the menu helpers break: node scripts/check.ts
import assert from "node:assert/strict";
import { formatLbp, formatPrice, slugify } from "../src/lib/format.ts";
import { menuTypeFromSlug, MENU_TYPES } from "../src/lib/types.ts";
import { passwordProblem } from "../src/lib/password.ts";
import { favouritesOf, moveBy } from "../src/lib/favourites.ts";
import { checkoutProblem, deliveryFeeFor, needsAddress } from "../src/lib/checkout.ts";
import { PRICE_LIST } from "../src/lib/types.ts";

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
// Three things a customer can pick, each resolving to a stored price list,
// each with its own route. A count alone would not have caught a bad mapping.
assert.equal(MENU_TYPES.length, 3);
assert.deepEqual(MENU_TYPES.map((m) => m.slug), ["takeaway", "delivery", "tables"]);
for (const m of MENU_TYPES) {
  assert.ok(PRICE_LIST[m.type], `${m.type} has no price list`);
  assert.equal(menuTypeFromSlug(m.slug), m.type);
}

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

// Lira conversion: rounded to the nearest 10,000, the way the kitchen prints it.
assert.equal(formatLbp(20, 90000), "1,800,000 L.L.");        // matches their own offer photos
assert.equal(formatLbp(11.11, 90000), "1,000,000 L.L.");     // 999,900 would read as a mistake
assert.equal(formatLbp(4.44, 90000), "400,000 L.L.");        // 399,600 rounds up
assert.equal(formatLbp("3.80", 90000), "340,000 L.L.");      // strings arrive from PostgREST
assert.equal(formatLbp(0, 90000), "0 L.L.");
// A missing or nonsense rate hides the line instead of printing NaN.
assert.equal(formatLbp(20, undefined), "");
assert.equal(formatLbp(20, 0), "");
assert.equal(formatLbp(20, -1), "");
assert.equal(formatLbp("not a price", 90000), "");

// Delivery sells the take-away price list; only Tables is its own.
assert.equal(PRICE_LIST.TAKE_AWAY, "TAKE_AWAY");
assert.equal(PRICE_LIST.DELIVERY, "TAKE_AWAY");
assert.equal(PRICE_LIST.TABLES, "TABLES");
assert.equal(needsAddress("DELIVERY"), true);
assert.equal(needsAddress("TAKE_AWAY"), false);
assert.equal(needsAddress("TABLES"), false);

const ZONES = [
  { name: "Dahye", fee: 2 },
  { name: "Beirut", fee: 3 },
  { name: "Mount Lebanon", fee: 5 },
];
assert.equal(deliveryFeeFor(ZONES, "Beirut"), 3);
assert.equal(deliveryFeeFor(ZONES, "Nowhere"), 0, "an unlisted area costs nothing, never a guess");
assert.equal(deliveryFeeFor(ZONES, undefined), 0);
assert.equal(deliveryFeeFor([], "Beirut"), 0);
assert.equal(deliveryFeeFor([{ name: "Odd", fee: -4 }], "Odd"), 0, "a negative fee cannot discount an order");

// Name and phone are needed everywhere; the address only where food is driven.
const ok = { name: "Ali", phone: "70678929" };
assert.equal(checkoutProblem("TAKE_AWAY", ok), null);
assert.equal(checkoutProblem("TABLES", ok), null);
assert.equal(checkoutProblem("TAKE_AWAY", { name: " ", phone: "70678929" }), "checkout.needName");
assert.equal(checkoutProblem("TAKE_AWAY", { name: "Ali", phone: "" }), "checkout.needPhone");
assert.equal(checkoutProblem("TAKE_AWAY", { name: "Ali", phone: "123" }), "checkout.needPhone");
// Written the way people actually write Lebanese numbers.
assert.equal(checkoutProblem("TAKE_AWAY", { name: "Ali", phone: "+961 70 678 929" }), null);
assert.equal(checkoutProblem("TAKE_AWAY", { name: "Ali", phone: "03/123456" }), null);

assert.equal(checkoutProblem("DELIVERY", ok, ZONES), "checkout.needZone");
assert.equal(checkoutProblem("DELIVERY", { ...ok, zone: "Beirut" }, ZONES), "checkout.needAddress");
assert.equal(checkoutProblem("DELIVERY", { ...ok, zone: "Beirut", address: "Hamra St" }, ZONES), null);
// With no areas listed the picker is hidden, so it must not block the order.
assert.equal(checkoutProblem("DELIVERY", { ...ok, address: "Hamra St" }, []), null);

console.log("checks passed");
