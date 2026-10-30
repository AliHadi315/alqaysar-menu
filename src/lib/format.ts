export function formatPrice(price: number | string, currency = "₱") {
  const n = Number(price);
  if (!Number.isFinite(n)) return "";
  return `${currency}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/**
 * The lira figure shown beside a dollar price.
 *
 * Rounded to the nearest 10,000 because that is how the restaurant already
 * prints it and what a till can actually hand back — $11.11 at 90,000 is
 * 999,900, which reads like a mistake. That rounding is why the dollar price
 * stays the authoritative one, including in the WhatsApp order.
 *
 * Returns "" for a missing or nonsense rate, so the line simply disappears
 * rather than rendering "NaN L.L.".
 */
export function formatLbp(usd: number | string, rate: number | undefined | null) {
  const n = Number(usd);
  const r = Number(rate);
  if (!Number.isFinite(n) || !Number.isFinite(r) || r <= 0) return "";
  const rounded = Math.round((n * r) / 10000) * 10000;
  return `${rounded.toLocaleString("en-US")} L.L.`;
}
