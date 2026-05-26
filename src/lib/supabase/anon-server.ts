import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./env";

/**
 * Anon (cookieless) Supabase client untuk pemakaian server-side
 * read-only di konteks statik (generateStaticParams, sitemap, build
 * time, dll.) di mana `cookies()` dari `next/headers` tidak tersedia.
 *
 * Aman karena:
 *  - hanya pakai publishable/anon key (tidak ada service role).
 *  - RLS tetap berlaku → policy `products_anon_select_available`
 *    membatasi anonim hanya boleh SELECT row dengan `is_available=true`.
 *
 * Jangan pakai untuk operasi admin (insert/update/delete). Untuk admin,
 * pakai `createSupabaseServerClient()` (yang baca cookie sesi).
 */
export function createSupabaseAnonServerClient(): SupabaseClient {
  const { url, anonKey } = getSupabasePublicEnv();
  return createClient(url, anonKey, {
    auth: {
      // Tidak ada user di sisi build → matikan persistensi & auto-refresh.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
