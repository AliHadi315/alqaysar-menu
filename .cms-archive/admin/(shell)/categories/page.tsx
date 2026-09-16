import { CategoryManager } from "@/components/admin/CategoryManager";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories(true);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Categories</h1>
        <p className="mt-1 text-sm text-muted">Lower sort numbers appear first on the menu.</p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
