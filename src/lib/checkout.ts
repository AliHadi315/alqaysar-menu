// Type-only import on purpose: this module is exercised directly by
// `npm run check`, which runs under plain node and cannot resolve "@/".
import type { DeliveryZone, MenuType } from "@/lib/types";

/**
 * What the customer types before the order goes to WhatsApp. Nothing here is
 * stored on a server — the restaurant has no backend for orders — it only ends
 * up in the message the customer sends from their own WhatsApp.
 */
export type CustomerDetails = {
  name: string;
  phone: string;
  /** Delivery only: which area, which also decides the fee. */
  zone?: string;
  /** Delivery only. */
  address?: string;
};

/** Digits in a phone number, ignoring spaces, dashes and a leading +. */
const digits = (v: string) => v.replace(/\D/g, "").length;

/**
 * Returns the i18n key of the first thing wrong, or null when the details are
 * good enough to send. Deliberately loose on the phone: Lebanese numbers get
 * written 70 678 929, 03/123456, +961 70 678 929 and plenty else, so this only
 * catches an empty or obviously truncated box rather than policing format.
 */
export function checkoutProblem(
  menuType: MenuType,
  details: CustomerDetails,
  zones: DeliveryZone[] = []
): string | null {
  if (!details.name.trim()) return "checkout.needName";
  if (digits(details.phone) < 6) return "checkout.needPhone";

  if (!needsAddress(menuType)) return null;
  // Only ask for an area when the restaurant has actually listed some.
  if (zones.length > 0 && !details.zone?.trim()) return "checkout.needZone";
  if (!details.address?.trim()) return "checkout.needAddress";
  return null;
}

/** Delivery is the only mode that needs somewhere to send the food. */
export const needsAddress = (menuType: MenuType) => menuType === "DELIVERY";

/** The fee for one area. Unknown or unlisted areas cost nothing rather than guessing. */
export function deliveryFeeFor(zones: DeliveryZone[] = [], zoneName?: string): number {
  if (!zoneName) return 0;
  const hit = zones.find((z) => z.name === zoneName);
  const fee = Number(hit?.fee);
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
}

/**
 * Subtotal, fee and total. Split out so the message and the sheet can never
 * disagree about what the customer is being asked to pay.
 */
export function orderTotals(subtotal: number, fee: number) {
  return { subtotal, fee, total: subtotal + fee };
}
