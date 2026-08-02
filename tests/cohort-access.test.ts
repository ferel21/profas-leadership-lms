import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { generateCohortCode, hashCohortCode, normalizeCohortCode } from "@/services/cohort-code";
import { classifyExistingMembership, getCohortAvailabilityIssue } from "@/services/cohort-policy";
import { resolveEnrollmentAccessState } from "@/services/enrollment-access";

test("access codes are high-entropy, normalized, and only comparable by hash", () => {
  const generated = generateCohortCode();
  assert.match(generated.code, /^[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){2}$/);
  assert.equal(normalizeCohortCode(generated.code).length, 12);
  assert.equal(hashCohortCode(generated.code.toLowerCase()), generated.hash);
  assert.notEqual(hashCohortCode("AAAA-BBBB-CCCC"), generated.hash);
  assert.match(generated.hint, /^[A-HJ-NP-Z2-9]{2}•{8}[A-HJ-NP-Z2-9]{2}$/);
});

test("cohort policy rejects draft, closed, expired, and full cohorts", () => {
  const now = new Date("2026-08-02T00:00:00.000Z");
  const future = new Date("2026-09-02T00:00:00.000Z");
  const past = new Date("2026-07-02T00:00:00.000Z");

  assert.equal(getCohortAvailabilityIssue({ status: "ACTIVE", endsAt: future, capacity: 30 }, now, 29), null);
  assert.equal(getCohortAvailabilityIssue({ status: "DRAFT", endsAt: future, capacity: 30 }, now)?.code, "COHORT_DRAFT");
  assert.equal(getCohortAvailabilityIssue({ status: "CLOSED", endsAt: future, capacity: 30 }, now)?.code, "COHORT_CLOSED");
  assert.equal(getCohortAvailabilityIssue({ status: "ACTIVE", endsAt: past, capacity: 30 }, now)?.code, "COHORT_EXPIRED");
  assert.equal(getCohortAvailabilityIssue({ status: "ACTIVE", endsAt: future, capacity: 30 }, now, 30)?.code, "COHORT_FULL");
});

test("duplicate and revoked memberships are classified without losing history", () => {
  const revokedAt = new Date("2026-08-01T00:00:00.000Z");
  assert.equal(classifyExistingMembership(null, "cohort-a"), "NONE");
  assert.equal(classifyExistingMembership({ cohortId: "cohort-a", accessRevokedAt: null }, "cohort-a"), "SAME_ACTIVE");
  assert.equal(classifyExistingMembership({ cohortId: "cohort-a", accessRevokedAt: revokedAt }, "cohort-a"), "SAME_REVOKED");
  assert.equal(classifyExistingMembership({ cohortId: "cohort-b", accessRevokedAt: null }, "cohort-a"), "OTHER_ACTIVE");
  assert.equal(classifyExistingMembership({ cohortId: "cohort-b", accessRevokedAt: revokedAt }, "cohort-a"), "OTHER_REVOKED");
});

test("enrollment access respects scheduled, expired, revoked, and legacy-open rows", () => {
  const now = new Date("2026-08-02T00:00:00.000Z");
  assert.equal(resolveEnrollmentAccessState({ accessStartsAt: null, accessExpiresAt: null, accessRevokedAt: null }, now), "ACTIVE");
  assert.equal(resolveEnrollmentAccessState({ accessStartsAt: new Date("2026-08-03T00:00:00.000Z"), accessExpiresAt: null, accessRevokedAt: null }, now), "NOT_STARTED");
  assert.equal(resolveEnrollmentAccessState({ accessStartsAt: null, accessExpiresAt: now, accessRevokedAt: null }, now), "EXPIRED");
  assert.equal(resolveEnrollmentAccessState({ accessStartsAt: null, accessExpiresAt: null, accessRevokedAt: now }, now), "REVOKED");
});

test("migration keeps free legacy programs open and gates configured-price programs", () => {
  const migration = readFileSync("prisma/migrations/20260802000000_add_cohort_access/migration.sql", "utf8");
  assert.match(migration, /"enrollmentMode"[^;]+DEFAULT 'OPEN'/);
  assert.match(migration, /SET "enrollmentMode" = 'CODE'[\s\S]+WHERE "price" > 0/);
  assert.match(migration, /ON DELETE SET NULL/);
});
