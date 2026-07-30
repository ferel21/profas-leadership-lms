-- Add server-owned assessment timing and the indexes missing from the
-- previously unmanaged production schema.
ALTER TABLE "AssessmentAttempt"
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "AssessmentAttempt_userId_assessmentId_status_idx"
  ON "AssessmentAttempt"("userId", "assessmentId", "status");
CREATE INDEX "CourseNode_courseId_type_idx"
  ON "CourseNode"("courseId", "type");
CREATE INDEX "CourseNode_parentId_idx"
  ON "CourseNode"("parentId");
CREATE INDEX "Enrollment_userId_status_idx"
  ON "Enrollment"("userId", "status");

DROP TYPE "ContentType";
