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

    const cleanName = metric.name.replace(/[^a-zA-Z0-9_\-\.]/g, "").slice(0, 50);
    const cleanRating = typeof metric.rating === "string" ? metric.rating.replace(/[^a-zA-Z]/g, "").slice(0, 20) : "unknown";
    const cleanId = typeof metric.id === "string" ? metric.id.replace(/[^a-zA-Z0-9_\-\.]/g, "").slice(0, 50) : "";

    // Structured log for monitoring/observability pipelines without touching database
    console.log(
      JSON.stringify({
        type: "WEB_VITALS",
        metric: cleanName,
        value: Math.round(metric.value * 100) / 100,
        rating: cleanRating,
        id: cleanId,
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Processing error" }, { status: 400 });
  }
}
