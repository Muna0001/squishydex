import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Backend config comes from env (EXPO_PUBLIC_* vars are inlined at build
// time). Without them the app runs in local-only mode: browse/collect
// still work against localStorage, and the Account tab explains that
// accounts aren't set up yet.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null;
