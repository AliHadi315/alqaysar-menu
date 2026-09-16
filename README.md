# Al Qaysr — digital menu

A static, mobile-first menu site for Al Qaysr (Old Saida Road, Chiyah, Beirut).
No database, no login, no accounts, no cart — the whole menu is one JSON file
baked into the build, so the site is plain HTML any host can serve.

Next.js (static export) · Tailwind v4 · 167 dishes across 18 sections.

## Pages

| Route | |
|---|---|
| `/` | Hero, Take Away vs Tables, contact |
| `/menu` | Choose Take Away or Tables |
| `/menu/takeaway`, `/menu/tables` | The menu: search + sticky section rail, tap a dish for details |

## Take Away vs Tables

One dish is one entry. Which menus it appears on, **and what it costs on each**,
come from a single `prices` object:

```jsonc
"prices": { "TABLES": 22.22, "TAKE_AWAY": 16.66 }   // both menus, different price
"prices": { "TABLES": 5 }                            // dine-in only (all shisha)
"prices": { "TAKE_AWAY": 20 }                        // take away only (the offers)
```

From the live menu: **127 dishes on both, 23 dine-in only, 17 take-away only**,
and **15 dishes cost a different amount depending on the menu**.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out
npm run check      # self-check for the price/slug helpers
npm run typecheck

npm run import                 # rebuild menu + photos from import/omega-min.json
SKIP_IMAGES=1 npm run import   # rebuild the data file only
npm run qr -- https://your-domain.com   # printable QR codes in ./qr
```

## Contact, WhatsApp and the map

All driven by `restaurant` in `menu.json` — no API keys, no billing account:

```jsonc
"phone": "70678929",
"whatsapp": "+961 70 678 929",   // null hides every WhatsApp link
"address": "Old Saida Road, next to Mar Mkhaeil Church
Chiyah, Beirut, Lebanon",
"maps_query": null,              // set a Plus Code here if the address geocodes badly
"maps_url": null                 // set the restaurant's own Google listing if it has one
```

- **Map** — the Find us block on the homepage embeds Google Maps by address
  (keyless `output=embed`), plus a *Get directions* button.
- **WhatsApp** — "Order on WhatsApp" on the homepage and in the footer opens a
  general enquiry; the button inside each dish prefills the dish name, the price
  **for the menu being viewed**, and whether it is Take Away or Tables.

> **Before going live:** confirm `70678929` is actually on WhatsApp. It is the
> number the live menu lists, which is not proof. If it is a different number,
> change `whatsapp` and leave `phone` alone.

## Ordering on WhatsApp

Tapping ✚ on a card (or **Add to order** in a dish) builds a basket. The bar at
the bottom shows the count and total; **Send on WhatsApp** opens one message:

```
Hello Al Qaysr, I'd like to order (Tables):

• 2 × HOMMOS حمص — $7.60

Total: $7.60
```

No server, no payment integration — the customer sends it from their own
WhatsApp. Each menu keeps its own basket in `localStorage` (prices differ), and
every storage call is wrapped in try/catch so a private window still works.

## Arabic / RTL

A toggle in the header switches the interface to Arabic and flips the page to
`dir="rtl"`; the choice is remembered and applied before first paint, so Arabic
never flashes left-to-right. Noto Sans Arabic loads for Arabic; the layout uses
CSS logical properties throughout, so the mirroring is automatic.

**Scope:** this translates the site's own interface — navigation, buttons,
badges, the order bar. **Dish names, descriptions and section names are shown
exactly as the restaurant wrote them** (already largely Arabic) and are not
machine-translated. Add UI strings in [`src/lib/i18n.ts`](src/lib/i18n.ts).

## Search-engine structured data

Every page carries schema.org JSON-LD: `Restaurant` on the homepage (name,
address, phone, map, cuisine) and a full `Menu` on each menu page — 18 sections,
every dish with its price for that menu. This is what lets Google show the menu
in search and Maps.

> Set `NEXT_PUBLIC_SITE_URL` to the live domain before deploying. Without it the
> structured data omits `url` and `image`, which are the fields Google needs to
> link dishes back to the site.

## Admin panel

`/admin` — **not linked from anywhere on the site**, carries `noindex`, and is
blocked in `robots.txt`. The hidden URL is convenience, not security: the
sign-in and the database's row level security are what actually stop people.
Anyone who guesses the URL sees a login and gets no further, and the API
rejects writes from anyone not listed in `admins`.

The panel is a browser-side app (this site is a static export, so there is no
server to run). It signs in to Supabase directly; Supabase enforces permissions.

**What the owner can do:** add, edit and delete dishes; set a **separate price
per menu** (leave one blank to keep the dish off that menu); edit descriptions;
upload photos; mark sold out, hidden, featured, best seller, chef's pick or
spicy; add, rename, reorder, hide and delete categories; edit the restaurant
details, phone, WhatsApp and hours.

### One-time setup

1. Create a free project at supabase.com.
2. SQL editor → run `supabase/migrations/0001_init.sql`.
3. Authentication → Users → **Add user**: the owner's email and a password.
4. SQL editor, so that account may write:

   ```sql
   insert into admins (user_id, email)
   select id, email from auth.users where email = 'owner@example.com';
   ```

5. `.env.local` (never commit it):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...     # local only, for the one-off push below
   ```

6. Load the current 167 dishes into the database:

   ```bash
   npm run db:push
   ```

7. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the
   host's environment variables and redeploy. **Never add the service role key
   there** — it bypasses every security rule and would be served to browsers.

### How an edit reaches the public site

The public pages are static, so they do not read the database at runtime:

```
owner saves in /admin  →  Supabase
        ↓  (Publish to site)
   deploy hook  →  rebuild  →  npm run prebuild pulls the menu  →  live
```

Set `NEXT_PUBLIC_DEPLOY_HOOK` to the host's deploy hook URL and a **Publish to
site** button appears in the admin. Without it, edits sit in the database until
the next deploy.

`npm run prebuild` regenerates `src/data/menu.json` from Supabase before every
build, and **falls back to the committed file** if Supabase is unconfigured or
unreachable — a database outage can never take the menu offline.

## Changing the menu

Everything lives in [`src/data/menu.json`](src/data/menu.json). Edit, then
`npm run build`.

```jsonc
{
  "slug": "potato-sandwich",
  "name": "POTATO SANDWICH",
  "description": "بطاطا, سلطة ملفوف, كاتشاب",
  "prices": { "TABLES": 2.22, "TAKE_AWAY": 2.22 },
  "image_url": null,
  "category_slug": "sandwiches",
  "is_available": true,      // false → shown greyed out as "Sold out"
  "is_featured": false,      // true → appears in the homepage strip
  "is_best_seller": false,   // true → badge on the card
  "is_spicy": false,
  "menus": ["TABLES", "TAKE_AWAY"]   // keep in sync with the prices above
}
```

**New photo**: drop it in `public/menu/` and point `image_url` at it. Keep them
WebP, about 1200px wide.

### Descriptions and photos that did not come from the restaurant

- `import/descriptions.json` holds descriptions written for the 104 dishes the
  live menu left blank. They are keyed by POS item id and every dish filled from
  it is marked `description_generated: true` — the restaurant should read them.
  Seven house-name dishes (RIZO crispy, FAHITA BOMB, RIZO SHRIMPS, CHICKEN
  MASTER, بوكس القيصر, COCKTAIL CHEKAF, RIZO SHAWARMA) were left blank rather
  than guessed.
- `import/photo-aliases.json` lets a dish borrow **another dish's photo from the
  restaurant's own library**, for the same food in a different portion. Four
  dishes use it, marked `image_shared: true`. Do not use it as a stand-in for a
  different dish.
- 89 dishes still have no photo and fall back to the "AQ" tile.

### Homepage highlights

The source menu carries no best-seller or popular flags, so nothing is marked
and the homepage "Guest favourites" strip stays hidden. Set `is_featured: true`
on a few dishes and it appears.

### Hero claims

`restaurant.established` and `restaurant.badges` in `menu.json` drive the text
above and below the restaurant name. They are empty because the source menu
states no founding year or certifications — fill them in only with things the
restaurant can actually stand behind, e.g.:

```jsonc
"established": "Since 2015",
"badges": ["Halal", "Charcoal grilled", "Open late"]
```

## Where the data came from

The live menu at `menu.omegasoftware.ca/smokerbae` (an Omega POS digital menu).
Its data was captured to [`import/omega-min.json`](import/omega-min.json);
`npm run import` re-encodes each photo to WebP (max 1200px, quality 78) into
`public/menu/` and regenerates `src/data/menu.json`. 74 of the 167 dishes have a
photo; the rest fall back to the "AQ" placeholder tile.

Re-runs skip photos already converted.

## Deploy

`npm run build` produces `./out` — static files, nothing to run.

- **Cloudflare Pages**: build `npm run build`, output directory `out`.
- Anything else that serves a folder works the same way.

Then `npm run qr -- https://the-live-domain` and print the codes.

## Not included, by choice

No admin panel, sign-in, customer accounts, cart, checkout or reservations. The
menu is updated by editing `menu.json` and redeploying.

Names and descriptions are mixed English/Arabic exactly as the restaurant wrote
them. The layout is left-to-right; a proper Arabic RTL version would be a
`dir="rtl"` switch plus an Arabic font — the CSS already uses logical
properties, so nothing blocks it.
