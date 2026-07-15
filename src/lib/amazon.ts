import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Squishy } from "./types";
import { brandLabelOf, stockListings } from "@/data";

// "Buy on Amazon" link resolution, best source first:
//   1. amazon_product_cache (Creator API via scripts/refresh-amazon.mjs)
//   2. a hand-entered affiliate deep link on the item's Amazon stock
//      listing (amzn.to short links carry the tag already)
//   3. a plain Amazon search — the button is never a dead end.

export interface AmazonLink {
  url: string;
  /** True when this is the affiliate-tracked product URL from the cache. */
  tracked: boolean;
  price?: number;
  currency?: string;
}

export function searchFallbackUrl(squishy: Squishy): string {
  const query = encodeURIComponent(`${brandLabelOf(squishy)} ${squishy.name} squishy`);
  return `https://www.amazon.com/s?k=${query}`;
}

export function useAmazonLink(squishy: Squishy | undefined): AmazonLink | null {
  const [link, setLink] = useState<AmazonLink | null>(null);

  useEffect(() => {
    setLink(null);
    if (!squishy?.amazonAsin) return;

    const listing = stockListings.find(
      (l) => l.squishyId === squishy.id && l.retailerId === "amazon" && l.url
    );
    const fallback: AmazonLink = listing?.url
      ? { url: listing.url, tracked: true, price: listing.price, currency: listing.currency }
      : { url: searchFallbackUrl(squishy), tracked: false };
    if (!supabase) {
      setLink(fallback);
      return;
    }

    let cancelled = false;
    supabase
      .from("amazon_product_cache")
      .select("tracked_url, price, currency")
      .eq("asin", squishy.amazonAsin)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data?.tracked_url) {
          setLink({
            url: data.tracked_url,
            tracked: true,
            price: data.price ?? undefined,
            currency: data.currency ?? undefined,
          });
        } else {
          setLink(fallback);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [squishy?.id, squishy?.amazonAsin]);

  return link;
}
