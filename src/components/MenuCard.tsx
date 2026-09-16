"use client";

import { Badge } from "@/components/Badge";
import { useLang } from "@/components/LanguageProvider";
import { formatPrice } from "@/lib/format";
import type { PricedItem } from "@/lib/types";

export function MenuCard({
  item,
  currency,
  qty,
  onOpen,
  onAdd,
}: {
  item: PricedItem;
  currency: string;
  qty: number;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const { t } = useLang();
  return (
    // The add button is a sibling, not a child, so we never nest <button>s.
    <div className="menu-card relative rounded-2xl">
      <button
        type="button"
        onClick={onOpen}
        className="menu-card-frame flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface text-start transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-line">
          {item.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              decoding="async"
              className="menu-card-img h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-3xl text-muted/40">AQ</div>
          )}
          {!item.is_available && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/55">
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide">{t("badge.soldOut")}</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap gap-1.5 empty:hidden">
            {item.is_best_seller && <Badge>{t("badge.bestSeller")}</Badge>}
            {item.is_recommended && <Badge tone="muted">{t("badge.chefsPick")}</Badge>}
            {item.is_spicy && <Badge tone="red">{t("badge.spicy")}</Badge>}
          </div>
          <h3 className="font-display text-lg leading-snug">{item.name}</h3>
          {item.description && <p className="line-clamp-2 text-sm text-muted">{item.description}</p>}
          <p className="mt-auto pe-10 pt-2 text-base font-semibold text-ink">{formatPrice(item.price, currency)}</p>
        </div>
      </button>

      {item.is_available && (
        <button
          type="button"
          onClick={onAdd}
          aria-label={t("order.add", { name: item.name })}
          className="menu-card-cta absolute bottom-3 end-3 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-lg leading-none text-ivory transition hover:bg-gold hover:text-ink"
        >
          {qty > 0 ? <span className="text-sm font-semibold tabular-nums">{qty}</span> : "+"}
        </button>
      )}
    </div>
  );
}
