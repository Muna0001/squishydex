import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

// Account tab's stack: profile/auth plus the password-recovery landing
// page (email links target /reset-password; the (me) group is invisible
// in URLs so that path is unchanged).
export default function MeStackLayout() {
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
      <Stack.Screen name="account" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ title: "Reset password" }} />
    </Stack>
  );
}
