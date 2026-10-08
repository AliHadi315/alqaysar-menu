import data from "@/data/menu.json";
import { favouritesOf } from "@/lib/favourites";
import { OFFERS_GROUP } from "@/lib/types";
import type { Category, MenuData, MenuType, PricedItem, Restaurant } from "@/lib/types";

/**
 * The whole menu is one JSON file baked into the build — no database, no API.
 * Regenerate it from the restaurant's live menu with `npm run import`.
 */
const menu = data as unknown as MenuData;

export function getRestaurant(): Restaurant {
  return menu.restaurant;
}

/**
 * Menu sections in order. On Take Away the Offers group is pulled to the top —
 * the deals are why most people open that menu.
 *
 * Tables keeps the printed order on purpose: every offer but one is take-away
 * only, so pinning a one-dish section above the food would read as a mistake.
 */
export function getCategories(menuType?: MenuType): Category[] {
  const ordered = [...menu.categories].sort((a, b) => a.display_order - b.display_order);
  if (menuType !== "TAKE_AWAY") return ordered;

  const offers = ordered.filter((c) => c.group === OFFERS_GROUP);
  return offers.length ? [...offers, ...ordered.filter((c) => c.group !== OFFERS_GROUP)] : ordered;
}

/** Dishes on one menu, each with that menu's price. */
export function getMenuItems(menuType: MenuType): PricedItem[] {
  return menu.items
    .filter((i) => i.menus.includes(menuType))
    .map((i) => ({ ...i, price: i.prices[menuType]! }));
}

/**
 * Guest favourites for the landing page, in the order the owner chose.
 * Dine-in price, falling back to take away.
 *
 * Best seller is a badge, not a homepage slot: ticking it used to push a dish
 * up here as a side effect, which made the section impossible to curate.
 */
export function getFeatured(limit = 8): PricedItem[] {
  return favouritesOf(menu.items.filter((i) => i.is_available))
    .map((i) => ({ ...i, price: i.prices.TABLES ?? i.prices.TAKE_AWAY! }))
    .slice(0, limit);
}
