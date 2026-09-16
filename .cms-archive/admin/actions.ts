"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";

type Result = { error?: string };

const bool = (v: FormDataEntryValue | null) => v === "on" || v === "true";

const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional(),
  price: z.coerce.number().min(0, "Price cannot be negative").max(1_000_000),
  category_id: z.string().uuid("Pick a category"),
  // Seeded items use a site path (/menu/x.webp); admin uploads give a full URL.
  image_url: z
    .string()
    .max(500)
    .optional()
    .refine((v) => !v || v.startsWith("/") || /^https?:\/\//.test(v), "Image must be a URL or site path"),
  display_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function saveItem(id: string | null, formData: FormData): Promise<Result> {
  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  const menuTypes = formData.getAll("menu_types").map(String);
  if (menuTypes.length === 0) return { error: "Choose Take Away, Tables, or both" };

  const supabase = await createClient();
  const row = {
    name: input.name,
    slug: slugify(input.name) + (id ? "" : "-" + Math.random().toString(36).slice(2, 6)),
    description: input.description || null,
    price: input.price,
    category_id: input.category_id,
    image_url: input.image_url || null,
    display_order: input.display_order,
    is_available: bool(formData.get("is_available")),
    is_active: bool(formData.get("is_active")),
    is_featured: bool(formData.get("is_featured")),
    is_best_seller: bool(formData.get("is_best_seller")),
    is_recommended: bool(formData.get("is_recommended")),
    is_spicy: bool(formData.get("is_spicy")),
  };

  let itemId = id;
  if (id) {
    const { slug, ...rest } = row; // keep the existing slug stable for links
    const { error } = await supabase.from("menu_items").update(rest).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase.from("menu_items").insert(row).select("id").single();
    if (error) return { error: error.message };
    itemId = data.id;
  }

  // Availability is a full replace — simpler than diffing two short lists.
  await supabase.from("menu_item_availability").delete().eq("menu_item_id", itemId!);
  const { error: availError } = await supabase
    .from("menu_item_availability")
    .insert(menuTypes.map((menu_type) => ({ menu_item_id: itemId!, menu_type })));
  if (availError) return { error: availError.message };

  revalidatePath("/", "layout");
  redirect("/admin/menu");
}

export async function setItemFlag(id: string, field: "is_active" | "is_available", value: boolean): Promise<Result> {
  if (!["is_active", "is_available"].includes(field)) return { error: "Unknown field" };
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update({ [field]: value }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

export async function deleteItem(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  group: z.string().trim().max(30).default("Food"),
  description: z.string().trim().max(200).optional(),
  display_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function saveCategory(id: string | null, formData: FormData): Promise<Result> {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  const supabase = await createClient();
  const row = {
    name: input.name,
    group: input.group || "Food",
    description: input.description || null,
    display_order: input.display_order,
    is_active: bool(formData.get("is_active")),
  };

  const { error } = id
    ? await supabase.from("categories").update(row).eq("id", id)
    : await supabase.from("categories").insert({ ...row, slug: slugify(input.name) });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function deleteCategory(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  // Postgres blocks deleting a category that still has items (on delete restrict).
  if (error) return { error: "Move or delete this category's items first." };
  revalidatePath("/", "layout");
  return {};
}

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(160).optional(),
  description: z.string().trim().max(1000).optional(),
  currency: z.string().trim().min(1).max(4),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional(),
  opening_hours: z.string().trim().max(300).optional(),
  maps_url: z.string().url().max(500).optional().or(z.literal("")),
  instagram_url: z.string().url().max(300).optional().or(z.literal("")),
  facebook_url: z.string().url().max(300).optional().or(z.literal("")),
  logo_url: z.string().url().max(500).optional().or(z.literal("")),
  hero_image_url: z.string().url().max(500).optional().or(z.literal("")),
});

export async function saveSettings(id: string, formData: FormData): Promise<Result> {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const row = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === "" || v === undefined ? null : v])
  );

  const supabase = await createClient();
  const { error } = await supabase.from("restaurants").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
