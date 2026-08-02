import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/services/auth";
import { CohortMembershipError, joinCohortByCode } from "@/services/cohort-membership";
import { rateLimit } from "@/services/rate-limit";

const joinLimiter = rateLimit({ limit: 8, windowMs: 5 * 60 * 1000 });
const joinSchema = z.object({ code: z.string().trim().min(6).max(40) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk untuk memakai kode akses." }, { status: 401 });

  const limit = joinLimiter.check(request, user.id);
  if (!limit.success) {
    return NextResponse.json(
      { message: "Terlalu banyak percobaan kode. Silakan coba kembali dalam 5 menit." },
      { status: 429 },
    );
  }

  const parsed = joinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Format kode akses tidak valid." }, { status: 400 });

  try {
    const result = await joinCohortByCode(user, parsed.data.code);
    return NextResponse.json(result, { status: result.joined ? 201 : 200 });
  } catch (error) {
    if (error instanceof CohortMembershipError) {
      return NextResponse.json({ message: error.message, code: error.code }, { status: error.status });
    }
    console.error("[COHORT_JOIN_ERROR]", error);
    return NextResponse.json({ message: "Kode akses belum dapat diproses." }, { status: 500 });
  }
}
