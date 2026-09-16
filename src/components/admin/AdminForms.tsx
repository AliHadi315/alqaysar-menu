"use client";

import { useState } from "react";
import { MENU_TYPES } from "@/lib/types";
import type { MenuType } from "@/lib/types";
import { removeCategory, saveCategory, saveItem, saveRestaurant, uploadImage } from "@/lib/admin";
import type { AdminCategory, AdminItem } from "@/lib/admin";

type Say = (text: string, kind?: "ok" | "bad") => void;

const area = "mt-1 w-full rounded-lg border border-line p-3";

/** Add or edit one dish, including a separate price per menu. */
export function ItemForm({
  item,
  categories,
  onDone,
  onCancel,
  onError,
}: {
  item: AdminItem | null;
  categories: AdminCategory[];
  onDone: (message: string) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  // Deliberately not defaulted to the first category: a new dish silently
  // landing in "Sandwiches" is worse than being asked.
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "");
  const [prices, setPrices] = useState<Record<string, string>>({
    TABLES: item?.prices.TABLES != null ? String(item.prices.TABLES) : "",
    TAKE_AWAY: item?.prices.TAKE_AWAY != null ? String(item.prices.TAKE_AWAY) : "",
  });
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [flags, setFlags] = useState({
    is_available: item?.is_available ?? true,
    is_active: item?.is_active ?? true,
    is_featured: item?.is_featured ?? false,
    is_best_seller: item?.is_best_seller ?? false,
    is_recommended: item?.is_recommended ?? false,
    is_spicy: item?.is_spicy ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed: Partial<Record<MenuType, number>> = {};
    for (const m of MENU_TYPES) {
      const raw = prices[m.type].trim();
      if (raw === "") continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) {
        setError("Prices must be zero or more.");
        return;
      }
      parsed[m.type] = n;
    }
    if (Object.keys(parsed).length === 0) {
      setError("Give the dish a price on at least one menu, otherwise it appears nowhere.");
      return;
    }
    if (!categoryId) {
      setError("Choose which category this dish belongs to.");
      return;
    }

    setBusy(true);
    try {
      await saveItem({
        id: item?.id,
        slug: item?.slug,
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || null,
        image_url: imageUrl || null,
        display_order: item?.display_order ?? 0,
        ...flags,
        prices: parsed,
      });
      onDone(name.trim() + (item ? " updated" : " added"));
    } catch (e) {
      const message = (e as Error).message;
      setError(message);
      onError(message);
    } finally {
      setBusy(false);
    }
  }

  const toggle = (key: keyof typeof flags, label: string) => (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={flags[key]}
        onChange={(e) => setFlags({ ...flags, [key]: e.target.checked })}
        className="h-5 w-5"
      />
      {label}
    </label>
  );

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <h1 className="font-display text-2xl">{item ? "Edit dish" : "Add dish"}</h1>

      <label className="block text-sm">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          className="a-input mt-1"
        />
      </label>

      <label className="block text-sm">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          className={area}
        />
      </label>

      <label className="block max-w-sm text-sm">
        Category (which menu section it appears under)
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="a-input mt-1"
        >
          <option value="" disabled>
            Choose a category…
          </option>
          {[...categories]
            .sort((a, b) => a.display_order - b.display_order)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.is_active ? "" : " (hidden)"}
              </option>
            ))}
        </select>
      </label>

      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-medium">Price on each menu</legend>
        <p className="mb-3 text-sm text-muted">
          Leave a box empty to keep the dish off that menu. A different price on each is fine.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {MENU_TYPES.map((m) => (
            <label key={m.type} className="block text-sm">
              {m.label}
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={prices[m.type]}
                onChange={(e) => setPrices({ ...prices, [m.type]: e.target.value })}
                placeholder="not on this menu"
                className="a-input mt-1"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="text-sm">
        Photo
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-line">
            {uploading ? (
              <div className="a-skeleton h-full w-full" />
            ) : (
              imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              )
            )}
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setError("");
              try {
                setImageUrl(await uploadImage(file));
              } catch (err) {
                const message = (err as Error).message;
                setError(message);
                onError(message);
              } finally {
                setUploading(false);
              }
            }}
            className="text-sm file:me-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-ink file:px-4 file:text-sm file:text-ivory"
          />

          {imageUrl && !uploading && (
            <button type="button" onClick={() => setImageUrl("")} className="a-btn a-btn-ghost">
              Remove photo
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">JPG, PNG or WebP, up to 5 MB.</p>
      </div>

      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-medium">Status and labels</legend>
        <div className="grid grid-cols-2 gap-2">
          {toggle("is_active", "Show on the website")}
          {toggle("is_available", "In stock")}
          {toggle("is_featured", "Featured on the homepage")}
          {toggle("is_best_seller", "Best seller badge")}
          {toggle("is_recommended", "Chef's pick badge")}
          {toggle("is_spicy", "Spicy badge")}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy || uploading} className="a-btn a-btn-primary">
          {busy ? "Saving…" : item ? "Save changes" : "Add dish"}
        </button>
        <button type="button" onClick={onCancel} className="a-btn a-btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

const GROUPS = ["Food", "Drinks", "Dessert", "Shisha", "Offers", "Other"];

export function CategoryEditor({
  categories,
  onDone,
  onSay,
}: {
  categories: AdminCategory[];
  onDone: () => void;
  onSay: Say;
}) {
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, message: string) => {
    setBusy(true);
    try {
      await fn();
      await onDone();
      onSay(message);
    } catch (e) {
      onSay((e as Error).message, "bad");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl">Categories</h1>
        <p className="mt-1 text-sm text-muted">
          These are the sections of the menu. The order number decides where each appears.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          run(async () => {
            await saveCategory({
              name: newName.trim(),
              group: "Food",
              display_order: categories.length,
              is_active: true,
            });
            setNewName("");
          }, "Category added");
        }}
        className="flex flex-wrap gap-3 rounded-xl border border-line p-4"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          aria-label="New category name"
          className="a-input flex-1 basis-48"
        />
        <button disabled={busy} className="a-btn a-btn-primary">
          Add category
        </button>
      </form>

      <div className="divide-y divide-line rounded-xl border border-line">
        {categories.map((c) => (
          <div key={c.id} className="a-row flex flex-wrap items-center gap-3 p-3">
            <input
              defaultValue={c.name}
              aria-label={"Name of " + c.name}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== c.name) {
                  run(() => saveCategory({ id: c.id, slug: c.slug, name: value }), "Renamed to " + value);
                }
              }}
              className="a-input min-w-[160px] flex-1"
            />

            <select
              defaultValue={c.group}
              aria-label={"Group of " + c.name}
              onChange={(e) =>
                run(() => saveCategory({ id: c.id, slug: c.slug, group: e.target.value }), c.name + " moved")
              }
              className="a-input w-auto text-sm"
            >
              {GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>

            <input
              type="number"
              defaultValue={c.display_order}
              aria-label={"Order of " + c.name}
              title="Order on the menu"
              onBlur={(e) =>
                run(
                  () => saveCategory({ id: c.id, slug: c.slug, display_order: Number(e.target.value) }),
                  c.name + " reordered"
                )
              }
              className="a-input w-20"
            />

            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                defaultChecked={c.is_active}
                onChange={(e) =>
                  run(
                    () => saveCategory({ id: c.id, slug: c.slug, is_active: e.target.checked }),
                    c.name + (e.target.checked ? " shown" : " hidden")
                  )
                }
                className="h-5 w-5"
              />
              Visible
            </label>

            <button
              disabled={busy}
              onClick={() => {
                if (confirm("Delete " + c.name + "?")) run(() => removeCategory(c.id), c.name + " deleted");
              }}
              className="a-btn a-btn-danger"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const SETTING_FIELDS: { key: string; label: string; type?: string }[] = [
  { key: "name", label: "Restaurant name" },
  { key: "tagline", label: "Tagline" },
  { key: "established", label: "Line above the name (e.g. Since 2015)" },
  { key: "currency", label: "Currency symbol" },
  { key: "phone", label: "Phone" },
  { key: "whatsapp", label: "WhatsApp number (international)" },
  { key: "email", label: "Email", type: "email" },
  { key: "opening_hours", label: "Opening hours" },
  { key: "maps_query", label: "Map search override" },
  { key: "instagram_url", label: "Instagram URL", type: "url" },
  { key: "facebook_url", label: "Facebook URL", type: "url" },
];

export function SettingsEditor({
  restaurant,
  onDone,
  onSay,
}: {
  restaurant: Record<string, unknown>;
  onDone: () => void;
  onSay: Say;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(SETTING_FIELDS.map((f) => [f.key, (restaurant[f.key] as string) ?? ""]))
  );
  const [address, setAddress] = useState((restaurant.address as string) ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const payload: Record<string, unknown> = { address: address.trim() || null };
          for (const f of SETTING_FIELDS) payload[f.key] = values[f.key].trim() || null;
          await saveRestaurant(restaurant.id as string, payload);
          await onDone();
          onSay("Restaurant details saved");
        } catch (err) {
          onSay((err as Error).message, "bad");
        } finally {
          setBusy(false);
        }
      }}
      className="max-w-2xl space-y-5"
    >
      <div>
        <h1 className="font-display text-2xl">Restaurant details</h1>
        <p className="mt-1 text-sm text-muted">
          These appear in the header, the footer and the Find us section of the website.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTING_FIELDS.map((f) => (
          <label key={f.key} className="block text-sm">
            {f.label}
            <input
              type={f.type ?? "text"}
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              className="a-input mt-1"
            />
          </label>
        ))}
      </div>

      <label className="block text-sm">
        Address
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={area} />
      </label>

      <button type="submit" disabled={busy} className="a-btn a-btn-primary">
        {busy ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}
