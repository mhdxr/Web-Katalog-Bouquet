/** @type {import('next').NextConfig} */

/**
 * Security headers dasar yang dipasang ke semua route.
 *
 * Catatan: ini cuma baseline. Kalau nanti pakai third-party iframes /
 * embed (mis. YouTube, Google Maps, dll.), longgarkan secukupnya saja —
 * jangan pukul rata.
 */
const securityHeaders = [
  // Cegah situs di-iframe (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Cegah MIME-sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Hanya kirim referrer ke origin sendiri saat lintas-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable akses ke fitur sensitif yang tidak dipakai.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/**
 * Ambil hostname Supabase dari env `NEXT_PUBLIC_SUPABASE_URL`.
 *
 * Hostname ini dipakai di `images.remotePatterns` supaya Next/Image bisa
 * meng-optimize gambar produk yang di-upload admin ke Supabase Storage.
 *
 * Pathname dibatasi ke bucket `product-images` saja — kita TIDAK pakai
 * wildcard global supaya tidak menerima sembarang path dari domain
 * Supabase (mis. file-file dari project lain seandainya hostname-nya
 * sama).
 *
 * Kalau env belum di-set (mis. saat lint lokal tanpa .env.local), kita
 * skip pattern ini supaya build/lint tidak gagal hanya gara-gara env.
 */
function getSupabaseStoragePattern() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return {
      protocol: "https",
      hostname: u.hostname,
      pathname: "/storage/v1/object/public/product-images/**",
    };
  } catch {
    return null;
  }
}

const supabaseStoragePattern = getSupabaseStoragePattern();

const nextConfig = {
  // Image remote sources.
  //
  // PENTING: hanya whitelist domain yang benar-benar dipakai produk.
  // - Unsplash: dipakai di seed produk (`src/data/products.ts`) sebagai
  //   placeholder demo. Boleh di-hapus setelah semua produk pindah ke
  //   Supabase Storage.
  // - Supabase Storage: tujuan upload gambar produk dari admin
  //   dashboard. Dibatasi ke bucket `product-images` (public read).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      ...(supabaseStoragePattern ? [supabaseStoragePattern] : []),
    ],
  },

  async headers() {
    return [
      {
        // Berlaku untuk semua route.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
