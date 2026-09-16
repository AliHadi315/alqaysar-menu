/**
 * Printable QR codes for the menu.
 *   npm run qr -- https://alqaysar-menu.pages.dev
 * Writes qr/menu.png, qr/takeaway.png, qr/tables.png (1000px, print-safe).
 */
import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

const base = (process.argv[2] || process.env.SITE_URL || "").replace(/\/$/, "");
if (!base) {
  console.error("Usage: npm run qr -- https://your-domain.com");
  process.exit(1);
}

const dir = path.resolve(import.meta.dirname, "..", "qr");
await fs.mkdir(dir, { recursive: true });

for (const [name, url] of [
  ["menu", base + "/menu/"],
  ["takeaway", base + "/menu/takeaway/"],
  ["tables", base + "/menu/tables/"],
]) {
  const file = path.join(dir, name + ".png");
  await QRCode.toFile(file, url, { width: 1000, margin: 2, errorCorrectionLevel: "M" });
  console.log(url + "  ->  qr/" + name + ".png");
}
