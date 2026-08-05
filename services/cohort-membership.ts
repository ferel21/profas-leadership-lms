import type { Role } from "@prisma/client";
import { hashCohortCode } from "@/services/cohort-code";
import { classifyExistingMembership, getCohortAvailabilityIssue } from "@/services/cohort-policy";
import { withSerializableRetry } from "@/services/serializable-transaction";

type CohortActor = {
  id: string;
  role: Role;
};

export class CohortMembershipError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "CohortMembershipError";
  }
}

function assertManager(actor: CohortActor) {
  if (actor.role !== "MENTOR" && actor.role !== "SUPER_ADMIN") {
    throw new CohortMembershipError(403, "Akses pengelolaan kohort ditolak.", "FORBIDDEN");
  }
}

function assertAvailability(
  cohort: { status: "DRAFT" | "ACTIVE" | "CLOSED"; endsAt: Date; capacity: number },
  now: Date,
  occupiedSeats?: number,
) {
  const issue = getCohortAvailabilityIssue(cohort, now, occupiedSeats);
  if (issue) throw new CohortMembershipError(issue.status, issue.message, issue.code);
}

export async function joinCohortByCode(actor: CohortActor, rawCode: string) {
  if (actor.role !== "STUDENT") {
    throw new CohortMembershipError(403, "Kode akses hanya dapat digunakan oleh akun peserta.", "STUDENT_ONLY");
  }

  const codeHash = hashCohortCode(rawCode);
  const now = new Date();

  return withSerializableRetry(async (tx) => {
    const cohort = await tx.cohort.findUnique({
      where: { joinCodeHash: codeHash },
      select: {
        id: true,
        name: true,
        capacity: true,
        startsAt: true,
        endsAt: true,
        status: true,
        course: {
          select: { id: true, slug: true, title: true, published: true },
        },
      },
    });

    if (!cohort) {
      throw new CohortMembershipError(404, "Kode akses tidak valid.", "INVALID_CODE");
    }
    assertAvailability(cohort, now);
    if (!cohort.course.published) {
      throw new CohortMembershipError(409, "Program untuk kohort ini belum diterbitkan.", "COURSE_UNPUBLISHED");
    }

    const existing = await tx.enrollment.findUnique({
      where: { userId_courseId: { userId: actor.id, courseId: cohort.course.id } },
      select: { id: true, cohortId: true, accessRevokedAt: true },
    });

    const membershipState = classifyExistingMembership(existing, cohort.id);
    if (membershipState === "SAME_REVOKED") {
      throw new CohortMembershipError(
        403,
        "Akses Anda pada kohort ini telah dicabut. Hubungi pengelola program.",
        "ACCESS_REVOKED",
      );
    }
    if (membershipState === "SAME_ACTIVE" && existing) {
      return {
        enrollmentId: existing.id,
        joined: false,
        startsAt: cohort.startsAt,
        endsAt: cohort.endsAt,
        course: cohort.course,
        cohort: { id: cohort.id, name: cohort.name },
      };
    }
    if (membershipState === "OTHER_ACTIVE") {
      throw new CohortMembershipError(
        409,
        "Anda sudah terdaftar pada kohort lain untuk program ini.",
        "OTHER_COHORT_ACTIVE",
      );
    }

    const occupiedSeats = await tx.enrollment.count({
      where: { cohortId: cohort.id, accessRevokedAt: null },
    });
    assertAvailability(cohort, now, occupiedSeats);

    const enrollment = existing
      ? await tx.enrollment.update({
          where: { id: existing.id },
          data: {
            cohortId: cohort.id,
            source: "COHORT",
            accessStartsAt: now,
            accessExpiresAt: cohort.endsAt,
            accessRevokedAt: null,
          },
          select: { id: true },
        })
      : await tx.enrollment.create({
          data: {
            userId: actor.id,
            courseId: cohort.course.id,
            cohortId: cohort.id,
            source: "COHORT",
            accessStartsAt: now,
            accessExpiresAt: cohort.endsAt,
          },
          select: { id: true },
        });

    if (!existing) {
      await tx.course.update({
        where: { id: cohort.course.id },
        data: { studentsCount: { increment: 1 } },
      });
    }
    await tx.activityLog.create({
      data: {
        userId: actor.id,
        action: "COHORT_JOIN",
        metadata: JSON.stringify({ cohortId: cohort.id, courseId: cohort.course.id }),
      },
    });

    return {
      enrollmentId: enrollment.id,
      joined: true,
      startsAt: now,
      endsAt: cohort.endsAt,
      course: cohort.course,
      cohort: { id: cohort.id, name: cohort.name },
    };
  });
}

export async function addCohortMember(
  actor: CohortActor,
  cohortId: string,
  email: string,
  transfer: boolean,
) {
  assertManager(actor);
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();

  return withSerializableRetry(async (tx) => {
    const cohort = await tx.cohort.findFirst({
      where: {
        id: cohortId,
        ...(actor.role === "MENTOR" ? { course: { mentorId: actor.id } } : {}),
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        startsAt: true,
        endsAt: true,
        status: true,
        course: { select: { id: true, slug: true, title: true } },
      },
    });
    if (!cohort) {
      throw new CohortMembershipError(404, "Kohort tidak ditemukan.", "COHORT_NOT_FOUND");
    }
    if (cohort.status === "CLOSED") {
      throw new CohortMembershipError(409, "Kohort yang sudah ditutup tidak menerima anggota baru.", "COHORT_CLOSED");
    }

    const student = await tx.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" }, role: "STUDENT" },
      select: { id: true, name: true, email: true },
    });
    if (!student) {
      throw new CohortMembershipError(
        404,
        "Akun peserta dengan email tersebut belum tersedia.",
        "STUDENT_NOT_FOUND",
      );
    }

    const existing = await tx.enrollment.findUnique({
      where: { userId_courseId: { userId: student.id, courseId: cohort.course.id } },
      select: { id: true, cohortId: true, accessRevokedAt: true },
    });
    if (existing?.cohortId === cohort.id && !existing.accessRevokedAt) {
      return { member: student, enrollmentId: existing.id, changed: false, transferred: false };
    }
    if (existing?.cohortId && existing.cohortId !== cohort.id && !transfer) {
      throw new CohortMembershipError(
        409,
        "Peserta sudah berada di kohort lain. Aktifkan opsi pindahkan untuk melanjutkan.",
        "TRANSFER_REQUIRED",
      );
    }

    const occupiedSeats = await tx.enrollment.count({
      where: { cohortId: cohort.id, accessRevokedAt: null },
    });
    if (occupiedSeats >= cohort.capacity) {
      throw new CohortMembershipError(409, "Kapasitas kohort sudah penuh.", "COHORT_FULL");
    }

    const transferred = Boolean(existing?.cohortId && existing.cohortId !== cohort.id);
    const enrollment = existing
      ? await tx.enrollment.update({
          where: { id: existing.id },
          data: {
            cohortId: cohort.id,
            source: "ADMIN",
            accessStartsAt: now,
            accessExpiresAt: cohort.endsAt,
            accessRevokedAt: null,
          },
          select: { id: true },
        })
      : await tx.enrollment.create({
          data: {
            userId: student.id,
            courseId: cohort.course.id,
            cohortId: cohort.id,
            source: "ADMIN",
            accessStartsAt: now,
            accessExpiresAt: cohort.endsAt,
          },
          select: { id: true },
        });

    if (!existing) {
      await tx.course.update({
        where: { id: cohort.course.id },
        data: { studentsCount: { increment: 1 } },
      });
    }
    await tx.notification.create({
      data: {
        userId: student.id,
        title: "Akses program diberikan",
        message: `Anda ditambahkan ke ${cohort.name} untuk program ${cohort.course.title}.`,
        type: "COHORT_ACCESS",
        link: "/dashboard",
      },
    });
    await tx.activityLog.create({
      data: {
        userId: actor.id,
        action: transferred ? "COHORT_MEMBER_TRANSFER" : "COHORT_MEMBER_ADD",
        metadata: JSON.stringify({
          cohortId: cohort.id,
          courseId: cohort.course.id,
          targetUserId: student.id,
        }),
      },
    });

    return { member: student, enrollmentId: enrollment.id, changed: true, transferred };
  });
}

export async function revokeCohortMember(actor: CohortActor, cohortId: string, targetUserId: string) {
  assertManager(actor);

  return withSerializableRetry(async (tx) => {
    const cohort = await tx.cohort.findFirst({
      where: {
        id: cohortId,
        ...(actor.role === "MENTOR" ? { course: { mentorId: actor.id } } : {}),
      },
      select: { id: true, name: true, course: { select: { id: true, title: true } } },
    });
    if (!cohort) {
      throw new CohortMembershipError(404, "Kohort tidak ditemukan.", "COHORT_NOT_FOUND");
    }

    const enrollment = await tx.enrollment.findFirst({
      where: { cohortId, userId: targetUserId },
      select: { id: true, accessRevokedAt: true },
    });
    if (!enrollment) {
      throw new CohortMembershipError(404, "Anggota kohort tidak ditemukan.", "MEMBER_NOT_FOUND");
    }
    if (enrollment.accessRevokedAt) {
      return { enrollmentId: enrollment.id, changed: false };
    }

    await tx.enrollment.update({
      where: { id: enrollment.id },
      data: { accessRevokedAt: new Date() },
    });
    await tx.notification.create({
      data: {
        userId: targetUserId,
        title: "Akses program dinonaktifkan",
        message: `Akses Anda ke ${cohort.course.title} melalui ${cohort.name} telah dinonaktifkan.`,
        type: "COHORT_ACCESS_REVOKED",
        link: "/dashboard",
      },
    });
    await tx.activityLog.create({
      data: {
        userId: actor.id,
        action: "COHORT_MEMBER_REVOKE",
        metadata: JSON.stringify({
          cohortId: cohort.id,
          courseId: cohort.course.id,
          targetUserId,
        }),
      },
    });

    return { enrollmentId: enrollment.id, changed: true };
  });
}
