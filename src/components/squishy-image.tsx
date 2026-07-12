import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { radius } from "@/lib/theme";
import type { Squishy } from "@/lib/types";

// Renders the squishy's photo when we have one; otherwise a pastel
// emoji placeholder so the catalog never shows broken images.
export function SquishyImage({ squishy, emojiSize = 44 }: { squishy: Squishy; emojiSize?: number }) {
  if (squishy.imageUrl) {
    return <Image source={{ uri: squishy.imageUrl }} style={styles.fill} contentFit="cover" />;
  }
  return (
    <View style={[styles.fill, styles.placeholder, { backgroundColor: squishy.tint ?? "#F0EAE2" }]}>
      <Text style={{ fontSize: emojiSize, lineHeight: emojiSize * 1.25 }}>{squishy.emoji ?? "🧸"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: "100%",
    height: "100%",
    borderRadius: radius.image,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
});
