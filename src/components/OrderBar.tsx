"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { formatPrice } from "@/lib/format";
import { orderCount, orderTotal, orderUrl } from "@/lib/order";
import type { OrderLine } from "@/lib/order";
import type { MenuType, Restaurant } from "@/lib/types";

export function OrderBar({
  lines,
  restaurant,
  menuType,
  onSetQty,
  onClear,
}: {
  lines: OrderLine[];
  restaurant: Restaurant;
  menuType: MenuType;
  onSetQty: (slug: string, qty: number) => void;
  onClear: () => void;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  if (lines.length === 0) return null;

  const href = orderUrl(restaurant, menuType, lines);
  const count = orderCount(lines);
  const currency = restaurant.currency;

  return (
    <div className="order-bar-enter fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/97 backdrop-blur">
      {open && (
        <div className="mx-auto max-h-[45vh] max-w-6xl overflow-y-auto px-4 pt-4">
          <ul className="divide-y divide-line">
            {lines.map((l) => (
              <li key={l.slug} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="text-sm text-muted">{formatPrice(l.price, currency)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={t("order.less", { name: l.name })}
                    onClick={() => onSetQty(l.slug, l.qty - 1)}
                    className="qty-btn h-11 w-11 rounded-full border border-line text-lg leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm tabular-nums">{l.qty}</span>
                  <button
                    type="button"
                    aria-label={t("order.more", { name: l.name })}
                    onClick={() => onSetQty(l.slug, l.qty + 1)}
                    className="qty-btn h-11 w-11 rounded-full border border-line text-lg leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" onClick={onClear} className="clear-btn my-3 text-sm text-muted underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
            {t("order.clear")}
          </button>
        </div>
      )}

      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="review-btn flex-1 rounded-lg text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <span className="review-total block text-sm font-medium transition-colors">
            {t(count === 1 ? "order.item" : "order.items", { n: count })} · {formatPrice(orderTotal(lines), currency)}
          </span>
          <span className="block text-xs text-muted">{open ? t("order.hide") : t("order.review")}</span>
        </button>

        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="send-btn rounded-full bg-[#25D366] px-6 py-3 text-sm font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            {t("order.send")}
          </a>
        )}
      </div>
    </div>
  );
}
