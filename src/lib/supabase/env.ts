/**
 * Helper aman untuk membaca env Supabase.
 * Wajib dipanggil dari titik awal pemakaian client supaya error bisa
 * jelas terlihat (bukan "supabase is undefined" yang membingungkan).
 */

const URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const ANON_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

/** Validasi & ambil env Supabase publik (URL + anon/publishable key). */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      `[supabase] env belum lengkap. Set ${URL_KEY} dan ${ANON_KEY} ` +
        "di .env.local (lokal) atau di Vercel Project Settings (production).",
    );
  }

  return { url, anonKey };
}

/** Cek tersedia tanpa throw — bermanfaat untuk feature flag / fallback. */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}