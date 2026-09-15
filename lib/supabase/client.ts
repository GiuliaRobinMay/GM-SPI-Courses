import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The Supabase connection, when one is configured.
 *
 * Both values are public by design: the anon key is meant to ship to the
 * browser, and row level security (see supabase/schema.sql) is what actually
 * protects the data. With no env vars set the app falls back to IndexedDB, so
 * it runs with no backend at all.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  cached ??= createClient(url!, anonKey!, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cached;
}
