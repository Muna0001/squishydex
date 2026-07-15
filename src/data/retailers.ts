import type { Retailer } from "@/lib/types";

export const retailers: Retailer[] = [
  // Mass retailers
  { id: "target", name: "Target", category: "mass", url: "https://www.target.com" },
  { id: "walmart", name: "Walmart", category: "mass", url: "https://www.walmart.com" },
  // Five Below East/West were requested as separate entries, but both
  // regions sell through the single fivebelow.com storefront (the split
  // only matters for restock timing), so this stays one retailer per the
  // brief's same-storefront exception. Revisit if stock alerts ever need
  // per-region tracking.
  { id: "five-below", name: "Five Below", category: "mass", url: "https://www.fivebelow.com" },
  { id: "walgreens", name: "Walgreens", category: "mass", url: "https://www.walgreens.com" },
  { id: "cvs", name: "CVS", category: "mass", url: "https://www.cvs.com" },
  { id: "best-buy", name: "Best Buy", category: "mass", url: "https://www.bestbuy.com" },
  { id: "costco", name: "Costco (US)", category: "mass", url: "https://www.costco.com" },
  { id: "kohls", name: "Kohl's", category: "mass", url: "https://www.kohls.com" },

  // Specialty & toy stores
  // (Claire's/Icing and Hot Topic/BoxLunch were combined seed entries;
  // split 2026-07 so each gets its own outbound link. Existing ids kept —
  // stock listings reference them.)
  { id: "claires", name: "Claire's", category: "specialty", url: "https://www.claires.com" },
  { id: "icing", name: "Icing", category: "specialty", url: "https://www.icing.com" },
  { id: "itsugar", name: "It'sugar", category: "specialty", url: "https://itsugar.com" },
  { id: "hot-topic", name: "Hot Topic", category: "specialty", url: "https://www.hottopic.com" },
  { id: "boxlunch", name: "BoxLunch", category: "specialty", url: "https://www.boxlunch.com" },
  { id: "barnes-noble", name: "Barnes & Noble", category: "specialty", url: "https://www.barnesandnoble.com" },
  { id: "learning-express", name: "Learning Express & local toy stores", category: "specialty", url: "https://learningexpress.com" },
  { id: "gamestop", name: "GameStop", category: "specialty", url: "https://www.gamestop.com" },
  { id: "cedar-fair", name: "Cedar Fair parks", category: "specialty", url: "https://www.cedarfair.com" },
  { id: "cracker-barrel", name: "Cracker Barrel", category: "specialty", url: "https://shop.crackerbarrel.com" },

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
