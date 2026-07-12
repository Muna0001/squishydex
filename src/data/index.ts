import { brandById, brands } from "./brands";
import { retailerById, retailers } from "./retailers";
import { squishies, squishyById } from "./squishies";
import { stockListings } from "./stock";
import type { Retailer, Squishy, SquishySize, SquishyType, StockListing } from "@/lib/types";

export { brandById, brands, retailerById, retailers, squishies, squishyById, stockListings };

export function brandName(brandId: string): string {
  return brandById.get(brandId)?.name ?? "Unknown brand";
}

export interface ListingWithRetailer {
  listing: StockListing;
  retailer: Retailer;
}

export function listingsForSquishy(squishyId: string): ListingWithRetailer[] {
  return stockListings
    .filter((l) => l.squishyId === squishyId)
    .map((listing) => ({ listing, retailer: retailerById.get(listing.retailerId)! }))
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
  const q = query.trim().toLowerCase();
  return squishies.filter((s) => {
    if (filters.brandId && s.brandId !== filters.brandId) return false;
    if (filters.type && s.type !== filters.type) return false;
    if (filters.size && s.size !== filters.size) return false;
    if (!q) return true;
    const haystack = [
      s.name,
      brandName(s.brandId),
      s.type.replace(/-/g, " "),
      s.scent ?? "",
      s.licensedProperty ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return q.split(/\s+/).every((word) => haystack.includes(word));
  });
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

// "slow-rise-foam" -> "Slow Rise Foam". For enum-ish values only —
// brand names are already proper labels and must not be re-cased.
export function formatLabel(value: string): string {
  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
