import type { Brand } from "@/lib/types";

// NOTE: names marked with a trailing "TODO(spelling)" comment were transcribed
// from handwritten notes and still need a spelling sanity-check before we
// treat them as canonical labels (per the build brief).
export const brands: Brand[] = [
  // Premium / slow-rise collector
  { id: "needoh", name: "NeeDoh (Schylling)", category: "premium-slow-rise" },
  { id: "ibloom", name: "iBloom", category: "premium-slow-rise", region: "Japan import" },
  { id: "puni-maru", name: "Puni Maru", category: "premium-slow-rise", region: "Japan import" },
  { id: "chawa", name: "Chawa", category: "premium-slow-rise" },
  { id: "silky-tot", name: "Silky Tot", category: "premium-slow-rise" }, // TODO(spelling)
  { id: "areedy", name: "Areedy", category: "premium-slow-rise" }, // TODO(spelling)
  { id: "kiibru", name: "Kiibru", category: "premium-slow-rise" },

  // Gel / silicone ("Taba") and fidget-style
  { id: "tabaspeks", name: "TabaSpeks", category: "gel-silicone-taba" }, // TODO(spelling)
  { id: "taba-yabba", name: "Taba Yabba", category: "gel-silicone-taba" }, // TODO(spelling)
  { id: "anboor", name: "Anboor", category: "gel-silicone-taba" },
  { id: "smooshy-mushy", name: "Smooshy Mushy", category: "gel-silicone-taba" },
  { id: "squeezy", name: "Squeezy", category: "gel-silicone-taba" }, // TODO(spelling)
  { id: "squeeztuck", name: "Squeeztuck", category: "gel-silicone-taba" }, // TODO(spelling)
  { id: "smushers", name: "Smushers", category: "gel-silicone-taba" }, // TODO(spelling)
  { id: "love-squishy", name: "Love Squishy", category: "gel-silicone-taba" }, // TODO(spelling)

  // Blind bag / capsule / novelty
  { id: "sunny-days", name: "Sunny Days Entertainment", category: "blind-bag" },
  { id: "orb", name: "ORB (Odditeez)", category: "blind-bag" },
  { id: "mashems", name: "Mash'ems / Fash'ems", category: "blind-bag" },
  { id: "top-trenz", name: "Top Trenz", category: "blind-bag" },
  { id: "jiggly-piggly", name: "Jiggly Piggly", category: "blind-bag" }, // TODO(spelling)
  { id: "vat19", name: "Vat19", category: "blind-bag" },
  { id: "joyfy", name: "Joyfy", category: "blind-bag" }, // TODO(spelling)
  { id: "edntoy", name: "EDNTOY", category: "blind-bag" }, // TODO(spelling)
  { id: "chiboki", name: "Chiboki", category: "blind-bag" }, // TODO(spelling)
  { id: "puka-creations", name: "Puka Creations", category: "blind-bag" }, // TODO(spelling)
  { id: "tansix", name: "Tansix", category: "blind-bag" },

  // Licensed / novelty food
  { id: "kool-aid", name: "Kool-Aid", category: "novelty-licensed" },
  { id: "oreo", name: "Oreo", category: "novelty-licensed" },
  { id: "kraft", name: "Kraft", category: "novelty-licensed" },
  { id: "jet-puffed", name: "Jet-Puffed", category: "novelty-licensed" },
  { id: "sour-patch-kids", name: "Sour Patch Kids", category: "novelty-licensed" },

  // Licensed slow-rise
  { id: "sanrio", name: "Sanrio / Hello Kitty", category: "novelty-licensed" },
  { id: "disney-pixar", name: "Disney / Pixar", category: "novelty-licensed" },

  // Micro-collectible
  { id: "moose-toys", name: "Moose Toys (Shopkins, Real Littles)", category: "micro-collectible" },

  // Mass-market plush-adjacent
  { id: "squishmallows", name: "Squishmallows (Kellytoy)", category: "mass-market" },

  // Marketplace / import sources — origins, not brands
  { id: "shein", name: "Shein (unbranded import)", category: "unbranded-import" },
  { id: "temu", name: "Temu (unbranded import)", category: "unbranded-import" },
  { id: "rms-international", name: "RMS International", category: "unbranded-import" },
  { id: "fun-doh", name: "Fun Doh", category: "unbranded-import" }, // TODO(spelling) — verify squishy-relevant vs. modeling compound
  { id: "mochi-unbranded", name: "Mochi-style unbranded import", category: "unbranded-import" }, // TODO(spelling)
];

export const brandById = new Map(brands.map((b) => [b.id, b]));
