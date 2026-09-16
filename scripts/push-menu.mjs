/**
 * One-off: uploads src/data/menu.json into a fresh Supabase project so the
 * owner's admin panel starts with the real menu instead of an empty database.
 *
 *   npm run db:push
 *
 * Needs, in .env.local (never committed):
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...        <- server key, local use only
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(import.meta.dirname, "..");

for (const line of (await fs.readFile(path.join(ROOT, ".env.local"), "utf8").catch(() => "")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const menu = JSON.parse(await fs.readFile(path.join(ROOT, "src", "data", "menu.json"), "utf8"));
const die = (label, error) => {
  if (error) {
    console.error(label + ":", error.message);
    process.exit(1);
  }
};

// -------------------------------------------------------------- restaurant
const r = menu.restaurant;
const { data: existing } = await db.from("restaurants").select("id").limit(1).maybeSingle();
const restaurantRow = {
  name: r.name, tagline: r.tagline, description: r.description,
  established: r.established, badges: r.badges ?? [], currency: r.currency,
  phone: r.phone, whatsapp: r.whatsapp, email: r.email, address: r.address,
  opening_hours: r.opening_hours, maps_query: r.maps_query, maps_url: r.maps_url,
  instagram_url: r.instagram_url, facebook_url: r.facebook_url,
  logo_url: r.logo_url, hero_image_url: r.hero_image_url,
  hero_images: r.hero_images ?? [], menu_images: r.menu_images ?? {},
};
die("restaurant", existing
  ? (await db.from("restaurants").update(restaurantRow).eq("id", existing.id)).error
  : (await db.from("restaurants").insert(restaurantRow)).error);

// -------------------------------------------------------------- categories
const { data: cats, error: catErr } = await db
  .from("categories")
  .upsert(menu.categories.map((c) => ({
    name: c.name, slug: c.slug, group: c.group,
    description: c.description, display_order: c.display_order, is_active: true,
  })), { onConflict: "slug" })
  .select("id, slug");
die("categories", catErr);
const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

// ------------------------------------------------------------------- items
const { data: items, error: itemErr } = await db
  .from("menu_items")
  .upsert(menu.items.map((i, n) => ({
    category_id: catId[i.category_slug],
    name: i.name, slug: i.slug, description: i.description,
    description_generated: !!i.description_generated,
    image_url: i.image_url, image_shared: !!i.image_shared,
    is_available: i.is_available, is_active: true,
    is_featured: i.is_featured, is_best_seller: i.is_best_seller,
    is_recommended: i.is_recommended, is_spicy: i.is_spicy,
    display_order: n,
  })), { onConflict: "slug" })
  .select("id, slug");
die("items", itemErr);
const itemId = Object.fromEntries(items.map((i) => [i.slug, i.id]));

// ------------------------------------------------------------ prices
const prices = menu.items.flatMap((i) =>
  Object.entries(i.prices).map(([menu_type, price]) => ({
    menu_item_id: itemId[i.slug], menu_type, price,
  }))
);
die("prices", (await db.from("menu_item_prices").upsert(prices, { onConflict: "menu_item_id,menu_type" })).error);

console.log(`pushed: ${menu.categories.length} categories, ${menu.items.length} dishes, ${prices.length} prices`);
