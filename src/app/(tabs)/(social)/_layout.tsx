import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

// Friends tab's stack: the friends list plus friend collection views.
export default function SocialStackLayout() {
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
      <Stack.Screen name="friends" options={{ headerShown: false }} />
      <Stack.Screen name="friend/[id]" options={{ title: "" }} />
    </Stack>
  );
}
