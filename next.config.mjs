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

const nextConfig = {
  // Image remote sources.
  //
  // PENTING: hanya whitelist domain yang benar-benar dipakai produk.
  // Saat ini seed produk di `src/data/products.ts` masih memakai
  // Unsplash sebagai placeholder. Kalau nanti pindah ke storage final
  // (Supabase Storage / Cloudinary / S3 / Firebase Storage), GANTI
  // entries di bawah ke hostname storage tersebut dan hapus Unsplash.
  // Jangan menambah pola yang terlalu permisif (mis. wildcard global).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
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
