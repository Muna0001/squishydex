import { amazonStock } from "./amazon-stock";
import { brandById, brands } from "./brands";
import { importedSquishies, importedStockListings } from "./imported";
import { retailerById, retailers } from "./retailers";
import { squishies as seedSquishies } from "./squishies";
import { stockListings as seedStockListings } from "./stock";
import type { Retailer, Squishy, SquishySize, SquishyType, StockListing } from "@/lib/types";

export { brandById, brands, retailerById, retailers };

// Hand-seeded + imported catalog. When an imported product shares a name
// with a hand-seeded one, the hand-seeded entry wins (stable ids — they
// may already be in user collections).
const seedNames = new Set(seedSquishies.map((s) => s.name.toLowerCase()));
export const squishies: Squishy[] = [
  ...seedSquishies,
  ...importedSquishies.filter((s) => !seedNames.has(s.name.toLowerCase())),
];
export const squishyById = new Map(squishies.map((s) => [s.id, s]));

export const stockListings: StockListing[] = [...seedStockListings, ...importedStockListings];

export function brandName(brandId: string): string {
  return brandById.get(brandId)?.name ?? "Unknown brand";
}

// Display brand for any squishy, including user-submitted new brands.
export function brandLabelOf(squishy: Squishy): string {
  return squishy.brandLabel ?? brandName(squishy.brandId);
}

// One squishy against one query+filter set — shared by catalog search and
// user-submission search so both behave identically.
export function matchesSquishy(s: Squishy, query: string, filters: SearchFilters = {}): boolean {
  if (filters.brandId && s.brandId !== filters.brandId) return false;
  if (filters.type && s.type !== filters.type) return false;
  if (filters.size && s.size !== filters.size) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    s.name,
    brandLabelOf(s),
    s.type.replace(/-/g, " "),
    s.scent ?? "",
    s.licensedProperty ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export interface ListingWithRetailer {
  listing: StockListing;
  retailer: Retailer;
}

export function listingsForSquishy(squishyId: string): ListingWithRetailer[] {
  const asin = squishyById.get(squishyId)?.amazonAsin;
  return stockListings
    .filter((l) => l.squishyId === squishyId)
    .map((listing) => {
      // Overlay the daily Amazon availability check onto Amazon listings
      // (price only overrides when the check captured one confidently).
      const live = listing.retailerId === "amazon" && asin ? amazonStock[asin] : undefined;
      const merged = live
        ? {
            ...listing,
            inStock: live.inStock,
            lastChecked: live.lastChecked,
            ...(live.price != null ? { price: live.price } : {}),
          }
        : listing;
      return { listing: merged, retailer: retailerById.get(listing.retailerId)! };
    })
    .filter((x) => x.retailer)
    .sort((a, b) => Number(b.listing.inStock) - Number(a.listing.inStock));
}

export function newArrivals(limit = 6): Squishy[] {
  return [...squishies]
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
    .slice(0, limit);
}

export interface SearchFilters {
  brandId?: string | null;
  type?: SquishyType | null;
  size?: SquishySize | null;
}

// Search by name, brand name, type, scent, or licensed property.
export function searchSquishies(query: string, filters: SearchFilters = {}): Squishy[] {
  return squishies.filter((s) => matchesSquishy(s, query, filters));
}

// Only offer brand filters for brands that actually have items in the catalog.
export function brandsWithItems() {
  const used = new Set(squishies.map((s) => s.brandId));
  return brands.filter((b) => used.has(b.id));
}

export function typesWithItems(): SquishyType[] {
  return [...new Set(squishies.map((s) => s.type))];
}

export function sizesWithItems(): SquishySize[] {
  const order: SquishySize[] = ["micro", "mini", "regular", "jumbo"];
  const used = new Set(squishies.map((s) => s.size));
  return order.filter((s) => used.has(s));
}

export function formatPrice(price: number, currency?: string): string {
  if (currency === "JPY") return `¥${Math.round(price).toLocaleString()}`;
  return `$${price.toFixed(2)}`;
}

// "slow-rise-foam" -> "Slow Rise Foam". For enum-ish values only —
// brand names are already proper labels and must not be re-cased.
export function formatLabel(value: string): string {
  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
