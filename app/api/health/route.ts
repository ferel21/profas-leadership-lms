import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const healthLimiter = rateLimit({ limit: 120, windowMs: 60 * 1000 });

type HealthSnapshot = { status: "HEALTHY" | "UNHEALTHY"; latencyMs: number; checkedAt: number };

let cachedSnapshot: HealthSnapshot | null = null;
let pendingSnapshot: Promise<HealthSnapshot> | null = null;

async function checkDatabase(): Promise<HealthSnapshot> {
  const started = Date.now();
  try {
    // One lightweight query (SELECT 1) keeps readiness checks compatible with a
    // serverless/pooler connection_limit=1 deployment without locking user tables.
    await prisma.$queryRaw`SELECT 1`;
    return { status: "HEALTHY", latencyMs: Date.now() - started, checkedAt: Date.now() };
  } catch (error) {
    console.error("[HEALTH_CHECK_DB_ERROR]", error);
    return { status: "UNHEALTHY", latencyMs: Date.now() - started, checkedAt: Date.now() };
  }
}

async function getHealthSnapshot() {
  const ttlMs = Math.max(1000, Number(process.env.HEALTHCHECK_CACHE_MS || 5000));
  if (cachedSnapshot && Date.now() - cachedSnapshot.checkedAt < ttlMs) return cachedSnapshot;
  if (!pendingSnapshot) {
    pendingSnapshot = checkDatabase().then(snapshot => {
      cachedSnapshot = snapshot;
      return snapshot;
    }).finally(() => {
      pendingSnapshot = null;
    });
  }
  return pendingSnapshot;
}

export async function GET(request: Request) {
  const ipCheck = healthLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ status: "DEGRADED", error: "Too many health requests" }, { status: 429 });
  }

  const startTime = Date.now();
  const snapshot = await getHealthSnapshot();
  const dbStatus = snapshot.status;
  const dbLatencyMs = snapshot.latencyMs;
  let userCount = 0;
  let courseCount = 0;

  // Public readiness check returns minimal status only.
  const report: Record<string, unknown> = {
    status: dbStatus === "HEALTHY" ? "OK" : "DEGRADED",
    timestamp: new Date().toISOString(),
  };

  // Monitoring systems request operational detail with server-only token.
  const healthToken = process.env.HEALTHCHECK_TOKEN?.trim();
  const suppliedToken = request.headers.get("x-health-token");
  if (healthToken && suppliedToken === healthToken && dbStatus === "HEALTHY") {
    const memoryUsage = process.memoryUsage();
    [userCount, courseCount] = [
      await prisma.user.count(),
      await prisma.course.count(),
    ];
    report.database = {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      metrics: { totalUsers: userCount, totalCourses: courseCount },
    };
    report.performance = { checkDurationMs: Date.now() - startTime };
    report.system = {
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsageMB: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
    };
  }

  return NextResponse.json(report, {
    status: dbStatus === "HEALTHY" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
