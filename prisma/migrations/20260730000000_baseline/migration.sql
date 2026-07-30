-- Baseline captured from the existing production PostgreSQL schema.
-- Existing databases must mark this migration as applied before deploying
-- later migrations. A clean database can replay it from scratch.

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "public"."AssessmentType" AS ENUM ('PRETEST', 'MODULE', 'FINAL');
CREATE TYPE "public"."AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'PENDING_GRADE', 'GRADED');
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'EXCUSED', 'ABSENT');
CREATE TYPE "public"."ContentType" AS ENUM ('VIDEO', 'TEXT', 'DOCUMENT', 'PDF', 'IMAGE', 'LINK', 'FILE');
CREATE TYPE "public"."CourseLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');
CREATE TYPE "public"."EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED');
CREATE TYPE "public"."NodeType" AS ENUM ('FOLDER', 'VIDEO', 'PDF', 'DOCUMENT', 'IMAGE', 'LINK', 'QUIZ', 'ASSIGNMENT', 'TEXT');
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');
CREATE TYPE "public"."Persona" AS ENUM ('STUDENT_ENTREPRENEUR', 'ACADEMIC', 'ORGANIZATION', 'COOPERATIVE');
CREATE TYPE "public"."QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'FILE_UPLOAD');
CREATE TYPE "public"."Role" AS ENUM ('STUDENT', 'MENTOR', 'SUPER_ADMIN');

CREATE TABLE "public"."ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Assessment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "public"."AssessmentType" NOT NULL,
    "isAssignment" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3),
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "timeLimitMin" INTEGER NOT NULL DEFAULT 15,
    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "status" "public"."AttemptStatus" NOT NULL DEFAULT 'SUBMITTED',
    "score" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),
    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "type" "public"."QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "prompt" TEXT NOT NULL,
    "options" TEXT,
    "correctAnswer" TEXT,
    "points" INTEGER NOT NULL DEFAULT 10,
    "explanation" TEXT,
    "order" INTEGER NOT NULL,
    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT,
    "fileUrl" TEXT,
    "score" INTEGER,
    "feedback" TEXT,
    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."AttendanceRecord" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "checkedInAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'SELF',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "courseId" TEXT,
    "attendanceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "attendanceOpenAt" TIMESTAMP(3),
    "attendanceCloseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Certificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "uniqueNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" "public"."CourseLevel" NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "durationHours" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "studentsCount" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT NOT NULL,
    "certificateAvailable" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "outcomes" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."CourseNode" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."NodeType" NOT NULL,
    "order" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "assessmentId" TEXT,
    CONSTRAINT "CourseNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."DiscussionPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscussionPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "public"."EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."EventAttendee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GOING',
    CONSTRAINT "EventAttendee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."ForumCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ForumCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."ForumReply" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForumReply_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."ForumThread" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."NodeProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NodeProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'LOCAL',
    "role" "public"."Role" NOT NULL DEFAULT 'STUDENT',
    "persona" "public"."Persona",
    "avatar" TEXT,
    "headline" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "organization" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."UserSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferences" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."XPLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "XPLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityLog_userId_action_createdAt_idx" ON "public"."ActivityLog"("userId", "action", "createdAt");
CREATE INDEX "Assessment_courseId_type_idx" ON "public"."Assessment"("courseId", "type");
CREATE INDEX "AssessmentAttempt_assessmentId_submittedAt_idx" ON "public"."AssessmentAttempt"("assessmentId", "submittedAt");
CREATE INDEX "AssessmentAttempt_userId_passed_assessmentId_idx" ON "public"."AssessmentAttempt"("userId", "passed", "assessmentId");
CREATE INDEX "AssessmentQuestion_assessmentId_order_idx" ON "public"."AssessmentQuestion"("assessmentId", "order");
CREATE INDEX "AttemptAnswer_attemptId_idx" ON "public"."AttemptAnswer"("attemptId");
CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionId_key" ON "public"."AttemptAnswer"("attemptId", "questionId");
CREATE INDEX "AttendanceRecord_eventId_status_idx" ON "public"."AttendanceRecord"("eventId", "status");
CREATE UNIQUE INDEX "AttendanceRecord_eventId_userId_key" ON "public"."AttendanceRecord"("eventId", "userId");
CREATE INDEX "AttendanceRecord_userId_status_idx" ON "public"."AttendanceRecord"("userId", "status");
CREATE INDEX "Certificate_courseId_idx" ON "public"."Certificate"("courseId");
CREATE UNIQUE INDEX "Certificate_uniqueNumber_key" ON "public"."Certificate"("uniqueNumber");
CREATE UNIQUE INDEX "Certificate_userId_courseId_key" ON "public"."Certificate"("userId", "courseId");
CREATE INDEX "Course_mentorId_idx" ON "public"."Course"("mentorId");
CREATE INDEX "Course_published_featured_idx" ON "public"."Course"("published", "featured");
CREATE UNIQUE INDEX "Course_slug_key" ON "public"."Course"("slug");
CREATE UNIQUE INDEX "CourseNode_courseId_parentId_order_key" ON "public"."CourseNode"("courseId", "parentId", "order");
CREATE INDEX "DiscussionPost_nodeId_createdAt_idx" ON "public"."DiscussionPost"("nodeId", "createdAt");
CREATE INDEX "Enrollment_courseId_status_idx" ON "public"."Enrollment"("courseId", "status");
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "public"."Enrollment"("userId", "courseId");
CREATE UNIQUE INDEX "EventAttendee_eventId_userId_key" ON "public"."EventAttendee"("eventId", "userId");
CREATE INDEX "ForumReply_threadId_createdAt_idx" ON "public"."ForumReply"("threadId", "createdAt");
CREATE INDEX "ForumThread_categoryId_pinned_createdAt_idx" ON "public"."ForumThread"("categoryId", "pinned", "createdAt");
CREATE INDEX "NodeProgress_nodeId_idx" ON "public"."NodeProgress"("nodeId");
CREATE UNIQUE INDEX "NodeProgress_userId_nodeId_key" ON "public"."NodeProgress"("userId", "nodeId");
CREATE INDEX "Notification_userId_createdAt_idx" ON "public"."Notification"("userId", "createdAt");
CREATE INDEX "Notification_userId_read_idx" ON "public"."Notification"("userId", "read");
CREATE INDEX "Payment_courseId_status_idx" ON "public"."Payment"("courseId", "status");
CREATE INDEX "Payment_userId_createdAt_idx" ON "public"."Payment"("userId", "createdAt");
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
CREATE INDEX "User_role_persona_idx" ON "public"."User"("role", "persona");
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "public"."UserBadge"("userId", "badgeId");
CREATE UNIQUE INDEX "UserSetting_userId_key" ON "public"."UserSetting"("userId");
CREATE UNIQUE INDEX "XPLog_userId_source_sourceId_key" ON "public"."XPLog"("userId", "source", "sourceId");

ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Assessment" ADD CONSTRAINT "Assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "public"."Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "public"."Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CalendarEvent" ADD CONSTRAINT "CalendarEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Certificate" ADD CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Course" ADD CONSTRAINT "Course_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."CourseNode" ADD CONSTRAINT "CourseNode_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "public"."Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."CourseNode" ADD CONSTRAINT "CourseNode_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CourseNode" ADD CONSTRAINT "CourseNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."CourseNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."DiscussionPost" ADD CONSTRAINT "DiscussionPost_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "public"."CourseNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."DiscussionPost" ADD CONSTRAINT "DiscussionPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."EventAttendee" ADD CONSTRAINT "EventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."EventAttendee" ADD CONSTRAINT "EventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ForumReply" ADD CONSTRAINT "ForumReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ForumReply" ADD CONSTRAINT "ForumReply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ForumThread" ADD CONSTRAINT "ForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ForumThread" ADD CONSTRAINT "ForumThread_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ForumCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."NodeProgress" ADD CONSTRAINT "NodeProgress_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "public"."CourseNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."NodeProgress" ADD CONSTRAINT "NodeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."UserSetting" ADD CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."XPLog" ADD CONSTRAINT "XPLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
