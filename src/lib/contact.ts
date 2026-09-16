import type { MenuType, PricedItem, Restaurant } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { MENU_TYPES } from "@/lib/types";

/** Digits only, country code first — what wa.me expects. */
export function whatsappNumber(restaurant: Restaurant) {
  return restaurant.whatsapp?.replace(/\D/g, "") || null;
}

export function whatsappUrl(restaurant: Restaurant, message: string) {
  const n = whatsappNumber(restaurant);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

/** "Order on WhatsApp" from a dish, with the dish and price already typed out. */
export function orderItemUrl(restaurant: Restaurant, item: PricedItem, menuType?: MenuType) {
  const where = menuType ? MENU_TYPES.find((m) => m.type === menuType)?.label : null;
  return whatsappUrl(
    restaurant,
    `Hello ${restaurant.name}, I'd like to order:\n\n` +
      `• ${item.name} — ${formatPrice(item.price, restaurant.currency)}` +
      (where ? `\n\n(${where})` : "")
  );
}

export function enquiryUrl(restaurant: Restaurant) {
  return whatsappUrl(restaurant, `Hello ${restaurant.name}, I have a question about your menu.`);
}

export function telUrl(restaurant: Restaurant) {
  return restaurant.phone ? `tel:${restaurant.phone.replace(/[^\d+]/g, "")}` : null;
}

/** Keyless Google Maps URLs built from the address — no API key, no billing. */
export function mapsLinks(restaurant: Restaurant) {
  const q = restaurant.maps_query || restaurant.address;
  if (!q) return null;
  const query = encodeURIComponent(q.replace(/\n/g, ", "));
  return {
    embed: `https://maps.google.com/maps?q=${query}&output=embed`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    place: restaurant.maps_url || `https://www.google.com/maps/search/?api=1&query=${query}`,
  };
}
