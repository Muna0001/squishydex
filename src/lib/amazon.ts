import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Squishy } from "./types";
import { brandLabelOf } from "@/data";

// "Buy on Amazon" link resolution. The affiliate-tracked URL comes from
// the amazon_product_cache table, which scripts/refresh-amazon.mjs fills
// via the Creator API (credentials live in env, never in the client).
// Until an item is cached — or if the API is ever down — we fall back to
// a plain Amazon search so the button is never a dead end.

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

    const fallback: AmazonLink = { url: searchFallbackUrl(squishy), tracked: false };
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
