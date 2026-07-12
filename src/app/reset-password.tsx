import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { Field, Note, PrimaryButton } from "@/components/form";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

// Landing page for the password-recovery email. Supabase's JS client
// parses the token from the URL hash automatically and establishes a
// recovery session; we just wait for it, then let the user set a new
// password.

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword, configured } = useAuth();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setFailed(true);
      return;
    }
    // The recovery link signs the user in with a short-lived session.
    // If no session shows up shortly, the link is invalid or expired.
    let settled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && !settled) {
        settled = true;
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !settled) {
        settled = true;
        setReady(true);
      }
    });
    const timer = setTimeout(() => {
      if (!settled) setFailed(true);
    }, 4000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set a new password</Text>

      {!configured || failed ? (
        <Note kind="error">
          This reset link is invalid or has expired. Request a new one from the Account tab.
        </Note>
      ) : !ready ? (
        <Text style={styles.body}>Checking your reset link…</Text>
      ) : done ? (
        <>
          <Note kind="success">Password updated — you're signed in.</Note>
          <PrimaryButton label="Go to my account" onPress={() => router.replace("/account")} />
        </>
      ) : (
        <>
          <Field
            label="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="At least 6 characters"
          />
          <Field
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
            placeholder="Same again"
          />
          {mismatch && <Note kind="error">Passwords don't match.</Note>}
          {error && <Note kind="error">{error}</Note>}
          <PrimaryButton
            label="Set new password"
            busy={busy}
            disabled={password.length < 6 || password !== confirm}
            onPress={async () => {
              setBusy(true);
              setError(null);
              try {
                await updatePassword(password);
                setDone(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Couldn't update password.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </>
      )}
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
    maxWidth: 480,
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
  },
});
