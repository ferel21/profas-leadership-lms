import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const vitalsLimiter = rateLimit({ limit: 120, windowMs: 60 * 1000 });

export async function POST(request: Request) {
  const ipCheck = vitalsLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const text = await request.text();
    if (!text || text.length > 2048) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const metric = JSON.parse(text);
    if (!metric || typeof metric.name !== "string" || typeof metric.value !== "number") {
      return NextResponse.json({ error: "Malformed metric" }, { status: 400 });
    }

    // Structured log for monitoring/observability pipelines without touching database
    console.log(
      JSON.stringify({
        type: "WEB_VITALS",
        metric: metric.name,
        value: Math.round(metric.value * 100) / 100,
        rating: metric.rating || "unknown",
        id: metric.id || "",
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Processing error" }, { status: 400 });
  }
}
