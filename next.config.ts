import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  return {
    output: "standalone",
    // Pisahkan artefak dev dari `next build` agar stylesheet dev tidak
    // menghilang ketika build produksi dijalankan saat server masih aktif.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    experimental: { optimizePackageImports: ["lucide-react"] },
    eslint: { ignoreDuringBuilds: true },
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Frame-Options", value: "DENY" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
            { key: "Origin-Agent-Cluster", value: "?1" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          ],
        },
      ];
    },
  };
}
