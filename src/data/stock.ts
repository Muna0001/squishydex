import type { StockListing } from "@/lib/types";

export const stockListings: StockListing[] = [
  // iBloom — import specialists
  { id: "sl-1", squishyId: "ibloom-millie-bread", retailerId: "plaza-japan", inStock: true, price: 38.99, lastChecked: "2026-07-11" },
  { id: "sl-2", squishyId: "ibloom-millie-bread", retailerId: "silly-squishies", inStock: false, price: 42.0, lastChecked: "2026-07-10" },
  { id: "sl-3", squishyId: "ibloom-angie-bear", retailerId: "plaza-japan", inStock: true, price: 24.99, lastChecked: "2026-07-11" },
  { id: "sl-4", squishyId: "ibloom-angie-bear", retailerId: "amazon", inStock: true, price: 29.99, lastChecked: "2026-07-09" },

  // Puni Maru
  { id: "sl-5", squishyId: "puni-maru-mochi-seal", retailerId: "plaza-japan", inStock: false, price: 34.99, lastChecked: "2026-07-11" },
  { id: "sl-6", squishyId: "puni-maru-mochi-seal", retailerId: "silly-squishies", inStock: true, price: 36.5, lastChecked: "2026-07-12" },
  { id: "sl-7", squishyId: "puni-maru-baby-dragon", retailerId: "silly-squishies", inStock: true, price: 18.99, lastChecked: "2026-07-08" },

  // Kiibru / Chawa / Anboor — mostly online
  { id: "sl-8", squishyId: "kiibru-watermelon", retailerId: "amazon", inStock: true, price: 15.99, lastChecked: "2026-07-10" },
  { id: "sl-9", squishyId: "kiibru-watermelon", retailerId: "aliexpress", inStock: true, price: 9.87, lastChecked: "2026-07-07" },
  { id: "sl-10", squishyId: "chawa-melon-bun", retailerId: "kawaii-factory", inStock: false, price: 16.0, lastChecked: "2026-07-05" },
  { id: "sl-11", squishyId: "anboor-unicorn-cake", retailerId: "amazon", inStock: true, price: 11.99, lastChecked: "2026-07-11" },

  // NeeDoh — wide mass-retail footprint
  { id: "sl-12", squishyId: "needoh-classic", retailerId: "target", inStock: true, price: 6.99, lastChecked: "2026-07-12" },
  { id: "sl-13", squishyId: "needoh-classic", retailerId: "walmart", inStock: true, price: 6.47, lastChecked: "2026-07-11" },
  { id: "sl-14", squishyId: "needoh-classic", retailerId: "walgreens", inStock: false, price: 7.99, lastChecked: "2026-07-09" },
  { id: "sl-15", squishyId: "needoh-nice-cube", retailerId: "target", inStock: true, price: 7.99, lastChecked: "2026-07-12" },
  { id: "sl-16", squishyId: "needoh-nice-cube", retailerId: "learning-express", inStock: true, price: 8.99, lastChecked: "2026-07-06" },

  // Blind bag / capsule
  { id: "sl-17", squishyId: "smooshy-mushy-besties", retailerId: "five-below", inStock: true, price: 5.0, lastChecked: "2026-07-10" },
  { id: "sl-18", squishyId: "orb-odditeez-slimi-ball", retailerId: "five-below", inStock: false, price: 5.55, lastChecked: "2026-07-08" },
  { id: "sl-19", squishyId: "orb-odditeez-slimi-ball", retailerId: "amazon", inStock: true, price: 8.49, lastChecked: "2026-07-11" },
  { id: "sl-20", squishyId: "mashems-paw-patrol", retailerId: "walmart", inStock: true, price: 4.97, lastChecked: "2026-07-10" },
  { id: "sl-21", squishyId: "mashems-paw-patrol", retailerId: "cvs", inStock: true, price: 5.79, lastChecked: "2026-07-07" },

  // Licensed / mass-market
  { id: "sl-22", squishyId: "sanrio-hello-kitty-bun", retailerId: "hot-topic", inStock: true, price: 12.9, lastChecked: "2026-07-12" },
  { id: "sl-23", squishyId: "sanrio-hello-kitty-bun", retailerId: "claires", inStock: false, price: 14.99, lastChecked: "2026-07-10" },
  { id: "sl-24", squishyId: "squishmallows-cam-the-cat", retailerId: "target", inStock: true, price: 12.99, lastChecked: "2026-07-12" },
  { id: "sl-25", squishyId: "squishmallows-cam-the-cat", retailerId: "claires", inStock: true, price: 14.99, lastChecked: "2026-07-11" },
  { id: "sl-26", squishyId: "squishmallows-cam-the-cat", retailerId: "barnes-noble", inStock: false, price: 13.5, lastChecked: "2026-07-09" },
  { id: "sl-27", squishyId: "top-trenz-sugar-donut", retailerId: "itsugar", inStock: true, price: 9.99, lastChecked: "2026-07-10" },
  { id: "sl-28", squishyId: "top-trenz-sugar-donut", retailerId: "learning-express", inStock: true, price: 10.99, lastChecked: "2026-07-08" },

  // Amazon affiliate listings (Nate's tagged amzn.to links), verified
  // in-stock on amazon.com 2026-07-14.
  { id: "sl-29", squishyId: "needoh-color-changing", retailerId: "amazon", inStock: true, price: 40.0, lastChecked: "2026-07-14", url: "https://amzn.to/3T0B5k8" },
  { id: "sl-30", squishyId: "needoh-fuzz-ball-wonder-waves", retailerId: "amazon", inStock: true, price: 39.98, lastChecked: "2026-07-14", url: "https://amzn.to/4ppJXvN" },
  { id: "sl-31", squishyId: "needoh-gummy-bear-purple", retailerId: "amazon", inStock: true, price: 29.99, lastChecked: "2026-07-14", url: "https://amzn.to/4fiv6yH" },
  { id: "sl-32", squishyId: "needoh-worlds-smallest", retailerId: "amazon", inStock: true, price: 22.6, lastChecked: "2026-07-14", url: "https://amzn.to/3SR9L81" },
  { id: "sl-33", squishyId: "tansix-dumpling-mystery", retailerId: "amazon", inStock: true, price: 16.13, lastChecked: "2026-07-14", url: "https://amzn.to/4gErTf0" },
];
