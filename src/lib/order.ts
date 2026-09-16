import { formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/lib/contact";
import { MENU_TYPES } from "@/lib/types";
import type { MenuType, Restaurant } from "@/lib/types";

export type OrderLine = { slug: string; name: string; price: number; qty: number };

export const orderTotal = (lines: OrderLine[]) =>
  lines.reduce((sum, l) => sum + l.price * l.qty, 0);

export const orderCount = (lines: OrderLine[]) =>
  lines.reduce((sum, l) => sum + l.qty, 0);

/** The whole basket as one WhatsApp message the restaurant can read at a glance. */
export function orderMessage(restaurant: Restaurant, menuType: MenuType, lines: OrderLine[]) {
  const label = MENU_TYPES.find((m) => m.type === menuType)!.label;
  const body = lines
    .map((l) => `• ${l.qty} × ${l.name} — ${formatPrice(l.price * l.qty, restaurant.currency)}`)
    .join("\n");

  return (
    `Hello ${restaurant.name}, I'd like to order (${label}):\n\n` +
    `${body}\n\n` +
    `Total: ${formatPrice(orderTotal(lines), restaurant.currency)}`
  );
}

export function orderUrl(restaurant: Restaurant, menuType: MenuType, lines: OrderLine[]) {
  if (lines.length === 0) return null;
  return whatsappUrl(restaurant, orderMessage(restaurant, menuType, lines));
}

/** Prices differ per menu, so each menu keeps its own basket. */
export const orderStorageKey = (menuType: MenuType) => `alqaysr.order.${menuType}`;

export function loadOrder(menuType: MenuType): OrderLine[] {
  try {
    const raw = localStorage.getItem(orderStorageKey(menuType));
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) =>
        l && typeof l.slug === "string" && typeof l.name === "string" &&
        typeof l.price === "number" && typeof l.qty === "number" && l.qty > 0
    );
  } catch {
    return []; // private window, blocked storage, corrupted value
  }
}

export function saveOrder(menuType: MenuType, lines: OrderLine[]) {
  try {
    localStorage.setItem(orderStorageKey(menuType), JSON.stringify(lines));
  } catch {}
}
