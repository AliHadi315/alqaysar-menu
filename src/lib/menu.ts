import data from "@/data/menu.json";
import type { Category, MenuData, MenuType, PricedItem, Restaurant } from "@/lib/types";

/**
 * The whole menu is one JSON file baked into the build — no database, no API.
 * Regenerate it from the restaurant's live menu with `npm run import`.
 */
const menu = data as unknown as MenuData;

export function getRestaurant(): Restaurant {
  return menu.restaurant;
}

export function getCategories(): Category[] {
  return [...menu.categories].sort((a, b) => a.display_order - b.display_order);
}

/** Dishes on one menu, each with that menu's price. */
export function getMenuItems(menuType: MenuType): PricedItem[] {
  return menu.items
    .filter((i) => i.menus.includes(menuType))
    .map((i) => ({ ...i, price: i.prices[menuType]! }));
}

/** Highlights for the landing page. Dine-in price, falling back to take away. */
export function getFeatured(limit = 8): PricedItem[] {
  return menu.items
    .filter((i) => i.is_available && (i.is_featured || i.is_best_seller))
    .map((i) => ({ ...i, price: i.prices.TABLES ?? i.prices.TAKE_AWAY! }))
    .slice(0, limit);
}
