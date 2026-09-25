import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 * La Content-Security-Policy avec nonce sera ajoutée au Sprint 10,
 * une fois les domaines du paiement et du stockage des médias fixés.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Domaine du stockage des médias (Supabase Storage / CDN), à renseigner au Sprint 3.
    remotePatterns: process.env.NEXT_PUBLIC_MEDIA_HOST
      ? [{ protocol: "https", hostname: process.env.NEXT_PUBLIC_MEDIA_HOST }]
      : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
