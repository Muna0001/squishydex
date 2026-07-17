import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth";
import { CollectionProvider } from "@/lib/store";
import { SubmissionsProvider } from "@/lib/submissions";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubmissionsProvider>
      <CollectionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      </CollectionProvider>
      </SubmissionsProvider>
    </AuthProvider>
  );
}
