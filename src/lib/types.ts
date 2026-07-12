// Core data model for SquishyDex.
// Extensions beyond the original sketch are marked with comments.

export type BrandCategory =
  | "premium-slow-rise"
  | "gel-silicone-taba"
  | "blind-bag"
  | "novelty-licensed"
  | "micro-collectible"
  | "mass-market"
  | "unbranded-import"; // added: marketplace/import sources (Shein, Temu, ...)

export interface Brand {
  id: string;
  name: string;
  category: BrandCategory;
  region?: string; // e.g. "Japan import"
}

export type SquishyType =
  | "slow-rise-foam"
  | "gel-silicone"
  | "water-filled"
  | "sand-filled"
  | "beaded"
  | "blind-bag"
  | "plush"; // added: plush-adjacent (Squishmallows) so search doesn't feel incomplete

export type SquishySize = "micro" | "mini" | "regular" | "jumbo";

export interface Squishy {
  id: string;
  name: string;
  brandId: string;
  type: SquishyType;
  size: SquishySize;
  scent?: string; // e.g. "strawberry", "unscented"
  imageUrl: string; // real photos later; empty = render emoji placeholder
  releaseDate?: string;
  barcode?: string; // for scanner lookups later
  licensedProperty?: string; // e.g. "Sanrio", "Disney"
  // Placeholder art until real images exist:
  emoji?: string;
  tint?: string; // pastel background hex for the placeholder
  dateAdded: string; // when added to the SquishyDex database (drives "new arrivals")
  // Provenance for imported records (images are hotlinked + attributed):
  sourceUrl?: string; // product page the record was imported from
  imageSource?: string; // attribution label, e.g. "i-BLOOM official shop"
}

export type RetailerCategory = "mass" | "specialty" | "online-import";

export interface Retailer {
  id: string;
  name: string;
  category: RetailerCategory;
  url?: string;
}

export interface StockListing {
  id: string;
  squishyId: string;
  retailerId: string;
  inStock: boolean;
  lastChecked: string;
  price?: number;
  currency?: string; // ISO code; undefined = USD
}

// Phase 1 persists only { status, addedAt } per squishy; the full entry
// shape below is the Phase 2 target (condition, price paid, tags, notes).
export type CollectionStatus = "owned" | "wishlist";

export interface UserCollectionEntry {
  id: string;
  userId: string;
  squishyId: string;
  status: CollectionStatus;
  condition?: "new-with-packaging" | "out-of-packaging" | "loved";
  pricePaid?: number;
  dateAcquired?: string;
  tags: string[]; // user-defined, e.g. "Display Shelf A", "Scented"
  notes?: string;
}
