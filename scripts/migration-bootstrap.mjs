import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const BASELINE_MIGRATION = "20260730000000_baseline";
const prisma = new PrismaClient();

/**
 * The live PostgreSQL database predates Prisma Migrate. On the first managed
 * release only, record the checked-in baseline as already applied when the
 * existing PROFAS schema is present. A genuinely empty database skips this
 * step and replays the baseline normally.
 */
async function bootstrapExistingSchema() {
  const [catalog] = await prisma.$queryRaw`
    SELECT
      to_regclass('"public"."User"')::text AS "userTable",
      to_regclass('"public"."_prisma_migrations"')::text AS "migrationsTable"
  `;
  if (!catalog?.userTable) return;

  let baselineApplied = false;
  if (catalog.migrationsTable) {
    const rows = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM "_prisma_migrations"
        WHERE "migration_name" = ${BASELINE_MIGRATION}
          AND "finished_at" IS NOT NULL
          AND "rolled_back_at" IS NULL
      ) AS "applied"
    `;
    baselineApplied = Boolean(rows[0]?.applied);
  }
  if (baselineApplied) return;

  console.log(`[database] Recording existing schema baseline: ${BASELINE_MIGRATION}`);
  execFileSync(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "migrate",
      "resolve",
      "--applied",
      BASELINE_MIGRATION,
    ],
    { stdio: "inherit" },
  );
}

try {
  await bootstrapExistingSchema();
} finally {
  await prisma.$disconnect();
}
