/**
 * Build step: pulls the menu out of Supabase into src/data/menu.json so the
 * public site stays fully static. Runs automatically before `npm run build`.
 *
 * If Supabase is not configured, or unreachable, it keeps the committed
 * menu.json and the build still succeeds — a database hiccup must never take
 * the restaurant's menu offline.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "src", "data", "menu.json");

for (const line of (await fs.readFile(path.join(ROOT, ".env.local"), "utf8").catch(() => "")).split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const keepExisting = (why) => {
  console.log(`pull-menu: ${why} — keeping the committed menu.json`);
  process.exit(0);
};

if (!url || !key) keepExisting("Supabase not configured");

try {
  const db = createClient(url, key, { auth: { persistSession: false } });

  const [restaurant, categories, items] = await Promise.all([
    db.from("restaurants").select("*").limit(1).maybeSingle(),
    db.from("categories").select("*").eq("is_active", true).order("display_order"),
    db.from("menu_items").select("*, categories(slug), menu_item_prices(menu_type, price)")
      .eq("is_active", true).order("display_order"),
  ]);

  for (const r of [restaurant, categories, items]) if (r.error) throw new Error(r.error.message);
  if (!restaurant.data) throw new Error("no restaurant row");
  if (!items.data?.length) throw new Error("no dishes returned");

  const menu = {
    restaurant: (({ id, updated_at, ...rest }) => rest)(restaurant.data),
    categories: categories.data.map(({ id, updated_at, is_active, ...c }) => c),
    items: items.data.map((i) => ({
      slug: i.slug,
      name: i.name,
      description: i.description,
      ...(i.description_generated ? { description_generated: true } : {}),
      prices: Object.fromEntries(i.menu_item_prices.map((p) => [p.menu_type, Number(p.price)])),
      menus: i.menu_item_prices.map((p) => p.menu_type),
      image_url: i.image_url,
      ...(i.image_shared ? { image_shared: true } : {}),
      category_slug: i.categories.slug,
      is_available: i.is_available,
      is_featured: i.is_featured,
      is_best_seller: i.is_best_seller,
      is_recommended: i.is_recommended,
      is_spicy: i.is_spicy,
    })).filter((i) => i.menus.length > 0),
  };

  await fs.writeFile(OUT, JSON.stringify(menu, null, 2), "utf8");
  console.log(`pull-menu: ${menu.categories.length} categories, ${menu.items.length} dishes from Supabase`);
} catch (e) {
  keepExisting(String(e.message || e));
}
