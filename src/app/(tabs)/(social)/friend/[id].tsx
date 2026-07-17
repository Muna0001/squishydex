import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Chip } from "@/components/chip";
import { SquishyGrid } from "@/components/squishy-grid";
import { useCatalog } from "@/lib/catalog";
import { fetchFriendEntries, type FriendEntry } from "@/lib/friends";
import { colors } from "@/lib/theme";
import type { CollectionStatus } from "@/lib/types";

// A friend's collection, read-only. Reuses the same grid as everywhere
// else — the only differences are no collect pills and a status toggle.

export default function FriendCollectionScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const catalog = useCatalog();
  const [entries, setEntries] = useState<FriendEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CollectionStatus>("owned");

  useEffect(() => {
    if (!id) return;
    fetchFriendEntries(id)
      .then(setEntries)
      .catch((e) => setError(e.message));
  }, [id]);

  const items = useMemo(
    () =>
      (entries ?? [])
        .filter((e) => e.status === view)
        .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
        .map((e) => catalog.resolve(e.squishyId))
        .filter((s) => s !== undefined),
    [entries, view, catalog]
  );

  const ownedCount = (entries ?? []).filter((e) => e.status === "owned").length;
  const wishCount = (entries ?? []).filter((e) => e.status === "wishlist").length;
  const title = name ? `${name}'s collection` : "Friend's collection";

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title }} />
      {error ? (
        <Text style={styles.error}>
          Couldn't load this collection — you may no longer be friends. ({error})
        </Text>
      ) : entries === null ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.muted} />
      ) : (
        <SquishyGrid
          items={items}
          readOnly
          header={
            <View style={styles.header}>
              <View style={styles.toggleRow}>
                <Chip
                  label={`Collection (${ownedCount})`}
                  active={view === "owned"}
                  onPress={() => setView("owned")}
                />
                <Chip
                  label={`Wishlist (${wishCount})`}
                  active={view === "wishlist"}
                  onPress={() => setView("wishlist")}
                />
              </View>
            </View>
          }
          empty={
            <Text style={styles.empty}>
              {view === "owned" ? "Nothing collected yet." : "Nothing wished for yet."}
            </Text>
          }
        />
      )}
    </View>
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
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  error: {
    fontSize: 14,
    color: colors.muted,
    padding: 24,
    textAlign: "center",
  },
  empty: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    paddingVertical: 48,
  },
});
