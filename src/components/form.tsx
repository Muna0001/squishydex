import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, radius } from "@/lib/theme";

// Small shared form kit for the auth screens: labeled field, primary
// button, inline error/success notes. Kept deliberately plain — forms
// should feel calm, not clever.

export function Field({
  label,
  ...inputProps
}: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.faint}
        style={styles.input}
        accessibilityLabel={label}
        {...inputProps}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        (disabled || busy) && styles.buttonDisabled,
        pressed && { opacity: 0.85 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

export function Note({ kind, children }: { kind: "error" | "success"; children: string }) {
  return (
    <View style={[styles.note, kind === "error" ? styles.noteError : styles.noteSuccess]}>
      <Text style={[styles.noteText, { color: kind === "error" ? "#B3261E" : colors.owned }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.image,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  link: {
    paddingVertical: 6,
    alignSelf: "center",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.wish,
  },
  note: {
    borderRadius: radius.image,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  noteError: {
    backgroundColor: "#FCE9E7",
  },
  noteSuccess: {
    backgroundColor: colors.ownedSoft,
  },
  noteText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
