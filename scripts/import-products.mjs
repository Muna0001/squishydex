#!/usr/bin/env node
/**
 * Pull real product names, images, prices, and availability from public
 * shop feeds into src/data/imported.ts for review.
 *
 * Sources:
 *   1. i-bloom.shop — the OFFICIAL iBloom store (Shopify products.json).
 *      Canonical names and official brand imagery.
 *   2. squishy-japan.com — import retailer carrying iBloom / Chawa /
 *      Puni Maru (WooCommerce Store API). Prices in JPY.
 *
 * Usage: node scripts/import-products.mjs
 *
 * The script is idempotent: it regenerates src/data/imported.ts from
 * scratch each run. Review the diff before committing — these are
 * third-party feeds. Every imported record keeps sourceUrl +
 * imageSource so images stay attributed to where they came from.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT_PATH = join(dirname(fileURLToPath(import.meta.url)), "../src/data/imported.ts");
const TODAY = new Date().toISOString().slice(0, 10);

// Preserve each item's original dateAdded across re-runs so a daily
// refresh doesn't flood "New arrivals" with everything at once.
const previousDates = new Map();
try {
  const prev = readFileSync(OUT_PATH, "utf8");
  for (const m of prev.matchAll(/"id":\s*"([^"]+)"[\s\S]{0,600}?"dateAdded":\s*"([^"]+)"/g)) {
    previousDates.set(m[1], m[2]);
  }
} catch {
  // First run — everything is genuinely new today.
}
const dateAddedFor = (id) => previousDates.get(id) ?? TODAY;

// Obvious non-squishy merch in the feeds (stationery, apparel, etc.)
const SKIP_WORDS = /sticker|towel|tote|tape|postcard|notebook|poster|t-shirt|tshirt|acrylic|badge|lanyard/i;

/** Decode the handful of HTML entities WooCommerce leaves in names. */
function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

/** Strip Japanese-shop title noise: 【Ships from …】 prefixes, ※… caveats. */
function cleanName(title) {
  return decodeEntities(title)
    .replace(/【[^】]*】/g, "")
    .replace(/※.*$/, "")
    .replace(/★/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function guessSize(name) {
  const n = name.toLowerCase();
  if (n.includes("jumbo")) return "jumbo";
  if (n.includes("micro")) return "micro";
  if (n.includes("mini")) return "mini";
  return "regular";
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "user-agent": "SquishyDex importer (hobby collector app)" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// ---------------------------------------------------------------- iBloom
async function importIbloom() {
  const items = [];
  const listings = [];
  for (let page = 1; page <= 10; page++) {
    const data = await fetchJson(`https://i-bloom.shop/en-us/products.json?limit=250&page=${page}`);
    const products = data.products ?? [];
    if (products.length === 0) break;
    for (const p of products) {
      const name = cleanName(p.title);
      if (!name || SKIP_WORDS.test(name)) continue;
      const image = p.images?.[0]?.src;
      if (!image) continue; // the whole point is real images
      const variant = p.variants?.[0];
      const id = `ibloom-${slugify(p.handle)}`;
      items.push({
        id,
        name,
        brandId: "ibloom",
        type: "slow-rise-foam",
        size: guessSize(name),
        imageUrl: image,
        releaseDate: p.published_at ? p.published_at.slice(0, 10) : undefined,
        sourceUrl: `https://i-bloom.shop/en-us/products/${p.handle}`,
        imageSource: "i-BLOOM official shop",
        dateAdded: dateAddedFor(id),
      });
      if (variant?.price != null) {
        listings.push({
          id: `sl-${id}`,
          squishyId: id,
          retailerId: "i-bloom-shop",
          inStock: Boolean(variant.available),
          price: Number(variant.price),
          currency: "USD",
          lastChecked: TODAY,
        });
      }
    }
    if (products.length < 250) break;
  }
  return { items, listings };
}

// ---------------------------------------------------- Squishy Japan (Woo)
const SJ_BRAND_MAP = new Map([
  ["ibloom", "ibloom"],
  ["chawa", "chawa"],
  ["punimaru", "puni-maru"],
  ["puni maru", "puni-maru"],
  ["puni-maru", "puni-maru"],
]);

async function importSquishyJapan() {
  const items = [];
  const listings = [];
  for (let page = 1; page <= 10; page++) {
    const data = await fetchJson(
      `https://squishy-japan.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`
    );
    if (!Array.isArray(data) || data.length === 0) break;
    for (const p of data) {
      const brandId = (p.categories ?? [])
        .map((c) => SJ_BRAND_MAP.get(c.name.toLowerCase().trim()))
        .find(Boolean);
      if (!brandId) continue; // only take products in mapped brand categories
      // Brand prefix ("IBloom – …") is redundant next to brandId; strip it
      // after entity decoding so the en-dash matches.
      const name = cleanName(p.name).replace(/^(ibloom|chawa|punimaru|puni maru)\s*[–—-]\s*/i, "").trim();
      if (!name || SKIP_WORDS.test(name)) continue;
      const image = p.images?.[0]?.src;
      if (!image) continue;
      const id = `sj-${slugify(p.slug ?? name)}`;
      items.push({
        id,
        name,
        brandId,
        type: "slow-rise-foam",
        size: guessSize(name),
        imageUrl: image,
        sourceUrl: p.permalink,
        imageSource: "Squishy Japan",
        dateAdded: dateAddedFor(id),
      });
      // Variable products report price 0 in the list feed — omit rather
      // than show a bogus ¥0.
      const priceMinor = p.prices?.price != null ? Number(p.prices.price) : 0;
      const unit = p.prices?.currency_minor_unit ?? 0;
      listings.push({
        id: `sl-${id}`,
        squishyId: id,
        retailerId: "squishy-japan",
        inStock: Boolean(p.is_in_stock),
        ...(priceMinor > 0 ? { price: priceMinor / 10 ** unit, currency: p.prices?.currency_code ?? "JPY" } : {}),
        lastChecked: TODAY,
      });
    }
    if (data.length < 100) break;
  }
  return { items, listings };
}

// ------------------------------------------------------------------ main
const [ibloom, sj] = await Promise.all([importIbloom(), importSquishyJapan()]);

// Same product often exists in both feeds; keep the official iBloom copy.
const seenNames = new Set(ibloom.items.map((i) => i.name.toLowerCase()));
const sjItems = sj.items.filter((i) => !seenNames.has(i.name.toLowerCase()));
const sjItemIds = new Set(sjItems.map((i) => i.id));
const sjListings = sj.listings.filter((l) => sjItemIds.has(l.squishyId));

// Guard against slug collisions within a single feed run.
const byId = new Map();
for (const item of [...ibloom.items, ...sjItems]) {
  if (!byId.has(item.id)) byId.set(item.id, item);
}
const items = [...byId.values()];
const itemIds = new Set(items.map((i) => i.id));
const listings = [...ibloom.listings, ...sjListings].filter((l) => itemIds.has(l.squishyId));

const banner = `// AUTO-GENERATED by scripts/import-products.mjs on ${TODAY} — do not edit by hand.
// Sources: i-bloom.shop (official iBloom Shopify feed), squishy-japan.com
// (WooCommerce Store API). Images are hotlinked from each shop's CDN and
// attributed via imageSource/sourceUrl. Re-run the script to refresh.
import type { Squishy, StockListing } from "@/lib/types";

`;

const body =
  `export const importedSquishies: Squishy[] = ${JSON.stringify(items, null, 2)};\n\n` +
  `export const importedStockListings: StockListing[] = ${JSON.stringify(listings, null, 2)};\n`;

writeFileSync(OUT_PATH, banner + body);
console.log(
  `Wrote ${items.length} squishies (${ibloom.items.length} iBloom official, ${sjItems.length} Squishy Japan) ` +
    `and ${listings.length} stock listings to src/data/imported.ts`
);
