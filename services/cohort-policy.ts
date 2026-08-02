import type { CohortStatus } from "@prisma/client";

type CohortAvailability = {
  status: CohortStatus;
  endsAt: Date;
  capacity: number;
};

export type CohortAvailabilityIssue = {
  status: number;
  code: "COHORT_DRAFT" | "COHORT_CLOSED" | "COHORT_EXPIRED" | "COHORT_FULL";
  message: string;
};

export function getCohortAvailabilityIssue(
  cohort: CohortAvailability,
  now: Date,
  occupiedSeats?: number,
): CohortAvailabilityIssue | null {
  if (cohort.status === "DRAFT") {
    return { status: 409, code: "COHORT_DRAFT", message: "Kohort belum diaktifkan." };
  }
  if (cohort.status === "CLOSED") {
    return { status: 409, code: "COHORT_CLOSED", message: "Kohort sudah ditutup." };
  }
  if (cohort.endsAt <= now) {
    return { status: 410, code: "COHORT_EXPIRED", message: "Periode kode akses ini sudah berakhir." };
  }
  if (occupiedSeats !== undefined && occupiedSeats >= cohort.capacity) {
    return { status: 409, code: "COHORT_FULL", message: "Kapasitas kohort sudah penuh." };
  }
  return null;
}

type ExistingEnrollment = { cohortId: string | null; accessRevokedAt: Date | null } | null;

export type ExistingMembershipState =
  | "NONE"
  | "SAME_ACTIVE"
  | "SAME_REVOKED"
  | "OTHER_ACTIVE"
  | "OTHER_REVOKED"
  | "DIRECT_ACTIVE"
  | "DIRECT_REVOKED";

export function classifyExistingMembership(
  enrollment: ExistingEnrollment,
  targetCohortId: string,
): ExistingMembershipState {
  if (!enrollment) return "NONE";
  if (!enrollment.cohortId) return enrollment.accessRevokedAt ? "DIRECT_REVOKED" : "DIRECT_ACTIVE";
  if (enrollment.cohortId === targetCohortId) {
    return enrollment.accessRevokedAt ? "SAME_REVOKED" : "SAME_ACTIVE";
  }
  return enrollment.accessRevokedAt ? "OTHER_REVOKED" : "OTHER_ACTIVE";
}
