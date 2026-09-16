import Link from "next/link";
import { MenuList } from "@/components/admin/MenuList";
import { getAllItems, getCategories, getRestaurant } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [items, categories, restaurant] = await Promise.all([
    getAllItems(),
    getCategories(true),
    getRestaurant(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Menu items</h1>
        <Link href="/admin/menu/new" className="rounded-lg bg-ink px-5 py-3 text-sm text-ivory">
          + Add item
        </Link>
      </div>
      <MenuList items={items} categories={categories} currency={restaurant?.currency ?? "₱"} />
    </div>
  );
}
