"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategory, saveCategory } from "@/app/admin/actions";
import type { Category } from "@/lib/types";

const GROUPS = ["Food", "Drinks", "Dessert", "Other"];

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const submit = (id: string | null) => async (formData: FormData) => {
    const res = await saveCategory(id, formData);
    setError(res?.error ?? "");
    if (!res?.error) router.refresh();
  };

  const remove = (c: Category) =>
    startTransition(async () => {
      if (!confirm("Delete " + c.name + "?")) return;
      const res = await deleteCategory(c.id);
      setError(res?.error ?? "");
      router.refresh();
    });

  const input = "h-10 rounded-lg border border-line px-3 text-sm outline-none focus:border-gold";

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-700">{error}</p>}

      <form action={submit(null)} className="flex flex-wrap items-end gap-3 rounded-xl border border-line p-4">
        <label className="text-sm">
          New category
          <input name="name" required maxLength={60} placeholder="e.g. Mezze" className={"mt-1 block " + input} />
        </label>
        <label className="text-sm">
          Group
          <select name="group" className={"mt-1 block " + input}>
            {GROUPS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Order
          <input name="display_order" type="number" min="0" defaultValue={0} className={"mt-1 block w-24 " + input} />
        </label>
        <input type="hidden" name="is_active" value="true" />
        <button type="submit" className="h-10 rounded-lg bg-ink px-5 text-sm text-ivory">
          Add
        </button>
      </form>

      <div className="divide-y divide-line rounded-xl border border-line">
        {categories.map((c) => (
          <form key={c.id} action={submit(c.id)} className="flex flex-wrap items-center gap-3 p-3">
            <input name="name" defaultValue={c.name} maxLength={60} required className={input + " min-w-[160px] flex-1"} />
            <select name="group" defaultValue={c.group} className={input}>
              {GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <input name="display_order" type="number" min="0" defaultValue={c.display_order} className={input + " w-20"} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={c.is_active} className="h-4 w-4" />
              Visible
            </label>
            <button type="submit" className="h-10 rounded-lg border border-line px-4 text-sm">
              Save
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(c)}
              className="h-10 rounded-lg border border-line px-4 text-sm text-red-700"
            >
              Delete
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
