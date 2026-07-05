import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const tmpDbPath = path.join("/tmp", "dev.db");
  if (!fs.existsSync(tmpDbPath)) {
    try {
      const source1 = path.join(process.cwd(), "dev.db");
      const source2 = path.join(process.cwd(), "prisma", "dev.db");
      if (fs.existsSync(source1)) {
        fs.copyFileSync(source1, tmpDbPath);
      } else if (fs.existsSync(source2)) {
        fs.copyFileSync(source2, tmpDbPath);
      }
    } catch (e) {
      console.error("Failed to copy SQLite database to /tmp:", e);
    }
  }
  process.env.DATABASE_URL = `file:${tmpDbPath}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
