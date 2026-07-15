import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { brandLabelOf } from "@/data";
import { colors, radius } from "@/lib/theme";
import type { Squishy } from "@/lib/types";
import { CollectButtons } from "./collect-buttons";
import { QuantityStepper } from "./quantity-stepper";
import { SquishyImage } from "./squishy-image";

// Grid card: image, name, brand — tap anywhere to open the detail page.
// Compact collect/wishlist pills live at the bottom so the core loop
// (see it → save it) never requires leaving the grid. readOnly drops the
// pills (viewing someone else's collection); withQuantity swaps them for
// the copies-owned stepper (own collection screen).
export function SquishyCard({
  squishy,
  readOnly = false,
  withQuantity = false,
}: {
  squishy: Squishy;
  readOnly?: boolean;
  withQuantity?: boolean;
}) {
  const router = useRouter();
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`View ${squishy.name}`}
        onPress={() => router.push(`/squishy/${squishy.id}`)}
        style={({ pressed }) => [styles.tapArea, pressed && styles.pressed]}
      >
        <View style={styles.imageBox}>
          <SquishyImage squishy={squishy} />
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {squishy.name}
        </Text>
        <Text style={styles.brand} numberOfLines={1}>
          {brandLabelOf(squishy)}
        </Text>
      </Pressable>
      {!readOnly &&
        (withQuantity ? (
          <QuantityStepper squishyId={squishy.id} />
        ) : (
          <CollectButtons squishyId={squishy.id} compact />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 8,
  },
  tapArea: {
    gap: 4,
  },
  pressed: {
    opacity: 0.8,
  },
  imageBox: {
    aspectRatio: 1,
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
    minHeight: 36,
  },
  brand: {
    fontSize: 12,
    color: colors.muted,
  },
});
