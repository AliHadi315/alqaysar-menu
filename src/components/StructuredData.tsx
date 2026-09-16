import { mapsLinks } from "@/lib/contact";
import type { Category, MenuType, PricedItem, Restaurant } from "@/lib/types";
import { MENU_TYPES } from "@/lib/types";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const CURRENCY = "USD";

function Json({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped for a <script> context below.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }}
    />
  );
}

/** Restaurant card for Google Search and Maps. */
export function RestaurantJsonLd({ restaurant }: { restaurant: Restaurant }) {
  const maps = mapsLinks(restaurant);
  const [street, locality] = (restaurant.address ?? "").split("\n");

  return (
    <Json
      data={{
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: restaurant.name,
        ...(restaurant.tagline ? { description: restaurant.tagline } : {}),
        ...(SITE ? { url: SITE, "@id": SITE } : {}),
        ...(restaurant.logo_url && SITE ? { image: SITE + restaurant.logo_url } : {}),
        ...(restaurant.phone ? { telephone: restaurant.phone } : {}),
        ...(street
          ? {
              address: {
                "@type": "PostalAddress",
                streetAddress: street,
                ...(locality ? { addressLocality: locality } : {}),
                addressCountry: "LB",
              },
            }
          : {}),
        ...(maps ? { hasMap: maps.place } : {}),
        servesCuisine: ["Lebanese", "Middle Eastern", "Grill"],
        priceRange: "$",
        ...(SITE ? { hasMenu: MENU_TYPES.map((m) => `${SITE}/menu/${m.slug}/`) } : {}),
        // No openingHours: the source menu does not state them.
      }}
    />
  );
}

/** The menu itself, section by section, so Google can surface dishes. */
export function MenuJsonLd({
  restaurant,
  categories,
  items,
  menuType,
}: {
  restaurant: Restaurant;
  categories: Category[];
  items: PricedItem[];
  menuType: MenuType;
}) {
  const label = MENU_TYPES.find((m) => m.type === menuType)!.label;

  const sections = categories
    .map((c) => ({ c, list: items.filter((i) => i.category_slug === c.slug) }))
    .filter((s) => s.list.length > 0)
    .map(({ c, list }) => ({
      "@type": "MenuSection",
      name: c.name,
      hasMenuItem: list.map((i) => ({
        "@type": "MenuItem",
        name: i.name,
        ...(i.description ? { description: i.description } : {}),
        ...(i.image_url && SITE ? { image: SITE + i.image_url } : {}),
        offers: {
          "@type": "Offer",
          price: i.price.toFixed(2),
          priceCurrency: CURRENCY,
          availability: i.is_available
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
      })),
    }));

  return (
    <Json
      data={{
        "@context": "https://schema.org",
        "@type": "Menu",
        name: `${restaurant.name} — ${label}`,
        ...(SITE ? { url: `${SITE}/menu/${MENU_TYPES.find((m) => m.type === menuType)!.slug}/` } : {}),
        inLanguage: "en",
        hasMenuSection: sections,
      }}
    />
  );
}
