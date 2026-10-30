/**
 * What the customer picks. Delivery is a way of receiving a take-away order,
 * not a third price list — see PRICE_LIST below.
 */
export type MenuType = "TAKE_AWAY" | "DELIVERY" | "TABLES";

/**
 * What the database actually stores. The restaurant keeps two price lists —
 * 15 dishes cost different amounts eating in — and delivery sells the take-away
 * one. Modelling delivery as its own list would mean ~144 more prices for the
 * owner to maintain and drift out of sync, for no real difference.
 */
export type PriceList = "TAKE_AWAY" | "TABLES";

export const PRICE_LISTS: { list: PriceList; label: string }[] = [
  { list: "TAKE_AWAY", label: "Take Away" },
  { list: "TABLES", label: "Tables" },
];

export const PRICE_LIST: Record<MenuType, PriceList> = {
  TAKE_AWAY: "TAKE_AWAY",
  DELIVERY: "TAKE_AWAY",
  TABLES: "TABLES",
};

/** Category group holding the restaurant's deals. Pinned to the top of Take Away. */
export const OFFERS_GROUP = "Offers";

export const MENU_TYPES: {
  type: MenuType;
  slug: string;
  label: string;
  blurb: string;
}[] = [
  { type: "TAKE_AWAY", slug: "takeaway", label: "Take Away", blurb: "Order to go" },
  { type: "DELIVERY", slug: "delivery", label: "Delivery", blurb: "Brought to your door" },
  { type: "TABLES", slug: "tables", label: "Tables", blurb: "Dine with us" },
];

export function menuTypeFromSlug(slug: string): MenuType | null {
  return MENU_TYPES.find((m) => m.slug === slug)?.type ?? null;
}

/** One delivery area and what it costs to reach. */
export type DeliveryZone = { name: string; name_ar?: string | null; fee: number };

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
  prices: Partial<Record<PriceList, number>>;
  /** Which price lists it appears on — the keys of `prices`. */
  menus: PriceList[];
  image_url: string | null;
  /** True when the photo is borrowed from another dish of the same food. */
  image_shared?: boolean;
  category_slug: string;
  /** Set false in menu.json to show a dish as sold out without deleting it. */
  is_available: boolean;
  /** Shows the dish in Guest favourites on the homepage. */
  is_featured: boolean;
  /** Position within Guest favourites; ties fall back to display_order. */
  featured_order?: number;
  /** Badge only — does not put the dish on the homepage. */
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
  /** Lira per dollar, shown beside every price. The owner edits it in Settings. */
  lbp_rate?: number;
  /** Delivery areas and their fees. Empty means delivery charges nothing. */
  delivery_zones?: DeliveryZone[];
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
