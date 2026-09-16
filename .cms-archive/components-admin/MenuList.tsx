"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteItem, setItemFlag } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import { MENU_TYPES } from "@/lib/types";
import type { Category, MenuItemWithAvailability, MenuType } from "@/lib/types";

export function MenuList({
  items,
  categories,
  currency,
}: {
  items: MenuItemWithAvailability[];
  categories: Category[];
  currency: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [menuFilter, setMenuFilter] = useState<MenuType | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [error, setError] = useState("");

  const categoryName = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (menuFilter === "ALL" || i.menu_types.includes(menuFilter)) &&
        (categoryFilter === "ALL" || i.category_id === categoryFilter) &&
        (!q || i.name.toLowerCase().includes(q))
    );
  }, [items, query, menuFilter, categoryFilter]);

  const run = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setError(res?.error ?? "");
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items..."
          className="h-11 min-w-[200px] flex-1 rounded-lg border border-line px-3 outline-none focus:border-gold"
        />
        <select
          value={menuFilter}
          onChange={(e) => setMenuFilter(e.target.value as MenuType | "ALL")}
          className="h-11 rounded-lg border border-line px-3"
        >
          <option value="ALL">All menus</option>
          {MENU_TYPES.map((m) => (
            <option key={m.type} value={m.type}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-11 rounded-lg border border-line px-3"
        >
          <option value="ALL">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <p className="text-sm text-muted">{visible.length} items</p>

      <div className="divide-y divide-line rounded-xl border border-line">
        {visible.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-line">
              {item.image_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.image_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>

            <div className="min-w-[160px] flex-1">
              <p className="font-medium">
                {item.name}
                {!item.is_active && <span className="ms-2 text-xs text-muted">(hidden)</span>}
                {!item.is_available && <span className="ms-2 text-xs text-red-700">(sold out)</span>}
              </p>
              <p className="text-sm text-muted">
                {categoryName[item.category_id] ?? "-"} &middot; {formatPrice(item.price, currency)} &middot;{" "}
                {item.menu_types.length
                  ? item.menu_types.map((t) => MENU_TYPES.find((m) => m.type === t)?.label).join(" + ")
                  : "no menu"}
              </p>
            </div>

            <div className="flex gap-2 text-sm">
              <Link href={"/admin/menu/" + item.id} className="rounded-lg border border-line px-3 py-2">
                Edit
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => setItemFlag(item.id, "is_available", !item.is_available))}
                className="rounded-lg border border-line px-3 py-2"
              >
                {item.is_available ? "Sold out" : "In stock"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => setItemFlag(item.id, "is_active", !item.is_active))}
                className="rounded-lg border border-line px-3 py-2"
              >
                {item.is_active ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm("Delete " + item.name + "? This cannot be undone.")) run(() => deleteItem(item.id));
                }}
                className="rounded-lg border border-line px-3 py-2 text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {visible.length === 0 && <p className="p-6 text-center text-muted">No items match those filters.</p>}
      </div>
    </div>
  );
}
