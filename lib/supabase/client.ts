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

/*
 * Supabase renamed the browser-safe key: older projects call it the anon key,
 * newer ones the publishable key. Accept either name so whichever the
 * dashboard hands you works without editing anything.
 *
 * Both must be referenced literally — Next.js substitutes NEXT_PUBLIC_ vars
 * at build time by matching the source text, not by reading process.env.
 */
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  cached ??= createClient(url!, anonKey!, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cached;
}
