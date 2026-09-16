"use client";

import { useEffect } from "react";
import { Badge } from "@/components/Badge";
import { useLang } from "@/components/LanguageProvider";
import { formatPrice } from "@/lib/format";
import type { PricedItem, Restaurant } from "@/lib/types";

export function ItemDialog({
  item,
  restaurant,
  onAdd,
  onClose,
}: {
  item: PricedItem | null;
  restaurant: Restaurant;
  onAdd: (item: PricedItem) => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;

  const currency = restaurant.currency;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface sm:rounded-3xl"
      >
        <div className="relative aspect-[4/3] w-full bg-line">
          {item.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-5xl text-muted/40">AQ</div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("dialog.close")}
            className="dialog-close absolute end-3 top-3 h-11 w-11 rounded-full bg-surface/90 text-xl leading-none shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 p-6">
          <div className="flex flex-wrap gap-1.5 empty:hidden">
            {item.is_best_seller && <Badge>{t("badge.bestSeller")}</Badge>}
            {item.is_recommended && <Badge tone="muted">{t("badge.chefsPick")}</Badge>}
            {item.is_spicy && <Badge tone="red">{t("badge.spicy")}</Badge>}
            {!item.is_available && <Badge tone="muted">{t("badge.soldOut")}</Badge>}
          </div>
          <h2 className="font-display text-2xl">{item.name}</h2>
          <p className="text-xl font-semibold">{formatPrice(item.price, currency)}</p>
          {item.description && <p className="leading-relaxed text-ink-soft">{item.description}</p>}

          {item.is_available && (
            <button
              type="button"
              onClick={() => {
                onAdd(item);
                onClose();
              }}
              className="dialog-add mt-2 w-full rounded-full bg-ink px-6 py-3 text-center text-sm font-medium text-ivory focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {t("dialog.add")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
