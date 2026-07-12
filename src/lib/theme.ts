// SquishyDex palette — soft, rounded, warm. One accent per job:
// pink = wishlist, green = owned, everything else stays quiet.
export const colors = {
  bg: "#FDF8F3",
  card: "#FFFFFF",
  border: "#F0E6DC",
  ink: "#332E38",
  muted: "#8D8496",
  faint: "#BBB2C4",

  wish: "#F0568C",
  wishSoft: "#FDE3ED",
  owned: "#1FA97E",
  ownedSoft: "#DDF4EC",

  chipBg: "#F6F0EA",
  chipActiveBg: "#332E38",
  chipActiveText: "#FFFFFF",

  inStock: "#1FA97E",
  outOfStock: "#C3BBCB",
};

export const radius = {
  card: 18,
  image: 14,
  pill: 999,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// Shared max content width so wide desktop windows don't stretch the grid.
export const MAX_CONTENT_WIDTH = 1080;
