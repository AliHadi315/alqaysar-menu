import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/menu", label: "Menu items" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Restaurant settings" },
  { href: "/admin/qr", label: "QR code" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Logged in is not enough — the account must be listed in `admins`.
  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/admin/login?error=not-authorised");

  return (
    <div className="min-h-screen bg-white text-ink lg:flex">
      <aside className="border-b border-line bg-ink text-ivory lg:min-h-screen lg:w-60 lg:shrink-0 lg:border-b-0">
        <div className="px-5 py-5 font-display text-lg">Al Qaysar admin</div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm lg:flex-col lg:overflow-visible">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-ivory/80 transition hover:bg-white/10 hover:text-ivory"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-5 text-sm">
          <Link href="/" target="_blank" className="block rounded-lg px-3 py-2 text-ivory/60 hover:text-ivory">
            View website
          </Link>
          <form action={signOut}>
            <button type="submit" className="w-full rounded-lg px-3 py-2 text-start text-ivory/60 hover:text-ivory">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 bg-white px-4 py-8 lg:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
