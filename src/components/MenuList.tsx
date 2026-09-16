"use client";

import { Badge } from "@/components/Badge";
import { useLang } from "@/components/LanguageProvider";
import { formatPrice } from "@/lib/format";
import type { PricedItem } from "@/lib/types";

/**
 * Printed-menu rows with dotted leader lines, for dishes that have no photo.
 * A grid of empty placeholder tiles looks broken; this looks deliberate.
 * Leader-line technique adapted from "Restaurant Menu Block" by 7ovr on 21st.dev.
 */
export function MenuList({
  items,
  currency,
  qtyOf,
  onOpen,
  onAdd,
}: {
  items: PricedItem[];
  currency: string;
  qtyOf: (slug: string) => number;
  onOpen: (item: PricedItem) => void;
  onAdd: (item: PricedItem) => void;
}) {
  const { t } = useLang();

  return (
    <ul className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
      {items.map((item) => {
        const qty = qtyOf(item.slug);
        return (
          <li key={item.slug} className="menu-row -mx-2 flex items-start gap-3 rounded-xl px-2 py-1.5">
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="min-w-0 flex-1 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <span className="flex items-baseline gap-2">
                <span className="menu-row-name font-display text-lg leading-snug transition-colors">{item.name}</span>
                <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.25rem] border-b border-dotted border-line" />
                <span className="font-semibold tabular-nums">{formatPrice(item.price, currency)}</span>
              </span>

              {item.description && (
                <span className="mt-1 block text-sm text-muted">{item.description}</span>
              )}

              <span className="mt-1.5 flex flex-wrap gap-1.5 empty:hidden">
                {item.is_best_seller && <Badge>{t("badge.bestSeller")}</Badge>}
                {item.is_recommended && <Badge tone="muted">{t("badge.chefsPick")}</Badge>}
                {item.is_spicy && <Badge tone="red">{t("badge.spicy")}</Badge>}
                {!item.is_available && <Badge tone="muted">{t("badge.soldOut")}</Badge>}
              </span>
            </button>

            {item.is_available && (
              <button
                type="button"
                onClick={() => onAdd(item)}
                aria-label={t("order.add", { name: item.name })}
                className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-base leading-none transition hover:border-gold hover:bg-ink hover:text-ivory"
              >
                {qty > 0 ? <span className="text-sm font-semibold tabular-nums">{qty}</span> : "+"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
