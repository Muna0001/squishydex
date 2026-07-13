import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { SquishyCard } from "@/components/squishy-card";
import { SquishyGrid } from "@/components/squishy-grid";
import {
  brandsWithItems,
  formatLabel,
  sizesWithItems,
  typesWithItems,
} from "@/data";
import { useCatalog } from "@/lib/catalog";
import { colors, radius } from "@/lib/theme";
import type { SquishySize, SquishyType } from "@/lib/types";

// Browse: the home screen. Hero action = search. New arrivals surface
// only in the default (unfiltered) state; filters stay collapsed until
// asked for — progressive disclosure over a wall of controls.
export default function BrowseScreen() {
  const catalog = useCatalog();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [type, setType] = useState<SquishyType | null>(null);
  const [size, setSize] = useState<SquishySize | null>(null);

  const filterCount = [brandId, type, size].filter(Boolean).length;
  const isFiltering = query.trim().length > 0 || filterCount > 0;

  const results = useMemo(
    () => catalog.search(query, { brandId, type, size }),
    [catalog, query, brandId, type, size]
  );

  const clearFilters = () => {
    setBrandId(null);
    setType(null);
    setSize(null);
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.appTitle}>SquishyDex</Text>
      <Text style={styles.tagline}>Track every squishy you own — and the ones you want.</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name, brand, or type…"
        placeholderTextColor={colors.faint}
        style={styles.search}
        accessibilityLabel="Search squishies"
        autoCorrect={false}
      />

      <View style={styles.filterRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setFiltersOpen((v) => !v)}
          style={({ pressed }) => [styles.filterToggle, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.filterToggleText}>
            {filtersOpen ? "Hide filters" : "Filters"}
            {filterCount > 0 ? ` (${filterCount})` : ""}
          </Text>
        </Pressable>
        {filterCount > 0 && (
          <Pressable accessibilityRole="button" onPress={clearFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="link" onPress={() => router.push("/scan")}>
          <Text style={styles.headerAction}>📷 Scan</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push("/submit")}>
          <Text style={styles.headerAction}>＋ Add</Text>
        </Pressable>
      </View>

      {filtersOpen && (
        <View style={styles.filterPanel}>
          <FilterGroup label="Type">
            {typesWithItems().map((t) => (
              <Chip
                key={t}
                label={formatLabel(t)}
                active={type === t}
                onPress={() => setType(type === t ? null : t)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Size">
            {sizesWithItems().map((s) => (
              <Chip
                key={s}
                label={formatLabel(s)}
                active={size === s}
                onPress={() => setSize(size === s ? null : s)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Brand">
            {brandsWithItems().map((b) => (
              <Chip
                key={b.id}
                label={b.name}
                active={brandId === b.id}
                onPress={() => setBrandId(brandId === b.id ? null : b.id)}
              />
            ))}
          </FilterGroup>
        </View>
      )}

      {!isFiltering && (
        <>
          <Text style={styles.sectionTitle}>New arrivals</Text>
          <FlatList
            horizontal
            data={catalog.newest(6)}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => (
              <View style={styles.railCard}>
                <SquishyCard squishy={item} />
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            showsHorizontalScrollIndicator={false}
            style={styles.rail}
          />
        </>
      )}

      <Text style={styles.sectionTitle}>
        {isFiltering
          ? `${results.length} result${results.length === 1 ? "" : "s"}`
          : "All squishies"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <SquishyGrid
        items={results}
        header={header}
        empty={
          <EmptyState
            emoji="🔍"
            title="No squishies found"
            message="Try a different name, or loosen a filter — the database is growing."
            ctaLabel="Clear search"
          />
        }
      />
    </SafeAreaView>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupLabel}>{label}</Text>
      <View style={styles.chipWrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    gap: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
  },
  tagline: {
    fontSize: 14,
    color: colors.muted,
    marginTop: -6,
  },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
    fontSize: 15,
    color: colors.ink,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  filterToggle: {
    paddingVertical: 4,
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  clearText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.wish,
  },
  headerAction: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  filterPanel: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
  },
  filterGroup: {
    gap: 6,
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 10,
  },
  rail: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  railCard: {
    width: 170,
  },
});
