import type { Retailer } from "@/lib/types";

export const retailers: Retailer[] = [
  // Mass retailers
  { id: "target", name: "Target", category: "mass", url: "https://www.target.com" },
  { id: "walmart", name: "Walmart", category: "mass", url: "https://www.walmart.com" },
  { id: "five-below", name: "Five Below", category: "mass", url: "https://www.fivebelow.com" },
  { id: "walgreens", name: "Walgreens", category: "mass", url: "https://www.walgreens.com" },
  { id: "cvs", name: "CVS", category: "mass", url: "https://www.cvs.com" },

  // Specialty & toy stores
  { id: "claires", name: "Claire's / Icing", category: "specialty", url: "https://www.claires.com" },
  { id: "itsugar", name: "It'sugar", category: "specialty", url: "https://itsugar.com" },
  { id: "hot-topic", name: "Hot Topic / BoxLunch", category: "specialty", url: "https://www.hottopic.com" },
  { id: "barnes-noble", name: "Barnes & Noble", category: "specialty", url: "https://www.barnesandnoble.com" },
  { id: "learning-express", name: "Learning Express & local toy stores", category: "specialty", url: "https://learningexpress.com" },

  // Online & import
  { id: "amazon", name: "Amazon", category: "online-import", url: "https://www.amazon.com" },
  { id: "aliexpress", name: "AliExpress", category: "online-import", url: "https://www.aliexpress.com" },
  { id: "plaza-japan", name: "Plaza Japan", category: "online-import", url: "https://www.plazajapan.com" },
  // No url on purpose: sillysquishies.com is defunct and the domain now
  // 301-redirects to an unrelated adult site (verified 2026-07-12). Keep the
  // name for historical listings but never link it.
  { id: "silly-squishies", name: "Silly Squishies", category: "online-import" },
  { id: "kawaii-factory", name: "Kawaii Factory", category: "online-import" },
  { id: "i-bloom-shop", name: "i-BLOOM Official Shop", category: "online-import", url: "https://i-bloom.shop/en-us" },
  { id: "squishy-japan", name: "Squishy Japan", category: "online-import", url: "https://squishy-japan.com" },
];

export const retailerById = new Map(retailers.map((r) => [r.id, r]));
