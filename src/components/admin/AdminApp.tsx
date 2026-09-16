"use client";

import { useCallback, useEffect, useState } from "react";
import { db, isConfigured } from "@/lib/supabase/browser";
import { checkAdmin, loadAll, removeItem } from "@/lib/admin";
import type { AdminItem } from "@/lib/admin";
import { ItemForm, CategoryEditor, SettingsEditor } from "@/components/admin/AdminForms";
import { MENU_TYPES } from "@/lib/types";

type View = "items" | "categories" | "settings";
export type Notice = { text: string; kind: "ok" | "bad" } | null;

export function AdminApp() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [view, setView] = useState<View>("items");
  const [data, setData] = useState<Awaited<ReturnType<typeof loadAll>> | null>(null);
  const [editing, setEditing] = useState<AdminItem | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "TAKE_AWAY" | "TABLES" | "hidden" | "soldout">("all");
  const [notice, setNotice] = useState<Notice>(null);

  const say = useCallback((text: string, kind: "ok" | "bad" = "ok") => setNotice({ text, kind }), []);

  const refresh = useCallback(async () => {
    try {
      setData(await loadAll());
    } catch (e) {
      say((e as Error).message, "bad");
    }
  }, [say]);

  useEffect(() => {
    if (!isConfigured()) {
      setReady(true);
      return;
    }
    (async () => {
      const { user, admin } = await checkAdmin();
      setSignedIn(Boolean(user));
      setAllowed(admin);
      if (admin) await refresh();
      setReady(true);
    })();
  }, [refresh]);

  if (!ready) return <BootSkeleton />;

  if (!isConfigured()) {
    return (
      <Center>
        This build has no Supabase keys, so the admin cannot connect. Add
        NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.
      </Center>
    );
  }

  if (!signedIn) return <SignIn onDone={() => location.reload()} />;

  if (!allowed) {
    return (
      <Center>
        <p className="mb-4">This account is signed in but is not an admin.</p>
        <button onClick={signOut} className="a-btn a-btn-ghost">
          Sign out
        </button>
      </Center>
    );
  }

  const items = data?.items ?? [];
  const categories = data?.categories ?? [];
  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const searching = query.trim().length > 0 || filter !== "all";
  const matchesFilter = (i: AdminItem) =>
    filter === "all" ? true
    : filter === "hidden" ? !i.is_active
    : filter === "soldout" ? !i.is_available
    : i.prices[filter] != null;

  const visible = items.filter(
    (i) => i.name.toLowerCase().includes(query.trim().toLowerCase()) && matchesFilter(i)
  );

  const groups = [...categories]
    .sort((a, b) => a.display_order - b.display_order)
    .map((category) => ({ category, list: visible.filter((i) => i.category_id === category.id) }));

  const orphans = visible.filter((i) => !categories.some((c) => c.id === i.category_id));
  if (orphans.length) {
    groups.push({
      category: {
        id: "none", name: "Uncategorised", slug: "none", group: "",
        description: null, display_order: 9999, is_active: true,
      },
      list: orphans,
    });
  }

  const deleteItem = async (item: AdminItem) => {
    if (!confirm("Delete " + item.name + "? This cannot be undone.")) return;
    try {
      await removeItem(item.id);
      await refresh();
      say(item.name + " deleted");
    } catch (e) {
      say((e as Error).message, "bad");
    }
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <span className="font-display text-lg">Al Qaysr admin</span>
          <nav className="flex gap-1 text-sm">
            {(["items", "categories", "settings"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setView(v);
                  setEditing(null);
                }}
                aria-current={view === v ? "page" : undefined}
                className={"a-btn capitalize " + (view === v ? "a-btn-primary" : "a-btn-ghost")}
              >
                {v}
              </button>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2 text-sm">
            <PublishButton onSay={say} />
            <button onClick={signOut} className="a-btn a-btn-ghost">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {view === "items" &&
          (editing ? (
            <ItemForm
              item={editing === "new" ? null : editing}
              categories={categories}
              onDone={async (message) => {
                setEditing(null);
                await refresh();
                say(message);
              }}
              onCancel={() => setEditing(null)}
              onError={(m) => say(m, "bad")}
            />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl">
                  {items.length} dishes
                  <span className="ms-2 text-sm text-muted">
                    {MENU_TYPES.map(
                      (m) => items.filter((i) => i.prices[m.type] != null).length + " " + m.label
                    ).join(" · ")}
                  </span>
                </h1>

                <div className="relative flex-1 basis-56">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search dishes…"
                    aria-label="Search dishes"
                    className="a-input pe-10"
                  />
                  {query.trim().length > 0 && (
                    <button
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="absolute end-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-line"
                    >
                      ×
                    </button>
                  )}
                </div>

                <label className="sr-only" htmlFor="admin-filter">
                  Show
                </label>
                <select
                  id="admin-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="a-input w-auto text-sm"
                >
                  <option value="all">All dishes</option>
                  <option value="TAKE_AWAY">On Take Away</option>
                  <option value="TABLES">On Tables</option>
                  <option value="soldout">Sold out</option>
                  <option value="hidden">Hidden from the site</option>
                </select>

                <button onClick={() => setEditing("new")} className="a-btn a-btn-primary">
                  + Add dish
                </button>
              </div>

              {searching && data && visible.length > 0 && (
                <p className="mb-3 text-sm text-muted">
                  Showing {visible.length} of {items.length}
                </p>
              )}

              {!data ? (
                <ListSkeleton />
              ) : visible.length === 0 ? (
                <EmptyState
                  title={
                    query.trim()
                      ? "No dishes match “" + query.trim() + "”"
                      : filter !== "all"
                        ? "Nothing in this view"
                        : "No dishes yet"
                  }
                  hint={
                    query.trim()
                      ? "Try a shorter word, or clear the search."
                      : filter !== "all"
                        ? "Switch the filter back to All dishes."
                        : "Add your first dish to get started."
                  }
                />
              ) : searching ? (
                <div className="divide-y divide-line rounded-xl border border-line">
                  {visible.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      category={catName[item.category_id]}
                      onEdit={setEditing}
                      onDelete={deleteItem}
                    />
                  ))}
                </div>
              ) : (
                /* Dishes sit under their category, in public-menu order. */
                <div className="space-y-6">
                  {groups.map(({ category, list }) => (
                    <section key={category.id}>
                      <h2 className="mb-2 flex flex-wrap items-baseline gap-2 font-display text-lg">
                        {category.name}
                        <span className="text-sm text-muted">
                          {list.length} {list.length === 1 ? "dish" : "dishes"}
                        </span>
                        {!category.is_active && (
                          <span className="rounded-full bg-line px-2 py-0.5 text-xs text-ink-soft">
                            hidden from the site
                          </span>
                        )}
                      </h2>
                      <div className="divide-y divide-line rounded-xl border border-line">
                        {list.length === 0 ? (
                          <p className="p-4 text-sm text-muted">No dishes in this category yet.</p>
                        ) : (
                          list.map((item) => (
                            <ItemRow key={item.id} item={item} onEdit={setEditing} onDelete={deleteItem} />
                          ))
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </>
          ))}

        {view === "categories" && (
          <CategoryEditor categories={categories} onDone={refresh} onSay={say} />
        )}

        {view === "settings" &&
          (data?.restaurant ? (
            <SettingsEditor restaurant={data.restaurant} onDone={refresh} onSay={say} />
          ) : (
            <ListSkeleton />
          ))}
      </main>

      <Toast notice={notice} onClear={() => setNotice(null)} />
    </div>
  );
}

function ItemRow({
  item,
  category,
  onEdit,
  onDelete,
}: {
  item: AdminItem;
  category?: string;
  onEdit: (item: AdminItem) => void;
  onDelete: (item: AdminItem) => void;
}) {
  return (
    <div className="a-row flex flex-wrap items-center gap-3 p-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-line">
        {item.image_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={item.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-[150px] flex-1">
        <p className="font-medium">
          {item.name}
          {!item.is_active && (
            <span className="ms-2 rounded-full bg-line px-2 py-0.5 text-xs text-ink-soft">hidden</span>
          )}
          {!item.is_available && (
            <span className="ms-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-800">sold out</span>
          )}
        </p>
        <p className="text-sm text-muted">
          {category ? category + " · " : ""}
          {MENU_TYPES.filter((m) => item.prices[m.type] != null)
            .map((m) => m.label + " " + item.prices[m.type])
            .join(" · ") || "on no menu"}
        </p>
      </div>

      <button onClick={() => onEdit(item)} className="a-btn a-btn-ghost">
        Edit
      </button>
      <button onClick={() => onDelete(item)} className="a-btn a-btn-danger">
        Delete
      </button>
    </div>
  );
}

async function signOut() {
  await db().auth.signOut();
  location.reload();
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory p-6">
      <div className="max-w-md text-center text-sm text-ink-soft">{children}</div>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-10 text-center">
      <p className="font-display text-lg">{title}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
    </div>
  );
}

/** Placeholder rows, so the panel never shows a blank page while loading. */
function ListSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      {[0, 1].map((section) => (
        <div key={section}>
          <div className="a-skeleton mb-2 h-6 w-40" />
          <div className="divide-y divide-line rounded-xl border border-line">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-3 p-3">
                <div className="a-skeleton h-12 w-12 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="a-skeleton h-4 w-1/3" />
                  <div className="a-skeleton h-3 w-1/2" />
                </div>
                <div className="a-skeleton h-11 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BootSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="a-skeleton h-6 w-36" />
          <div className="a-skeleton h-11 w-24" />
          <div className="a-skeleton h-11 w-24" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ListSkeleton />
      </div>
      <span className="sr-only" role="status">
        Loading the menu
      </span>
    </div>
  );
}

/** Short-lived confirmation, so a save is never silent. */
function Toast({ notice, onClear }: { notice: Notice; onClear: () => void }) {
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(onClear, notice.kind === "bad" ? 6000 : 3000);
    return () => clearTimeout(t);
  }, [notice, onClear]);

  if (!notice) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onClear}
      className={
        "a-toast " + (notice.kind === "bad" ? "bg-red-700 text-white" : "bg-ink text-ivory")
      }
    >
      {notice.text}
    </div>
  );
}

function SignIn({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const result = await db().auth.signInWithPassword({ email, password });
          setBusy(false);
          if (result.error) setError(result.error.message);
          else onDone();
        }}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-8"
      >
        <h1 className="font-display text-2xl">Al Qaysr admin</h1>

        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="a-input mt-1"
          />
        </label>

        <label className="block text-sm">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="a-input mt-1"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="a-btn a-btn-primary w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

/**
 * Saving writes to the database, but the public site is static until it is
 * rebuilt. This pokes the host's deploy hook to republish.
 */
function PublishButton({ onSay }: { onSay: (text: string, kind?: "ok" | "bad") => void }) {
  const hook = process.env.NEXT_PUBLIC_DEPLOY_HOOK;
  const [busy, setBusy] = useState(false);
  if (!hook) return null;

  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch(hook, { method: "POST", mode: "no-cors" });
          onSay("Publishing — the site updates in about a minute");
        } catch {
          onSay("Could not reach the publish hook", "bad");
        } finally {
          setBusy(false);
        }
      }}
      className="a-btn a-btn-ghost"
      title="Rebuild the public site with the latest menu"
    >
      {busy ? "Publishing…" : "Publish to site"}
    </button>
  );
}
