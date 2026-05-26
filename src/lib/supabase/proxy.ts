import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabasePublicEnv, hasSupabaseEnv } from "./env";

/**
 * Refresh Supabase auth token di edge middleware.
 *
 * Tujuan utama:
 *  1. Memperbarui cookie `sb-*` setiap request supaya sesi tetap hidup.
 *  2. Server Components & Server Actions yang dipanggil setelahnya bisa
 *     pakai `auth.getUser()` tanpa khawatir cookie expired.
 *
 * Catatan: jangan menambah logika lain di antara `createServerClient()`
 * dan `auth.getUser()` — itu best practice dari Supabase untuk mencegah
 * race condition saat memanggil `getUser()` lebih dulu.
 */
export async function updateSupabaseSession(
  request: NextRequest,
): Promise<NextResponse> {
  // Kalau env Supabase belum tersedia, jangan crash middleware —
  // cukup teruskan request seperti biasa supaya halaman publik
  // tetap bisa dilihat (admin akan diblokir di server guard).
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(items: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value } of items) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of items) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // PENTING: jangan tambahkan kode lain antara baris di atas dan
  // pemanggilan `getUser()` di bawah.
  await supabase.auth.getUser();

  return response;
}
