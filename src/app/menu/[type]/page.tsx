import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { MenuBrowser } from "@/components/MenuBrowser";
import { MenuJsonLd } from "@/components/StructuredData";
import { T } from "@/components/LanguageProvider";
import type { StringKey } from "@/lib/i18n";
import { getCategories, getMenuItems, getRestaurant } from "@/lib/menu";
import { MENU_TYPES, menuTypeFromSlug } from "@/lib/types";

export function generateStaticParams() {
  return MENU_TYPES.map((m) => ({ type: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const label = MENU_TYPES.find((m) => m.slug === type)?.label ?? "Menu";
  return { title: label + " Menu - Al Qaysr" };
}

export default async function MenuPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const menuType = menuTypeFromSlug(type);
  if (!menuType) notFound();

  const restaurant = getRestaurant();
  const categories = getCategories();
  const items = getMenuItems(menuType);

  return (
    <>
      <MenuJsonLd restaurant={restaurant} categories={categories} items={items} menuType={menuType} />
      <SiteHeader name={restaurant.name} logoUrl={restaurant.logo_url} />

      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl">
              <T k={`type.${menuType}` as StringKey} />
            </h1>
            <p className="text-sm text-muted">
              <T k="menu.dishes" vars={{ n: items.length }} />
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MENU_TYPES.map((m) => (
              <Link
                key={m.slug}
                href={"/menu/" + m.slug}
                className={
                  "rounded-full px-4 py-2 text-sm transition " +
                  (m.type === menuType ? "bg-ink text-ivory" : "border border-line hover:border-gold")
                }
              >
                <T k={`type.${m.type}` as StringKey} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main>
        <MenuBrowser categories={categories} items={items} restaurant={restaurant} menuType={menuType} />
      </main>

      <Footer restaurant={restaurant} />
    </>
  );
}
