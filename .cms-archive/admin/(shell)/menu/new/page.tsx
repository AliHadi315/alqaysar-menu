import { ItemForm } from "@/components/admin/ItemForm";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const categories = await getCategories(true);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Add menu item</h1>
      <ItemForm categories={categories} />
    </div>
  );
}
