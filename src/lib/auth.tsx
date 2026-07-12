import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { User } from "./types";

// Auth state + actions. All methods throw with a human-readable message
// on failure; screens catch and display. When Supabase isn't configured,
// `configured` is false and the Account screen explains the situation
// instead of rendering forms.

interface AuthContextValue {
  configured: boolean;
  loading: boolean; // true until the initial session check resolves
  user: User | null;
  session: Session | null;
  signUp(email: string, password: string, displayName: string): Promise<{ needsEmailConfirm: boolean }>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  updateProfile(fields: { displayName?: string; avatarUrl?: string }): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Where Supabase's password-recovery email should land. On web this is
// the current origin + base path; the native app will register a deep
// link when the iOS build happens.
function resetRedirectUrl(): string {
  if (typeof window !== "undefined") {
    // e.g. https://muna0001.github.io/squishydex/reset-password
    const base = window.location.origin + (window.location.pathname.startsWith("/squishydex") ? "/squishydex" : "");
    return `${base.replace(/\/$/, "")}/reset-password`;
  }
  return "https://muna0001.github.io/squishydex/reset-password";
}

async function fetchProfile(userId: string): Promise<{ displayName: string; avatarUrl?: string; authProvider: "email" | "google"; createdAt: string } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, auth_provider, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    displayName: data.display_name,
    avatarUrl: data.avatar_url ?? undefined,
    authProvider: data.auth_provider,
    createdAt: data.created_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  // Load profile whenever the session's user changes.
  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    async function applySession(s: Session | null) {
      setSession(s);
      if (!s?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      const profile = await fetchProfile(s.user.id);
      if (cancelled) return;
      setUser({
        id: s.user.id,
        email: s.user.email ?? "",
        displayName: profile?.displayName || (s.user.email ?? "").split("@")[0],
        avatarUrl: profile?.avatarUrl,
        createdAt: profile?.createdAt ?? s.user.created_at,
        authProvider: profile?.authProvider ?? "email",
      });
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      applySession(s);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const requireClient = useCallback(() => {
    if (!supabase) throw new Error("Accounts aren't set up yet — the backend isn't configured.");
    return supabase;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const client = requireClient();
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: displayName.trim() } },
      });
      if (error) throw new Error(error.message);
      // With email confirmation enabled, no session comes back yet.
      return { needsEmailConfirm: !data.session };
    },
    [requireClient]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const client = requireClient();
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message);
    },
    [requireClient]
  );

  const signOut = useCallback(async () => {
    const client = requireClient();
    const { error } = await client.auth.signOut();
    if (error) throw new Error(error.message);
  }, [requireClient]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      const client = requireClient();
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: resetRedirectUrl(),
      });
      if (error) throw new Error(error.message);
    },
    [requireClient]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      const client = requireClient();
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
    },
    [requireClient]
  );

  const updateProfile = useCallback(
    async (fields: { displayName?: string; avatarUrl?: string }) => {
      const client = requireClient();
      if (!user) throw new Error("Not signed in.");
      const patch: Record<string, string> = {};
      if (fields.displayName !== undefined) patch.display_name = fields.displayName.trim();
      if (fields.avatarUrl !== undefined) patch.avatar_url = fields.avatarUrl;
      const { error } = await client.from("profiles").update(patch).eq("id", user.id);
      if (error) throw new Error(error.message);
      setUser({
        ...user,
        displayName: fields.displayName?.trim() ?? user.displayName,
        avatarUrl: fields.avatarUrl ?? user.avatarUrl,
      });
    },
    [requireClient, user]
  );

  const value = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      user,
      session,
      signUp,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
      updateProfile,
    }),
    [loading, user, session, signUp, signIn, signOut, requestPasswordReset, updatePassword, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
