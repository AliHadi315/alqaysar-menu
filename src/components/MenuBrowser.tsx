"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { MenuCard } from "@/components/MenuCard";
import { MenuList } from "@/components/MenuList";
import { Reveal } from "@/components/Reveal";
import { ItemDialog } from "@/components/ItemDialog";
import { OrderBar } from "@/components/OrderBar";
import { loadOrder, saveOrder } from "@/lib/order";
import type { OrderLine } from "@/lib/order";
import type { Category, MenuType, PricedItem, Restaurant } from "@/lib/types";

export function MenuBrowser({
  categories,
  items,
  restaurant,
  menuType,
}: {
  categories: Category[];
  items: PricedItem[];
  restaurant: Restaurant;
  menuType: MenuType;
}) {
  const { t } = useLang();
  const currency = restaurant.currency;
  const [lines, setLines] = useState<OrderLine[]>([]);

  // Restore after mount: the page is statically rendered, so this must not run on the server.
  useEffect(() => setLines(loadOrder(menuType)), [menuType]);
  useEffect(() => saveOrder(menuType, lines), [menuType, lines]);

  const addItem = useCallback((item: PricedItem) => {
    setLines((prev) => {
      const found = prev.find((l) => l.slug === item.slug);
      return found
        ? prev.map((l) => (l.slug === item.slug ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { slug: item.slug, name: item.name, price: item.price, qty: 1 }];
    });
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.slug !== slug) : prev.map((l) => (l.slug === slug ? { ...l, qty } : l))
    );
  }, []);

  const qtyOf = useCallback((slug: string) => lines.find((l) => l.slug === slug)?.qty ?? 0, [lines]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<PricedItem | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Only categories that actually have items on this menu.
  const sections = useMemo(
    () =>
      categories
        .map((c) => ({ category: c, items: items.filter((i) => i.category_slug === c.slug) }))
        .filter((s) => s.items.length > 0),
    [categories, items]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const scrollTo = (slug: string) => {
    sectionRefs.current[slug]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-line bg-ivory/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <label className="relative block">
            <span className="sr-only">{t("menu.searchLabel")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("menu.search")}
              className="search-field h-12 w-full rounded-full border border-line bg-surface px-5 text-base outline-none"
            />
          </label>
        </div>

        {!results && sections.length > 0 && (
          <div className="no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
            {sections.map(({ category }) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => scrollTo(category.slug)}
                className="cat-chip min-h-11 shrink-0 rounded-full border border-line bg-surface px-4 py-2.5 text-sm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-32 pt-8">
        {results ? (
          results.length === 0 ? (
            <p className="py-16 text-center text-muted">{t("menu.noMatch")}</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">{t("menu.results", { n: results.length })}</p>
              <Grid items={results} currency={currency} onOpen={setActive} onAdd={addItem} qtyOf={qtyOf} />
            </>
          )
        ) : sections.length === 0 ? (
          <p className="py-16 text-center text-muted">{t("menu.updating")}</p>
        ) : (
          <div className="space-y-12">
            {sections.map(({ category, items: catItems }) => (
              <section
                key={category.slug}
                id={category.slug}
                ref={(el) => {
                  sectionRefs.current[category.slug] = el;
                }}
                className="scroll-mt-36"
              >
                <Reveal blur={false}>
                  <h2 className="mb-1 font-display text-2xl">{category.name}</h2>
                  {category.description && <p className="mb-4 text-sm text-muted">{category.description}</p>}
                  <div className="mt-4">
                    <Grid items={catItems} currency={currency} onOpen={setActive} onAdd={addItem} qtyOf={qtyOf} />
                  </div>
                </Reveal>
              </section>
            ))}
          </div>
        )}
      </div>

      <ItemDialog item={active} restaurant={restaurant} onAdd={addItem} onClose={() => setActive(null)} />

      <OrderBar
        lines={lines}
        restaurant={restaurant}
        menuType={menuType}
        onSetQty={setQty}
        onClear={() => setLines([])}
      />
    </>
  );
}

/**
 * Dishes with a photo become cards; the rest become printed-menu rows.
 * 89 of 167 dishes have no photo, and a grid of blank tiles reads as broken.
 */
function Grid({
  items,
  currency,
  onOpen,
  onAdd,
  qtyOf,
}: {
  items: PricedItem[];
  currency: string;
  onOpen: (item: PricedItem) => void;
  onAdd: (item: PricedItem) => void;
  qtyOf: (slug: string) => number;
}) {
  const withPhoto = items.filter((i) => i.image_url);
  const withoutPhoto = items.filter((i) => !i.image_url);

  return (
    <div className="space-y-6">
      {withPhoto.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {withPhoto.map((item) => (
            <MenuCard
              key={item.slug}
              item={item}
              currency={currency}
              qty={qtyOf(item.slug)}
              onOpen={() => onOpen(item)}
              onAdd={() => onAdd(item)}
            />
          ))}
        </div>
      )}

      {withoutPhoto.length > 0 && (
        <MenuList items={withoutPhoto} currency={currency} qtyOf={qtyOf} onOpen={onOpen} onAdd={onAdd} />
      )}
    </div>
  );
}
