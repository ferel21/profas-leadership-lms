import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/services/auth";
import {
  addCohortMember,
  CohortMembershipError,
  revokeCohortMember,
  restoreCohortMember,
} from "@/services/cohort-membership";
import { rateLimit } from "@/services/rate-limit";

const memberLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });
const addMemberSchema = z.object({
  email: z.string().trim().email().max(254),
  transfer: z.boolean().optional().default(false),
});
const revokeMemberSchema = z.object({ userId: z.string().min(1).max(100) });
type RouteContext = { params: Promise<{ id: string }> };

function membershipErrorResponse(error: unknown) {
  if (error instanceof CohortMembershipError) {
    return NextResponse.json({ message: error.message, code: error.code }, { status: error.status });
  }
  console.error("[COHORT_MEMBER_ERROR]", error);
  return NextResponse.json({ message: "Perubahan anggota kohort belum dapat diproses." }, { status: 500 });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const limit = memberLimiter.check(request, user.id);
  if (!limit.success) {
    return NextResponse.json({ message: "Terlalu banyak perubahan anggota. Silakan tunggu sebentar." }, { status: 429 });
  }

  const [{ id }, parsed] = await Promise.all([
    context.params,
    request.json().catch(() => null).then((body) => addMemberSchema.safeParse(body)),
  ]);
  if (!parsed.success) {
    return NextResponse.json({ message: "Masukkan email peserta yang valid." }, { status: 400 });
  }

  try {
    const result = await addCohortMember(user, id, parsed.data.email, parsed.data.transfer);
    return NextResponse.json(result, { status: result.changed ? 201 : 200 });
  } catch (error) {
    return membershipErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const limit = memberLimiter.check(request, user.id);
  if (!limit.success) {
    return NextResponse.json({ message: "Terlalu banyak perubahan anggota. Silakan tunggu sebentar." }, { status: 429 });
  }

  const { id } = await context.params;
  const urlUserId = new URL(request.url).searchParams.get("userId");
  const body = urlUserId ? { userId: urlUserId } : await request.json().catch(() => null);
  const parsed = revokeMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "ID peserta tidak valid." }, { status: 400 });
  }

  try {
    const result = await revokeCohortMember(user, id, parsed.data.userId);
    return NextResponse.json(result);
  } catch (error) {
    return membershipErrorResponse(error);
  }
}

const updateMemberSchema = z.object({
  userId: z.string().min(1).max(100),
  action: z.enum(["restore"]),
});

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const limit = memberLimiter.check(request, user.id);
  if (!limit.success) {
    return NextResponse.json({ message: "Terlalu banyak perubahan anggota. Silakan tunggu sebentar." }, { status: 429 });
  }

  const [{ id }, parsed] = await Promise.all([
    context.params,
    request.json().catch(() => null).then((body) => updateMemberSchema.safeParse(body)),
  ]);

  if (!parsed.success) {
    return NextResponse.json({ message: "Payload tidak valid." }, { status: 400 });
  }

  try {
    let result;
    if (parsed.data.action === "restore") {
      result = await restoreCohortMember(user, id, parsed.data.userId);
    } else {
      return NextResponse.json({ message: "Aksi tidak didukung." }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return membershipErrorResponse(error);
  }
}
