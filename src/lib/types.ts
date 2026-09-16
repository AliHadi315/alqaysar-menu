export type MenuType = "TAKE_AWAY" | "TABLES";

export const MENU_TYPES: { type: MenuType; slug: string; label: string; blurb: string }[] = [
  { type: "TAKE_AWAY", slug: "takeaway", label: "Take Away", blurb: "Order to go" },
  { type: "TABLES", slug: "tables", label: "Tables", blurb: "Dine with us" },
];

export function menuTypeFromSlug(slug: string): MenuType | null {
  return MENU_TYPES.find((m) => m.slug === slug)?.type ?? null;
}

export type Category = {
  name: string;
  slug: string;
  group: string;
  description: string | null;
  display_order: number;
};

export type MenuItem = {
  slug: string;
  name: string;
  description: string | null;
  /** True when the description was written during import, not by the restaurant. */
  description_generated?: boolean;
  /** The same dish can cost a different amount dine-in vs take away. */
  prices: Partial<Record<MenuType, number>>;
  /** Which menus it appears on — the keys of `prices`. */
  menus: MenuType[];
  image_url: string | null;
  /** True when the photo is borrowed from another dish of the same food. */
  image_shared?: boolean;
  category_slug: string;
  /** Set false in menu.json to show a dish as sold out without deleting it. */
  is_available: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_recommended: boolean;
  is_spicy: boolean;
};

/** A dish with the price for the menu being viewed already resolved. */
export type PricedItem = MenuItem & { price: number };

export type Restaurant = {
  name: string;
  tagline: string | null;
  description: string | null;
  /** Shown above the name in the hero, e.g. "Since 2015". Null hides it. */
  established: string | null;
  /** Short claims under the hero. Empty hides the row. */
  badges: string[];
  currency: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  opening_hours: string | null;
  /** WhatsApp number in international form, e.g. "+961 70 678 929". Null hides every WhatsApp link. */
  whatsapp: string | null;
  /** Overrides the address when searching Google Maps (e.g. a Plus Code). */
  maps_query: string | null;
  maps_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  /** Two or three photos form the hero collage; falls back to hero_image_url. */
  hero_images?: string[];
  /** Background photo for each choice on the Take Away / Tables selector. */
  menu_images?: Partial<Record<MenuType, string>>;
};

export type MenuData = {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
};
