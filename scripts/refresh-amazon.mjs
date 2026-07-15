#!/usr/bin/env node
/**
 * Refresh the amazon_product_cache table from the Amazon Creator API.
 *
 * Collects every amazonAsin in the catalog, looks each one up, and
 * upserts { asin, tracked_url, price, currency, image_url, refreshed_at }.
 * The app reads this cache (see src/lib/amazon.ts) instead of calling
 * Amazon per page view — the Creator API's rate limits are tied to
 * qualified sales volume, so calls are precious.
 *
 * Credentials come from .env (NEVER commit them; .env is gitignored):
 *   AMAZON_CREDENTIAL_ID=...        Associates Central → Tools → Creators API
 *   AMAZON_CREDENTIAL_SECRET=...
 *   AMAZON_CREDENTIAL_VERSION=...
 *   AMAZON_PARTNER_TAG=...          your Associate tag, e.g. squishydex-20
 *   SUPABASE_SERVICE_ROLE_KEY=...   Supabase → Settings → API (server-only key)
 *
 * Usage: node scripts/refresh-amazon.mjs
 * Re-run whenever ASINs are added or ~daily for price/availability.
 * Requires: npm i amazon-creators-api (only needed on the machine running this).
 */

import { readFileSync } from "node:fs";

const env = {
  ...Object.fromEntries(
    readFileSync(new URL("../.env", import.meta.url), "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
  ),
  ...process.env,
};

const REQUIRED = [
  "AMAZON_CREDENTIAL_ID",
  "AMAZON_CREDENTIAL_SECRET",
  "AMAZON_CREDENTIAL_VERSION",
  "AMAZON_PARTNER_TAG",
  "SUPABASE_SERVICE_ROLE_KEY",
  "EXPO_PUBLIC_SUPABASE_URL",
];
const missing = REQUIRED.filter((k) => !env[k]);
if (missing.length > 0) {
  console.error(
    `Missing credentials: ${missing.join(", ")}\n` +
      "Add them to .env (gitignored). Creator API credentials come from\n" +
      "Associates Central → Tools → Creators API; the service role key from\n" +
      "Supabase → Settings → API. Aborting without calling anything."
  );
  process.exit(1);
}

// Gather ASINs from the static catalog (imported + seed data files).
// Submissions don't carry ASINs yet.
const asins = new Set();
for (const file of ["../src/data/squishies.ts", "../src/data/imported.ts"]) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  for (const m of source.matchAll(/amazonAsin['"]?\s*:\s*["']([A-Z0-9]{10})["']/g)) {
    asins.add(m[1]);
  }
}
if (asins.size === 0) {
  console.log("No amazonAsin values in the catalog yet — nothing to refresh.");
  process.exit(0);
}
console.log(`Refreshing ${asins.size} ASIN(s)…`);

// Creator API lookup via the community SDK (types over Amazon's official
// Node SDK): https://www.npmjs.com/package/amazon-creators-api
const { CreatorsApiClient } = await import("amazon-creators-api").catch(() => {
  console.error("amazon-creators-api not installed — run: npm i amazon-creators-api");
  process.exit(1);
});

const client = new CreatorsApiClient({
  credentialId: env.AMAZON_CREDENTIAL_ID,
  credentialSecret: env.AMAZON_CREDENTIAL_SECRET,
  credentialVersion: env.AMAZON_CREDENTIAL_VERSION,
  partnerTag: env.AMAZON_PARTNER_TAG,
});

const rows = [];
for (const asin of asins) {
  try {
    const item = await client.getItems({ itemIds: [asin] });
    const result = item?.itemsResult?.items?.[0];
    if (!result) {
      console.warn(`  ${asin}: no result — skipped`);
      continue;
    }
    rows.push({
      asin,
      tracked_url: result.detailPageUrl,
      price: result.offersV2?.listings?.[0]?.price?.money?.amount ?? null,
      currency: result.offersV2?.listings?.[0]?.price?.money?.currencyCode ?? null,
      image_url: result.images?.primary?.large?.url ?? null,
      refreshed_at: new Date().toISOString(),
    });
    console.log(`  ${asin}: ok`);
  } catch (e) {
    console.warn(`  ${asin}: lookup failed (${e.message}) — keeping any cached row`);
  }
}

if (rows.length > 0) {
  const res = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/amazon_product_cache`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error(`Cache upsert failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
}
console.log(`Done — ${rows.length}/${asins.size} cached.`);
