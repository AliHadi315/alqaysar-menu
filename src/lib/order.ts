import { formatLbp, formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/lib/contact";
import { MENU_TYPES } from "@/lib/types";
import { deliveryFeeFor, needsAddress, orderTotals } from "@/lib/checkout";
import type { CustomerDetails } from "@/lib/checkout";
import type { MenuType, Restaurant } from "@/lib/types";

export type OrderLine = { slug: string; name: string; price: number; qty: number };

export const orderTotal = (lines: OrderLine[]) =>
  lines.reduce((sum, l) => sum + l.price * l.qty, 0);

export const orderCount = (lines: OrderLine[]) =>
  lines.reduce((sum, l) => sum + l.qty, 0);

/** Both currencies on one line, lira in brackets because it is rounded. */
function money(amount: number, restaurant: Restaurant) {
  const lbp = formatLbp(amount, restaurant.lbp_rate);
  return formatPrice(amount, restaurant.currency) + (lbp ? ` (${lbp})` : "");
}

/**
 * The whole basket as one WhatsApp message the restaurant can read at a glance,
 * with the customer's details underneath so whoever answers can confirm it, or
 * drive to it, without a second exchange.
 */
export function orderMessage(
  restaurant: Restaurant,
  menuType: MenuType,
  lines: OrderLine[],
  details?: CustomerDetails
) {
  const label = MENU_TYPES.find((m) => m.type === menuType)!.label;
  const body = lines
    .map((l) => `• ${l.qty} × ${l.name} — ${money(l.price * l.qty, restaurant)}`)
    .join("\n");

  const subtotal = orderTotal(lines);
  const fee = needsAddress(menuType)
    ? deliveryFeeFor(restaurant.delivery_zones, details?.zone)
    : 0;
  const { total } = orderTotals(subtotal, fee);

  // A fee of zero stays out of the message rather than printing "Delivery: $0.00".
  const totals = fee
    ? `Subtotal: ${money(subtotal, restaurant)}\n` +
      `Delivery${details?.zone ? ` (${details.zone})` : ""}: ${money(fee, restaurant)}\n` +
      `Total: ${money(total, restaurant)}`
    : `Total: ${money(total, restaurant)}`;

  const who = details
    ? "\n\n" +
      [
        `Name: ${details.name.trim()}`,
        `Phone: ${details.phone.trim()}`,
        details.zone ? `Area: ${details.zone}` : null,
        details.address?.trim() ? `Address: ${details.address.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return `Hello ${restaurant.name}, I'd like to order (${label}):\n\n${body}\n\n${totals}${who}`;
}

export function orderUrl(
  restaurant: Restaurant,
  menuType: MenuType,
  lines: OrderLine[],
  details?: CustomerDetails
) {
  if (lines.length === 0) return null;
  return whatsappUrl(restaurant, orderMessage(restaurant, menuType, lines, details));
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

/** The customer's details, remembered on their device like the basket is. */
const DETAILS_KEY = "alqaysr.details";

export function loadDetails(): CustomerDetails {
  const empty = { name: "", phone: "", zone: "", address: "" };
  try {
    const parsed = JSON.parse(localStorage.getItem(DETAILS_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return empty;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      zone: typeof parsed.zone === "string" ? parsed.zone : "",
      address: typeof parsed.address === "string" ? parsed.address : "",
    };
  } catch {
    return empty;
  }
}

export function saveDetails(details: CustomerDetails) {
  try {
    localStorage.setItem(DETAILS_KEY, JSON.stringify(details));
  } catch {}
}
