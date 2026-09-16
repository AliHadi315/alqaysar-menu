"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { saveItem } from "@/app/admin/actions";
import { MENU_TYPES } from "@/lib/types";
import type { Category, MenuItemWithAvailability } from "@/lib/types";

const field = "mt-1 h-11 w-full rounded-lg border border-line px-3 outline-none focus:border-gold";

export function ItemForm({ categories, item }: { categories: Category[]; item?: MenuItemWithAvailability }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    const result = await saveItem(item?.id ?? null, formData);
    setBusy(false);
    if (result?.error) setError(result.error);
  }

  const checkbox = (n: string, label: string, checked: boolean) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={n} defaultChecked={checked} className="h-4 w-4" />
      {label}
    </label>
  );

  return (
    <form action={onSubmit} className="max-w-2xl space-y-5">
      <label className="block text-sm">
        Name
        <input name="name" required maxLength={100} defaultValue={item?.name} className={field} />
      </label>

      <label className="block text-sm">
        Description
        <textarea
          name="description"
          maxLength={500}
          rows={3}
          defaultValue={item?.description ?? ""}
          className="mt-1 w-full rounded-lg border border-line p-3 outline-none focus:border-gold"
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          Price
          <input name="price" type="number" step="0.01" min="0" required defaultValue={item?.price} className={field} />
        </label>

        <label className="block text-sm">
          Category
          <select name="category_id" required defaultValue={item?.category_id ?? ""} className={field}>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-medium">Available in</legend>
        <div className="flex gap-6">
          {MENU_TYPES.map((m) => (
            <label key={m.type} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="menu_types"
                value={m.type}
                defaultChecked={item ? item.menu_types.includes(m.type) : true}
                className="h-4 w-4"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="text-sm">
        Image
        <div className="mt-1">
          <ImageUpload name="image_url" initialUrl={item?.image_url} />
        </div>
      </div>

      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-medium">Status and labels</legend>
        <div className="grid grid-cols-2 gap-3">
          {checkbox("is_active", "Show on website", item?.is_active ?? true)}
          {checkbox("is_available", "In stock", item?.is_available ?? true)}
          {checkbox("is_featured", "Featured", item?.is_featured ?? false)}
          {checkbox("is_best_seller", "Best seller", item?.is_best_seller ?? false)}
          {checkbox("is_recommended", "Chefs pick", item?.is_recommended ?? false)}
          {checkbox("is_spicy", "Spicy", item?.is_spicy ?? false)}
        </div>
      </fieldset>

      <label className="block max-w-[200px] text-sm">
        Sort order
        <input name="display_order" type="number" min="0" defaultValue={item?.display_order ?? 0} className={field} />
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="rounded-lg bg-ink px-6 py-3 text-sm text-ivory disabled:opacity-60">
          {busy ? "Saving..." : item ? "Save changes" : "Save item"}
        </button>
        <Link href="/admin/menu" className="rounded-lg border border-line px-6 py-3 text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}
