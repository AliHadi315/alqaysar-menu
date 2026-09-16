/**
 * Builds the site's data from the restaurant's live menu
 * (menu.omegasoftware.ca/smokerbae, captured in import/omega-min.json):
 *   - downloads each dish photo once and re-encodes it to WebP in public/menu/
 *   - writes src/data/menu.json, the only data source the site has
 *
 * Re-runnable: photos already converted are skipped.
 *   npm run import            (SKIP_IMAGES=1 to rebuild the data file only)
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMG_DIR = path.join(ROOT, "public", "menu");
const BRAND_DIR = path.join(ROOT, "public", "brand");
const MAX_WIDTH = 1200;
const QUALITY = 78;
const CONCURRENCY = 6;

const LOGO_URL =
  "https://s3.eu-central-1.amazonaws.com/act.omegapos.com/OmegaCloud/30039/omenu/alqaysar-logo-white-new-250208-232409.jpg";

// Presentation grouping for the 5 top-level categories the source uses.
const GROUPS = { FOOD: "Food", "M-FOOD": "Food", BEVERAGES: "Drinks", TOBACCO: "Shisha", TAKEAWAY: "Offers" };

const RESTAURANT = {
  name: "Al Qaysr",
  tagline: "Charcoal grills, shawarma and sandwiches",
  description: null,
  // Nothing on the source menu states a founding year or certifications,
  // so these stay empty rather than being invented. Add strings to show them.
  established: null,
  badges: [],
  currency: "$",
  phone: "70678929",
  email: null,
  address: "Old Saida Road, next to Mar Mkhaeil Church\nChiyah, Beirut, Lebanon",
  opening_hours: null,
  // The number the live menu lists. CONFIRM it is on WhatsApp before going live.
  whatsapp: "+961 70 678 929",
  maps_query: null,
  maps_url: null,
  instagram_url: null,
  facebook_url: null,
  logo_url: "/brand/logo.webp",
  hero_image_url: null,
  // Hero collage and the Take Away / Tables cards, all the restaurant's own photos.
  hero_images: [
    "/menu/kilo-mashewe-mshakkal.webp",
    "/menu/farouj-fahem.webp",
    "/menu/shawarma-lahme-wajbe.webp",
  ],
  menu_images: {
    TAKE_AWAY: "/menu/1001766469.webp",
    TABLES: "/menu/8-mashewe.webp",
  },
};

const slugify = (v) =>
  v.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9\s-]/g, "")
   .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);

async function convert(url, outDir, name) {
  const out = path.join(outDir, name);
  const webPath = "/" + path.relative(path.join(ROOT, "public"), out).split(path.sep).join("/");
  if (process.env.SKIP_IMAGES) return webPath;
  try {
    await fs.access(out);
    return webPath;
  } catch {}

  const res = await fetch(url);
  if (!res.ok) {
    console.warn("  skip " + res.status + " " + url);
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY }).toFile(out);
  return webPath;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const n = i++;
        out[n] = await fn(items[n], n);
      }
    })
  );
  return out;
}

const src = JSON.parse(await fs.readFile(path.join(ROOT, "import", "omega-min.json"), "utf8"));
// Descriptions for dishes the live menu left blank, keyed by POS item id.
const written = JSON.parse(await fs.readFile(path.join(ROOT, "import", "descriptions.json"), "utf8"));
// Dishes that borrow another dish's photo because it is the same food.
const aliases = JSON.parse(await fs.readFile(path.join(ROOT, "import", "photo-aliases.json"), "utf8"));
const photoById = Object.fromEntries(src.dishes.filter((d) => d[3]).map((d) => [d[0], d[3]]));
await fs.mkdir(IMG_DIR, { recursive: true });
await fs.mkdir(BRAND_DIR, { recursive: true });

// ----------------------------------------------------------------- photos
const photos = [...new Set(src.dishes.map((d) => d[3]).filter(Boolean))];
console.log("converting " + photos.length + " photos...");
let done = 0;
const paths = await mapLimit(photos, CONCURRENCY, async (file) => {
  const p = await convert(src.imgBase + file, IMG_DIR, file.replace(/\.[^.]+$/, "") + ".webp");
  if (++done % 20 === 0) console.log("  " + done + "/" + photos.length);
  return p;
});
const photoByFile = Object.fromEntries(photos.map((f, n) => [f, paths[n]]));

const logo = await convert(LOGO_URL, BRAND_DIR, "logo.webp");
if (!logo) RESTAURANT.logo_url = null;

// ------------------------------------------------------------- categories
const catName = Object.fromEntries(src.cats.map(([id, name]) => [id, name]));
const categories = src.secs.map(([id, name, catId], i) => ({
  name,
  slug: slugify(name),
  group: GROUPS[catName[catId]] ?? "Food",
  description: null,
  display_order: i,
  _id: id,
}));
const catSlugById = Object.fromEntries(categories.map((c) => [c._id, c.slug]));
categories.forEach((c) => delete c._id);

// ------------------------------------------------------------------ items
const items = src.dishes.map(([id, name, desc, photo, secId, tablePrice, takeawayPrice]) => {
  // Arabic-only names slugify to nothing, so fall back to the POS id, which
  // also keeps slugs stable when the menu is re-imported.
  const base = slugify(name);
  const slug = /[a-z0-9]/.test(base) ? base + "-" + id : "item-" + id;

  // One dish, one entry. The price can differ per menu, so it is stored per menu.
  const prices = {};
  if (tablePrice != null) prices.TABLES = tablePrice;
  if (takeawayPrice != null) prices.TAKE_AWAY = takeawayPrice;

  const generated = !desc && written[id] ? written[id] : null;
  const borrowed = !photo && aliases[id] ? photoById[aliases[id]] : null;

  return {
    slug,
    name,
    description: desc || generated,
    ...(generated ? { description_generated: true } : {}),
    prices,
    menus: Object.keys(prices),
    image_url: photo ? photoByFile[photo] ?? null : borrowed ? photoByFile[borrowed] ?? null : null,
    ...(borrowed ? { image_shared: true } : {}),
    category_slug: catSlugById[secId],
    is_available: true,
    is_featured: false,
    is_best_seller: false,
    is_recommended: false,
    is_spicy: false,
  };
});

const used = new Set(items.map((i) => i.category_slug));
const cats = categories.filter((c) => used.has(c.slug));

await fs.writeFile(
  path.join(ROOT, "src", "data", "menu.json"),
  JSON.stringify({ restaurant: RESTAURANT, categories: cats, items }, null, 2),
  "utf8"
);

const files = await fs.readdir(IMG_DIR);
let bytes = 0;
for (const f of files) bytes += (await fs.stat(path.join(IMG_DIR, f))).size;
const onBoth = items.filter((i) => i.menus.length === 2).length;
console.log(`\nmenu.json: ${cats.length} categories, ${items.length} dishes (${onBoth} on both menus)`);
console.log(`photos:    ${files.length} webp, ${(bytes / 1048576).toFixed(1)} MB`);
const gen = items.filter((i) => i.description_generated).length;
const blank = items.filter((i) => !i.description).length;
console.log(`text:      ${gen} descriptions written here, ${blank} still blank`);
const shared = items.filter((i) => i.image_shared).length;
const noPic = items.filter((i) => !i.image_url).length;
console.log(`images:    ${shared} reuse another dish's photo, ${noPic} have none`);
