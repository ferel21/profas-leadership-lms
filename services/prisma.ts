import { PrismaClient } from "@prisma/client";
import { unstable_cache } from "next/cache";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// MASTER SKILL: Cache PrismaClient secara global di Serverless (bahkan di produksi) untuk memusnahkan kebocoran memori!
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

/**
 * Utilitas caching query database berbasis Next.js Data Cache (unstable_cache).
 * Mengurangi roundtrip ke Supabase Cloud DB untuk query berat yang jarang berubah secara real-time.
 */
export function cachedQuery<T, P extends unknown[]>(
  fn: (...args: P) => Promise<T>,
  keyParts: string[],
  revalidateSeconds: number = 30
) {
  return unstable_cache(fn, keyParts, {
    revalidate: revalidateSeconds,
    tags: keyParts,
  });
}
