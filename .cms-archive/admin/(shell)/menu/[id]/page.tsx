import { notFound } from "next/navigation";
import { ItemForm } from "@/components/admin/ItemForm";
import { getCategories, getItem } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, categories] = await Promise.all([getItem(id), getCategories(true)]);
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Edit item</h1>
      <ItemForm categories={categories} item={item} />
    </div>
  );
}
