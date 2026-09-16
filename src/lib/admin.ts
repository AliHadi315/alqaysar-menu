import { db } from "@/lib/supabase/browser";
import type { MenuType } from "@/lib/types";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  group: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

export type AdminItem = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_recommended: boolean;
  is_spicy: boolean;
  display_order: number;
  prices: Partial<Record<MenuType, number>>;
};

export const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);

/** Signed in AND listed in `admins` — being logged in is not enough. */
export async function checkAdmin() {
  const { data: { user } } = await db().auth.getUser();
  if (!user) return { user: null, admin: false };
  const { data } = await db().from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return { user, admin: Boolean(data) };
}

export async function loadAll() {
  const [cats, items, restaurant] = await Promise.all([
    db().from("categories").select("*").order("display_order"),
    // Same order as the public menu, so the panel mirrors what customers see.
    db().from("menu_items").select("*, menu_item_prices(menu_type, price)")
      .order("display_order").order("name"),
    db().from("restaurants").select("*").limit(1).maybeSingle(),
  ]);
  if (cats.error) throw cats.error;
  if (items.error) throw items.error;

  return {
    categories: (cats.data ?? []) as unknown as AdminCategory[],
    items: ((items.data ?? []) as any[]).map((i) => ({
      ...i,
      prices: Object.fromEntries(
        (i.menu_item_prices ?? []).map((p: any) => [p.menu_type, Number(p.price)])
      ),
    })) as AdminItem[],
    restaurant: (restaurant.data ?? null) as Record<string, unknown> | null,
  };
}

export async function saveItem(item: Partial<AdminItem> & { prices: Partial<Record<MenuType, number>> }) {
  const { id, prices, ...fields } = item;
  const row = { ...fields, slug: fields.slug || slugify(String(fields.name)) + "-" + Date.now().toString(36) };

  const saved = id
    ? await db().from("menu_items").update(row).eq("id", id).select("id").single()
    : await db().from("menu_items").insert(row).select("id").single();
  if (saved.error) throw saved.error;
  const itemId = (saved.data as { id: string }).id;

  // Replace the price rows outright — there are at most two.
  const del = await db().from("menu_item_prices").delete().eq("menu_item_id", itemId);
  if (del.error) throw del.error;

  const rows = Object.entries(prices)
    .filter(([, p]) => p !== undefined && p !== null && !Number.isNaN(p))
    .map(([menu_type, price]) => ({ menu_item_id: itemId, menu_type, price }));
  if (rows.length) {
    const ins = await db().from("menu_item_prices").insert(rows);
    if (ins.error) throw ins.error;
  }
  return itemId;
}

export async function removeItem(id: string) {
  const { error } = await db().from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

export async function saveCategory(c: Partial<AdminCategory>) {
  const row = { ...c, slug: c.slug || slugify(String(c.name)) };
  const { error } = c.id
    ? await db().from("categories").update(row).eq("id", c.id)
    : await db().from("categories").insert(row);
  if (error) throw error;
}

export async function removeCategory(id: string) {
  const { error } = await db().from("categories").delete().eq("id", id);
  if (error) throw new Error("Move or delete this category's dishes first.");
}

export async function saveRestaurant(id: string, fields: Record<string, unknown>) {
  const { error } = await db().from("restaurants").update(fields).eq("id", id);
  if (error) throw error;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function uploadImage(file: File) {
  if (!ALLOWED.includes(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB.");

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `items/${crypto.randomUUID()}.${ext}`;
  const { error } = await db().storage.from("menu").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return db().storage.from("menu").getPublicUrl(path).data.publicUrl;
}
