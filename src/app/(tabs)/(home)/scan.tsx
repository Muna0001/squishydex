import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { Field, PrimaryButton } from "@/components/form";
import { useCatalog } from "@/lib/catalog";
import { colors, MAX_CONTENT_WIDTH } from "@/lib/theme";

// Scan a barcode → straight to the item if we know it, straight into
// the submission flow (barcode pre-filled) if we don't. Never a dead end.

export default function ScanScreen() {
  const router = useRouter();
  const catalog = useCatalog();
  const [manualCode, setManualCode] = useState("");
  const [lastMiss, setLastMiss] = useState<string | null>(null);

  const handleCode = useCallback(
    (code: string) => {
      const clean = code.trim();
      if (!clean) return;
      const match = catalog.all.find((s) => s.barcode && s.barcode === clean);
      if (match) {
        router.replace(`/squishy/${match.id}`);
      } else {
        setLastMiss(clean);
        router.replace(`/submit?barcode=${encodeURIComponent(clean)}`);
      }
    },
    [catalog, router]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "Scan a barcode" }} />
      <Text style={styles.title}>Scan a barcode</Text>
      <Text style={styles.body}>
        Point the camera at the barcode on the packaging. Known items open right up; new ones go
        straight into "Add a product" with the barcode filled in.
      </Text>

      <BarcodeScanner onScanned={handleCode} />

      <View style={styles.manual}>
        <Text style={styles.manualTitle}>Or type it in</Text>
        <Field
          label=""
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="e.g. 4573151890123"
          inputMode="numeric"
        />
        <PrimaryButton
          label="Look up barcode"
          disabled={manualCode.trim().length < 6}
          onPress={() => handleCode(manualCode)}
        />
        {lastMiss && (
          <Text style={styles.missNote}>
            {`"${lastMiss}" wasn't in the database — routing to Add a product.`}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    width: "100%",
    maxWidth: Math.min(480, MAX_CONTENT_WIDTH),
    alignSelf: "center",
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
    paddingTop: 8,
  },
  body: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  manual: {
    gap: 8,
    marginTop: 8,
  },
  manualTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  missNote: {
    fontSize: 13,
    color: colors.muted,
  },
});
