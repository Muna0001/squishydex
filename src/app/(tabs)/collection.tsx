import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { SquishyGrid } from "@/components/squishy-grid";
import { brandLabelOf } from "@/data";
import { useCatalog } from "@/lib/catalog";
import { useCollection } from "@/lib/store";
import { colors } from "@/lib/theme";

// Sort modes for the collection. Brand A→Z is the default — collectors
// think in brands — with recency and name a tap away.
type SortMode = "brand" | "recent" | "name";

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: "brand", label: "By brand" },
  { key: "recent", label: "Recent" },
  { key: "name", label: "A–Z" },
];

export default function CollectionScreen() {
  const { idsWithStatus, quantityOf } = useCollection();
  const catalog = useCatalog();
  const [sort, setSort] = useState<SortMode>("brand");

  const ownedIds = idsWithStatus("owned"); // newest-first
  const items = useMemo(() => {
    const resolved = ownedIds
      .map((id) => catalog.resolve(id))
      .filter((s) => s !== undefined);
    if (sort === "recent") return resolved;
    if (sort === "name") {
      return [...resolved].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...resolved].sort(
      (a, b) =>
        brandLabelOf(a).localeCompare(brandLabelOf(b)) || a.name.localeCompare(b.name)
    );
  }, [ownedIds, catalog, sort]);

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
              <>
                <Text style={styles.count}>
                  {totalCopies} squish{totalCopies === 1 ? "y" : "ies"}
                  {totalCopies !== items.length ? ` (${items.length} unique)` : ""}
                </Text>
                <View style={styles.sortRow}>
                  {SORT_OPTIONS.map((o) => (
                    <Chip
                      key={o.key}
                      label={o.label}
                      active={sort === o.key}
                      onPress={() => setSort(o.key)}
                    />
                  ))}
                </View>
              </>
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
  sortRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
});
