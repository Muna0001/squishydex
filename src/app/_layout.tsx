import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth";
import { CollectionProvider } from "@/lib/store";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CollectionProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="squishy/[id]" options={{ title: "" }} />
        <Stack.Screen name="reset-password" options={{ title: "Reset password" }} />
      </Stack>
      </CollectionProvider>
    </AuthProvider>
  );
}
