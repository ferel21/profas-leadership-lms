import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// MASTER SKILL: Cache PrismaClient secara global di Serverless (bahkan di produksi) untuk memusnahkan kebocoran memori!
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
