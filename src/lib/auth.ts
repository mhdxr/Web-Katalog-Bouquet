import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Helper auth admin yang berjalan di server.
 *
 * Sumber kebenaran:
 *  1. Supabase Auth — verifikasi user via `auth.getUser()` (cek cookie).
 *  2. Tabel `admin_users` — whitelist user_id yang boleh akses dashboard.
 *
 * Tidak ada penyimpanan session di localStorage. Halaman `/admin/*`
 * akan men-redirect ke `/admin/login` kalau salah satu cek di atas
 * gagal. Cek RLS di Supabase juga jadi guard tambahan untuk operasi
 * write — meskipun route ini di-bypass, RLS akan tetap menolak.
 */
export interface AdminUser {
  id: string;
  email: string;
}

/**
 * Ambil admin yang sedang login. Return `null` kalau:
 *  - User belum login.
 *  - User login tapi belum terdaftar di tabel `admin_users`.
 *
 * @throws kalau Supabase error tak terduga (misal jaringan / RLS denial).
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    // Bisa terjadi jika tabel belum ada (DB belum di-setup) — log
    // dan anggap bukan admin.
    // eslint-disable-next-line no-console
    console.error("[auth] admin_users lookup error:", adminError.message);
    return null;
  }

  if (!adminRow) return null;

  return { id: user.id, email: user.email ?? "" };
}

/**
 * Cek cepat: apakah user yang sedang login adalah admin? Throw kalau
 * belum login / bukan admin. Berguna untuk Server Action.
 */
export async function requireAdminUser(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("UNAUTHORIZED");
  }
  return admin;
}
