import Link from "next/link";
import { getCounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const counts = await getCounts();

  const stats = [
    { label: "Menu items", value: counts.items },
    { label: "On take away", value: counts.takeaway },
    { label: "On tables", value: counts.tables },
    { label: "Hidden", value: counts.hidden },
    { label: "Categories", value: counts.categories },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Overview</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line p-4">
            <p className="text-3xl font-semibold">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/menu/new" className="rounded-lg bg-ink px-5 py-3 text-sm text-ivory">
          + Add item
        </Link>
        <Link href="/admin/menu" className="rounded-lg border border-line px-5 py-3 text-sm">
          Manage menu
        </Link>
        <Link href="/admin/categories" className="rounded-lg border border-line px-5 py-3 text-sm">
          Manage categories
        </Link>
      </div>
    </div>
  );
}
