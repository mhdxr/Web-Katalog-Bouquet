"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

/**
 * Browser-side Supabase client.
 *
 * Pakai untuk operasi sisi client seperti `signInWithPassword`,
 * `signOut`, dan listener `onAuthStateChange`. Untuk membaca/menulis
 * data, lebih disarankan via Server Component / Server Action supaya
 * RLS dan session-nya konsisten.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
