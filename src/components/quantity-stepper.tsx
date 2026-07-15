import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCollection } from "@/lib/store";
import { colors, radius } from "@/lib/theme";

// Copies-owned stepper for collection cards. Minus at ×1 removes the
// item (same as un-collecting — reversible, so no confirm dance).
export function QuantityStepper({ squishyId }: { squishyId: string }) {
  const { quantityOf, setQuantity } = useCollection();
  const qty = quantityOf(squishyId);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={qty === 1 ? "Remove from collection" : "One fewer copy"}
        onPress={() => setQuantity(squishyId, qty - 1)}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <Text style={styles.count} accessibilityLabel={`${qty} owned`}>
        ×{qty}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="One more copy"
        onPress={() => setQuantity(squishyId, qty + 1)}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.buttonText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.chipBg,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  button: {
    width: 32,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  count: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
});
