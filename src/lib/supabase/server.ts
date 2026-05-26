import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

/**
 * Server-side Supabase client untuk Server Components, Server Actions,
 * Route Handlers, dan generateMetadata.
 *
 * Pakai ini untuk:
 *  - Membaca data publik (RLS akan menerapkan policy "anonim hanya
 *    SELECT produk yang available").
 *  - Membaca/menulis data sebagai admin yang sudah login (RLS akan
 *    membaca cookie sb-* yang otomatis di-handle oleh `cookies()`).
 *  - Validasi sesi (`auth.getUser()`) di guard halaman admin.
 */
export function createSupabaseServerClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of items) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Setting cookies dari Server Component di-throw oleh Next.
          // Aman diabaikan kalau middleware sudah meng-handle refresh
          // session (lihat src/middleware.ts).
        }
      },
    },
  });
}
