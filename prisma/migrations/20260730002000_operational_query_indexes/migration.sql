-- Index the operational access paths used by calendars, attendance,
-- achievements, and platform activity reports.
CREATE INDEX "CalendarEvent_courseId_startTime_idx"
  ON "CalendarEvent"("courseId", "startTime");
CREATE INDEX "CalendarEvent_startTime_idx"
  ON "CalendarEvent"("startTime");
CREATE INDEX "EventAttendee_userId_idx"
  ON "EventAttendee"("userId");
CREATE INDEX "UserBadge_badgeId_idx"
  ON "UserBadge"("badgeId");
CREATE INDEX "ActivityLog_action_createdAt_idx"
  ON "ActivityLog"("action", "createdAt");
