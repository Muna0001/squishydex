import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

// Browse tab's stack: the catalog plus everything reachable from it
// (item detail, scanner, add-a-product). Living inside the tab keeps
// the bottom nav visible on every screen.
export default function HomeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="squishy/[id]" options={{ title: "" }} />
      <Stack.Screen name="scan" options={{ title: "Scan a barcode" }} />
      <Stack.Screen name="submit" options={{ title: "Add a product" }} />
    </Stack>
  );
}
