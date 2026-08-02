import type { Enrollment, Prisma } from "@prisma/client";
import { prisma } from "@/services/prisma";

export type EnrollmentAccessState = "ACTIVE" | "NOT_STARTED" | "EXPIRED" | "REVOKED" | "MISSING";

type AccessFields = Pick<Enrollment, "accessStartsAt" | "accessExpiresAt" | "accessRevokedAt">;

export function activeEnrollmentWindowWhere(now: Date = new Date()): Prisma.EnrollmentWhereInput {
  return {
    accessRevokedAt: null,
    AND: [
      { OR: [{ accessStartsAt: null }, { accessStartsAt: { lte: now } }] },
      { OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: now } }] },
    ],
  };
}

export function accessibleEnrollmentWhere(
  userId: string,
  courseId?: string,
  now: Date = new Date(),
): Prisma.EnrollmentWhereInput {
  return {
    ...activeEnrollmentWindowWhere(now),
    userId,
    ...(courseId ? { courseId } : {}),
  };
}

export function resolveEnrollmentAccessState(
  enrollment: AccessFields | null,
  now: Date = new Date(),
): EnrollmentAccessState {
  if (!enrollment) return "MISSING";
  if (enrollment.accessRevokedAt) return "REVOKED";
  if (enrollment.accessStartsAt && enrollment.accessStartsAt > now) return "NOT_STARTED";
  if (enrollment.accessExpiresAt && enrollment.accessExpiresAt <= now) return "EXPIRED";
  return "ACTIVE";
}

export async function getEnrollmentAccessState(
  userId: string,
  courseId: string,
  now: Date = new Date(),
): Promise<EnrollmentAccessState> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { accessStartsAt: true, accessExpiresAt: true, accessRevokedAt: true },
  });
  return resolveEnrollmentAccessState(enrollment, now);
}

export async function hasActiveCourseAccess(
  userId: string,
  courseId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const enrollment = await prisma.enrollment.findFirst({
    where: accessibleEnrollmentWhere(userId, courseId, now),
    select: { id: true },
  });
  return Boolean(enrollment);
}
