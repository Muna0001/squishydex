import React from "react";
import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";
import { MAX_CONTENT_WIDTH } from "@/lib/theme";
import type { Squishy } from "@/lib/types";
import { SquishyCard } from "./squishy-card";

// Responsive grid: 2 columns on phones up to 5 on wide desktop windows.
// Header/empty slots let each screen keep this as its single scroll surface.
export function SquishyGrid({
  items,
  header,
  empty,
}: {
  items: Squishy[];
  header?: React.ReactElement;
  empty?: React.ReactElement;
}) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const numColumns = Math.min(5, Math.max(2, Math.floor(contentWidth / 190)));

  return (
    <FlatList
      key={numColumns} // FlatList can't change numColumns in place
      data={items}
      keyExtractor={(s) => s.id}
      numColumns={numColumns}
      renderItem={({ item }) => (
        // Cap each cell at its column share so a lone item in the last
        // row doesn't stretch into a giant full-width card.
        <View style={{ flex: 1, maxWidth: `${100 / numColumns}%` }}>
          <SquishyCard squishy={item} />
        </View>
      )}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      style={styles.list}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ItemSeparatorComponent={Spacer}
      keyboardShouldPersistTaps="handled"
    />
  );
}

function Spacer() {
  return <View style={{ height: 12 }} />;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  row: {
    gap: 12,
  },
});
