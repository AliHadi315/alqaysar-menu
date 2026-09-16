import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category, MenuItem, MenuItemWithAvailability, MenuType, Restaurant } from "@/lib/types";

type AvailabilityRow = { menu_type: MenuType };

/** Supabase free projects pause when idle — a dead database must not 500 the site. */
async function safe<T>(fn: () => PromiseLike<{ data: unknown }>, fallback: T): Promise<T> {
  try {
    const { data } = await fn();
    return (data as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

// ----------------------------------------------------------- public reads

export async function getRestaurant(): Promise<Restaurant | null> {
  const db = createPublicClient();
  return safe<Restaurant | null>(() => db.from("restaurants").select("*").limit(1).maybeSingle(), null);
}

export async function getCategories(includeInactive = false): Promise<Category[]> {
  if (includeInactive) {
    const db = await createClient();
    return safe<Category[]>(
      () => db.from("categories").select("*").order("display_order").order("name"),
      []
    );
  }
  const db = createPublicClient();
  return safe<Category[]>(
    () => db.from("categories").select("*").eq("is_active", true).order("display_order").order("name"),
    []
  );
}

/** Items on one menu (Take Away or Tables). */
export async function getMenuItems(menuType: MenuType): Promise<MenuItem[]> {
  const db = createPublicClient();
  return safe<MenuItem[]>(
    () =>
      db
        .from("menu_items")
        .select("*, menu_item_availability!inner(menu_type)")
        .eq("is_active", true)
        .eq("menu_item_availability.menu_type", menuType)
        .order("display_order")
        .order("name"),
    []
  );
}

/** Highlights for the landing page. */
export async function getFeatured(limit = 8): Promise<MenuItem[]> {
  const db = createPublicClient();
  return safe<MenuItem[]>(
    () =>
      db
        .from("menu_items")
        .select("*")
        .eq("is_active", true)
        .eq("is_available", true)
        .or("is_featured.eq.true,is_best_seller.eq.true")
        .order("display_order")
        .limit(limit),
    []
  );
}

// ------------------------------------------------------------ admin reads

/** Every item plus the menus it belongs to. Needs an admin session (RLS). */
export async function getAllItems(): Promise<MenuItemWithAvailability[]> {
  const db = await createClient();
  const rows = await safe<(MenuItem & { menu_item_availability: AvailabilityRow[] })[]>(
    () => db.from("menu_items").select("*, menu_item_availability(menu_type)").order("name"),
    []
  );
  return rows.map((row) => ({
    ...row,
    menu_types: (row.menu_item_availability ?? []).map((a) => a.menu_type),
  }));
}

export async function getItem(id: string): Promise<MenuItemWithAvailability | null> {
  const db = await createClient();
  const row = await safe<(MenuItem & { menu_item_availability: AvailabilityRow[] }) | null>(
    () => db.from("menu_items").select("*, menu_item_availability(menu_type)").eq("id", id).maybeSingle(),
    null
  );
  if (!row) return null;
  return { ...row, menu_types: (row.menu_item_availability ?? []).map((a) => a.menu_type) };
}

export async function getCounts() {
  const db = await createClient();
  const head = (table: string) => db.from(table).select("*", { count: "exact", head: true });
  try {
    const [items, hidden, categories, takeaway, tables] = await Promise.all([
      head("menu_items"),
      head("menu_items").eq("is_active", false),
      head("categories"),
      head("menu_item_availability").eq("menu_type", "TAKE_AWAY"),
      head("menu_item_availability").eq("menu_type", "TABLES"),
    ]);
    return {
      items: items.count ?? 0,
      hidden: hidden.count ?? 0,
      categories: categories.count ?? 0,
      takeaway: takeaway.count ?? 0,
      tables: tables.count ?? 0,
    };
  } catch {
    return { items: 0, hidden: 0, categories: 0, takeaway: 0, tables: 0 };
  }
}
