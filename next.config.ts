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
  };
}
