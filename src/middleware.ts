import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

/**
 * =====================================================================
 * Edge middleware
 * =====================================================================
 * Tugas:
 *
 *   1. Maintenance mode (kalau MAINTENANCE_MODE === "true")
 *      → Redirect public route ke /maintenance.
 *      → Admin / API / static asset / route maintenance itu sendiri
 *        TIDAK di-redirect supaya admin tetap bisa login & update data.
 *
 *   2. Refresh Supabase auth session untuk request non-static
 *      → Cookie sb-* tetap valid sehingga Server Components & Server
 *        Actions yang dipanggil setelahnya bisa pakai
 *        `auth.getUser()`.
 *
 * Urutan penting: maintenance check dilakukan DULU. Kalau di-redirect,
 * kita keluar lebih cepat tanpa menyentuh Supabase. Untuk path yang
 * tidak di-redirect (admin, api), kita tetap lanjut ke
 * `updateSupabaseSession()`.
 * =====================================================================
 */

/**
 * Path prefix yang dikecualikan dari maintenance redirect. Dicek
 * dengan `pathname.startsWith()` (selain "/maintenance" yang dicek
 * exact agar pengunjung bisa membuka halaman maintenance-nya
 * langsung).
 *
 * Catatan: matcher di bawah sudah meng-exclude `_next/static`,
 * `_next/image`, `favicon.ico`, `images/`, dan file gambar — jadi
 * middleware ini TIDAK pernah dipanggil untuk asset itu. Daftar di
 * sini fokus ke route aplikasi (admin, api, robots, sitemap, dll.)
 * dan _next/data yang masih bisa lewat matcher.
 */
const MAINTENANCE_BYPASS_PREFIXES = [
  "/admin", // login & dashboard tetap diakses saat maintenance
  "/api", // route handler internal
  "/_next", // chunk JS / RSC payload yang dibutuhkan halaman maintenance
  "/robots.txt",
  "/sitemap.xml",
] as const;

function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}

function shouldBypassMaintenance(pathname: string): boolean {
  // Jangan loop redirect ke halaman maintenance itu sendiri.
  if (pathname === "/maintenance") return true;
  return MAINTENANCE_BYPASS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Maintenance mode redirect (paling awal supaya hemat resource).
  if (isMaintenanceMode() && !shouldBypassMaintenance(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 2. Untuk path yang lolos maintenance check, lanjut ke refresh
  //    session Supabase. Halaman maintenance sendiri juga ikut
  //    refresh — tidak masalah, hanya tambah satu fetch ke Supabase
  //    sekali per request.
  return updateSupabaseSession(request);
}

export const config = {
  // Skip aset statis & file image — middleware tidak perlu sentuh itu.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
