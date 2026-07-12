import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Field, LinkText, Note, PrimaryButton } from "@/components/form";
import { useAuth } from "@/lib/auth";
import { useCollection } from "@/lib/store";
import { colors, MAX_CONTENT_WIDTH, radius } from "@/lib/theme";

// Account tab. One thing on screen at a time: sign in, create account,
// or reset request — never all three. Signed in, it's a plain profile.

type Mode = "signin" | "signup" | "forgot";

const AVATAR_EMOJI = ["🧸", "🍞", "🦭", "🍩", "🦄", "🍉", "🎀", "🐱", "🫧", "🐉"];

export default function AccountScreen() {
  const auth = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Account</Text>
        {!auth.configured ? (
          <NotConfigured />
        ) : auth.loading ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={colors.muted} />
        ) : auth.user ? (
          <Profile />
        ) : (
          <AuthForms />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NotConfigured() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Accounts aren't set up yet</Text>
      <Text style={styles.body}>
        Your collection and wishlist are saved on this device for now. Once the backend is
        connected, you'll be able to create an account and take them anywhere.
      </Text>
    </View>
  );
}

function AuthForms() {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
  };

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "forgot") {
    return (
      <View style={styles.form}>
        <Text style={styles.formTitle}>Reset your password</Text>
        <Text style={styles.body}>
          Enter your account email and we'll send you a link to set a new password.
        </Text>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />
        {error && <Note kind="error">{error}</Note>}
        {success && <Note kind="success">{success}</Note>}
        <PrimaryButton
          label="Send reset link"
          busy={busy}
          disabled={!email.includes("@")}
          onPress={() =>
            run(async () => {
              await requestPasswordReset(email);
              setSuccess("Check your email for the reset link.");
            })
          }
        />
        <LinkText label="Back to sign in" onPress={() => switchMode("signin")} />
      </View>
    );
  }

  const isSignup = mode === "signup";
  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>{isSignup ? "Create your account" : "Welcome back"}</Text>
      <Text style={styles.body}>
        {isSignup
          ? "Your device's collection and wishlist come with you automatically."
          : "Sign in to sync your collection across devices."}
      </Text>
      {isSignup && (
        <Field
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="SquishFan99"
          autoComplete="username"
        />
      )}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={isSignup ? "new-password" : "current-password"}
        placeholder={isSignup ? "At least 6 characters" : "Your password"}
      />
      {error && <Note kind="error">{error}</Note>}
      {success && <Note kind="success">{success}</Note>}
      <PrimaryButton
        label={isSignup ? "Create account" : "Sign in"}
        busy={busy}
        disabled={!email.includes("@") || password.length < 6 || (isSignup && !displayName.trim())}
        onPress={() =>
          run(async () => {
            if (isSignup) {
              const { needsEmailConfirm } = await signUp(email, password, displayName);
              if (needsEmailConfirm) {
                setSuccess("Almost there — check your email to confirm your account.");
              }
            } else {
              await signIn(email, password);
            }
          })
        }
      />
      {!isSignup && <LinkText label="Forgot password?" onPress={() => switchMode("forgot")} />}
      <LinkText
        label={isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
        onPress={() => switchMode(isSignup ? "signin" : "signup")}
      />
    </View>
  );
}

function Profile() {
  const { user, signOut, updateProfile } = useAuth();
  const { syncing, idsWithStatus } = useCollection();
  const [name, setName] = useState(user?.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;
  const avatarEmoji = user.avatarUrl?.startsWith("emoji:")
    ? user.avatarUrl.slice(6)
    : AVATAR_EMOJI[0];
  const owned = idsWithStatus("owned").length;
  const wished = idsWithStatus("wishlist").length;

  async function save(fields: { displayName?: string; avatarUrl?: string }) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateProfile(fields);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.form}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
        </View>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.profileName}>{user.displayName}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <Text style={styles.profileMeta}>
            {syncing ? "Syncing collection…" : `${owned} collected · ${wished} wished`}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Avatar</Text>
        <View style={styles.avatarRow}>
          {AVATAR_EMOJI.map((e) => (
            <Pressable
              key={e}
              accessibilityRole="button"
              accessibilityLabel={`Use ${e} as avatar`}
              onPress={() => save({ avatarUrl: `emoji:${e}` })}
              style={[styles.avatarChoice, avatarEmoji === e && styles.avatarChoiceActive]}
            >
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Display name</Text>
        <Field label="" value={name} onChangeText={setName} placeholder="Display name" />
        <PrimaryButton
          label="Save name"
          busy={busy}
          disabled={!name.trim() || name.trim() === user.displayName}
          onPress={() => save({ displayName: name })}
        />
      </View>

      {error && <Note kind="error">{error}</Note>}
      {saved && <Note kind="success">Saved.</Note>}

      <LinkText label="Sign out" onPress={() => signOut().catch(() => {})} />
    </View>
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
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    paddingTop: 8,
  },
  form: {
    gap: 14,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
  },
  body: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.muted,
  },
  profileMeta: {
    fontSize: 13,
    color: colors.faint,
    marginTop: 2,
  },
  avatarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  avatarChoice: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarChoiceActive: {
    borderColor: colors.ink,
    backgroundColor: colors.card,
  },
});
