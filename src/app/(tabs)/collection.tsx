import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/empty-state";
import { SquishyGrid } from "@/components/squishy-grid";
import { useCatalog } from "@/lib/catalog";
import { useCollection } from "@/lib/store";
import { colors } from "@/lib/theme";

export default function CollectionScreen() {
  const { idsWithStatus, quantityOf } = useCollection();
  const catalog = useCatalog();
  const ownedIds = idsWithStatus("owned");
  const items = ownedIds
    .map((id) => catalog.resolve(id))
    .filter((s) => s !== undefined);
  // Collectors keep duplicates — count copies, not just distinct items.
  const totalCopies = ownedIds.reduce((sum, id) => sum + quantityOf(id), 0);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <SquishyGrid
        items={items}
        withQuantity
        header={
          <View style={styles.header}>
            <Text style={styles.title}>My Collection</Text>
            {items.length > 0 && (
              <Text style={styles.count}>
                {totalCopies} squish{totalCopies === 1 ? "y" : "ies"}
                {totalCopies !== items.length ? ` (${items.length} unique)` : ""}
              </Text>
            )}
          </View>
        }
        empty={
          <EmptyState
            emoji="🗂️"
            title="Nothing collected yet"
            message="Find a squishy you own and tap ✓ to start your collection."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    gap: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
  },
  count: {
    fontSize: 14,
    color: colors.muted,
  },
});
