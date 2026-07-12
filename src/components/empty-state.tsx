import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, radius } from "@/lib/theme";

export function EmptyState({
  emoji,
  title,
  message,
  ctaLabel = "Browse squishies",
}: {
  emoji: string;
  title: string;
  message: string;
  ctaLabel?: string;
}) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/")}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 24,
    gap: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
  },
  message: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 320,
  },
  cta: {
    marginTop: 12,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
