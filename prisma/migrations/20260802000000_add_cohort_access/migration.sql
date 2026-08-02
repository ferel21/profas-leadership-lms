-- Add cohort-based enrollment without coupling LMS access to a payment gateway.
CREATE TYPE "EnrollmentMode" AS ENUM ('OPEN', 'CODE');
CREATE TYPE "EnrollmentSource" AS ENUM ('DIRECT', 'COHORT', 'ADMIN');
CREATE TYPE "CohortStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

ALTER TABLE "Course"
  ADD COLUMN "enrollmentMode" "EnrollmentMode" NOT NULL DEFAULT 'OPEN';

-- Existing free programs keep direct enrollment. Programs with a configured
-- price require an access code until a verified payment workflow exists.
UPDATE "Course"
SET "enrollmentMode" = 'CODE'
WHERE "price" > 0;

CREATE TABLE "Cohort" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "organization" TEXT,
  "capacity" INTEGER NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "status" "CohortStatus" NOT NULL DEFAULT 'DRAFT',
  "joinCodeHash" TEXT,
  "joinCodeHint" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Cohort_capacity_check" CHECK ("capacity" > 0),
  CONSTRAINT "Cohort_period_check" CHECK ("endsAt" > "startsAt")
);

ALTER TABLE "Enrollment"
  ADD COLUMN "cohortId" TEXT,
  ADD COLUMN "source" "EnrollmentSource" NOT NULL DEFAULT 'DIRECT',
  ADD COLUMN "accessStartsAt" TIMESTAMP(3),
  ADD COLUMN "accessExpiresAt" TIMESTAMP(3),
  ADD COLUMN "accessRevokedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Cohort_joinCodeHash_key" ON "Cohort"("joinCodeHash");
CREATE INDEX "Cohort_courseId_status_idx" ON "Cohort"("courseId", "status");
CREATE INDEX "Cohort_createdById_createdAt_idx" ON "Cohort"("createdById", "createdAt");
CREATE INDEX "Cohort_status_startsAt_endsAt_idx" ON "Cohort"("status", "startsAt", "endsAt");
CREATE INDEX "Enrollment_cohortId_accessRevokedAt_idx" ON "Enrollment"("cohortId", "accessRevokedAt");
CREATE INDEX "Enrollment_userId_accessRevokedAt_accessExpiresAt_idx"
  ON "Enrollment"("userId", "accessRevokedAt", "accessExpiresAt");

ALTER TABLE "Cohort"
  ADD CONSTRAINT "Cohort_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Cohort"
  ADD CONSTRAINT "Cohort_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Enrollment"
  ADD CONSTRAINT "Enrollment_cohortId_fkey"
  FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;
