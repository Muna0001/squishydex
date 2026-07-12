import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { CollectButtons } from "@/components/collect-buttons";
import { SquishyImage } from "@/components/squishy-image";
import { brandName, formatLabel, listingsForSquishy, squishyById } from "@/data";
import { colors, MAX_CONTENT_WIDTH, radius } from "@/lib/theme";

// Detail page. Hero action = collect/wishlist; facts and retailers
// follow in order of what a collector actually asks: what is it →
// do I have it → where can I get it.
export default function SquishyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const squishy = squishyById.get(id ?? "");

  if (!squishy) {
    return (
      <View style={styles.missing}>
        <Stack.Screen options={{ title: "Not found" }} />
        <Text style={styles.missingText}>This squishy isn't in the database (yet).</Text>
      </View>
    );
  }

  const listings = listingsForSquishy(squishy.id);

  const facts: [string, string][] = [
    ["Type", formatLabel(squishy.type)],
    ["Size", squishy.size],
    ...(squishy.scent ? ([["Scent", squishy.scent]] as [string, string][]) : []),
    ...(squishy.licensedProperty
      ? ([["License", squishy.licensedProperty]] as [string, string][])
      : []),
    ...(squishy.releaseDate ? ([["Released", squishy.releaseDate]] as [string, string][]) : []),
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: squishy.name }} />

      <View style={styles.hero}>
        <SquishyImage squishy={squishy} emojiSize={96} />
      </View>

      <Text style={styles.name}>{squishy.name}</Text>
      <Text style={styles.brand}>{brandName(squishy.brandId)}</Text>

      <CollectButtons squishyId={squishy.id} />

      <View style={styles.factCard}>
        {facts.map(([label, value]) => (
          <View key={label} style={styles.factRow}>
            <Text style={styles.factLabel}>{label}</Text>
            <Text style={styles.factValue}>{value}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Where to find it</Text>
      {listings.length === 0 ? (
        <Text style={styles.noListings}>
          No known retailers yet — check back as the database grows.
        </Text>
      ) : (
        <View style={styles.listingCard}>
          {listings.map(({ listing, retailer }, i) => (
            <Pressable
              key={listing.id}
              accessibilityRole={retailer.url ? "link" : "none"}
              onPress={retailer.url ? () => Linking.openURL(retailer.url!) : undefined}
              style={({ pressed }) => [
                styles.listingRow,
                i > 0 && styles.listingDivider,
                pressed && retailer.url ? { opacity: 0.7 } : null,
              ]}
            >
              <View style={styles.listingLeft}>
                <Text style={styles.retailerName}>
                  {retailer.name}
                  {retailer.url ? " ↗" : ""}
                </Text>
                <Text style={styles.lastChecked}>Checked {listing.lastChecked}</Text>
              </View>
              <View style={styles.listingRight}>
                {listing.price != null && (
                  <Text style={styles.price}>${listing.price.toFixed(2)}</Text>
                )}
                <View
                  style={[
                    styles.stockBadge,
                    { backgroundColor: listing.inStock ? colors.ownedSoft : colors.chipBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.stockText,
                      { color: listing.inStock ? colors.inStock : colors.muted },
                    ]}
                  >
                    {listing.inStock ? "In stock" : "Out of stock"}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 12,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH * 0.6,
    alignSelf: "center",
  },
  hero: {
    aspectRatio: 1.4,
    borderRadius: radius.card,
    overflow: "hidden",
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.ink,
  },
  brand: {
    fontSize: 15,
    color: colors.muted,
    marginTop: -8,
  },
  factCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  factRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  factLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  factValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    textTransform: "capitalize",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 8,
  },
  noListings: {
    fontSize: 14,
    color: colors.muted,
  },
  listingCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: 16,
  },
  listingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 12,
  },
  listingDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  listingLeft: {
    flexShrink: 1,
    gap: 2,
  },
  retailerName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  lastChecked: {
    fontSize: 12,
    color: colors.faint,
  },
  listingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  stockBadge: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "700",
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: 24,
  },
  missingText: {
    fontSize: 15,
    color: colors.muted,
  },
});
