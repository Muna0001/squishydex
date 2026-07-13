import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { colors, radius } from "@/lib/theme";

// Native barcode scanner (iOS/Android) via expo-camera. The web build
// resolves barcode-scanner.web.tsx instead. Product barcodes are EAN/UPC;
// QR included since some import shops sticker their own codes.

export function BarcodeScanner({ onScanned }: { onScanned: (code: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View style={styles.box} />;

  if (!permission.granted) {
    return (
      <View style={[styles.box, styles.center]}>
        <Text style={styles.hint}>SquishyDex needs camera access to scan barcodes.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={requestPermission}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.buttonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "qr"],
        }}
        onBarcodeScanned={(result) => {
          if (result?.data) onScanned(result.data);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    aspectRatio: 1,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: "#1A171E",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  hint: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.wish,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
