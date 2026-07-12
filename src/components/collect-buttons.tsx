import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCollection } from "@/lib/store";
import { colors, radius } from "@/lib/theme";

// The one interaction that matters everywhere: own it / want it.
// `compact` renders icon-only pills for grid cards; the full version
// (detail page) is the screen's hero action with labels.
export function CollectButtons({ squishyId, compact = false }: { squishyId: string; compact?: boolean }) {
  const { statusOf, toggle } = useCollection();
  const status = statusOf(squishyId);
  const owned = status === "owned";
  const wished = status === "wishlist";

  return (
    <View style={[styles.row, compact ? styles.rowCompact : null]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={owned ? "Remove from collection" : "Add to collection"}
        onPress={() => toggle(squishyId, "owned")}
        style={({ pressed }) => [
          styles.pill,
          compact ? styles.pillCompact : null,
          owned ? styles.pillOwned : styles.pillIdle,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[compact ? styles.iconCompact : styles.icon, owned && styles.textActiveOwned]}>
          {owned ? "✓" : "+"}
        </Text>
        {!compact && (
          <Text style={[styles.label, owned && styles.textActiveOwned]}>
            {owned ? "In collection" : "Add to collection"}
          </Text>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={wished ? "Remove from wishlist" : "Add to wishlist"}
        onPress={() => toggle(squishyId, "wishlist")}
        style={({ pressed }) => [
          styles.pill,
          compact ? styles.pillCompact : null,
          wished ? styles.pillWished : styles.pillIdle,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[compact ? styles.iconCompact : styles.icon, wished && styles.textActiveWish]}>
          {wished ? "♥" : "♡"}
        </Text>
        {!compact && (
          <Text style={[styles.label, wished && styles.textActiveWish]}>
            {wished ? "On wishlist" : "Add to wishlist"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowCompact: {
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    borderWidth: 1.5,
  },
  pillCompact: {
    paddingVertical: 5,
    paddingHorizontal: 0,
  },
  pillIdle: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  pillOwned: {
    backgroundColor: colors.ownedSoft,
    borderColor: colors.owned,
  },
  pillWished: {
    backgroundColor: colors.wishSoft,
    borderColor: colors.wish,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.muted,
  },
  iconCompact: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  textActiveOwned: {
    color: colors.owned,
  },
  textActiveWish: {
    color: colors.wish,
  },
});
