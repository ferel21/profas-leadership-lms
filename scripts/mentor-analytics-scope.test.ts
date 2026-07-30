import assert from "node:assert/strict";
import test from "node:test";
import {
  activityMetadataBelongsToMentorScope,
  buildMentorActivityWhere,
  buildMentorAnalyticsScope,
  mentorXpSourceIds,
} from "../services/mentor-analytics-scope";

const scope = buildMentorAnalyticsScope([
  {
    id: "course-owned",
    nodes: [{ id: "node-owned" }],
    assessments: [{ id: "assessment-owned" }],
    calendarEvents: [{ id: "event-owned" }],
    enrollments: [{ userId: "student-shared" }, { userId: "student-shared" }],
  },
]);

test("mentor scope deduplicates owned participants and XP sources", () => {
  assert.deepEqual(scope.participantIds, ["student-shared"]);
  assert.deepEqual(mentorXpSourceIds(scope), ["node-owned", "assessment-owned"]);
});

test("course, node, assessment, and attendance metadata are in scope", () => {
  for (const metadata of [
    JSON.stringify({ courseId: "course-owned" }),
    JSON.stringify({ nodeId: "node-owned" }),
    JSON.stringify({ assessmentId: "assessment-owned" }),
    JSON.stringify({ eventId: "event-owned" }),
  ]) {
    assert.equal(activityMetadataBelongsToMentorScope(metadata, scope), true);
  }
});

test("unrelated or unstructured learner activity is rejected", () => {
  for (const metadata of [
    JSON.stringify({ courseId: "course-other" }),
    JSON.stringify({ courseId: "course-owned-suffix" }),
    JSON.stringify({ method: "LOCAL" }),
    "{malformed",
    null,
  ]) {
    assert.equal(activityMetadataBelongsToMentorScope(metadata, scope), false);
  }
});

test("database scope always includes participant and owned metadata constraints", () => {
  const where = buildMentorActivityWhere(scope);
  assert.deepEqual(where.userId, { in: ["student-shared"] });
  assert.ok(Array.isArray(where.OR) && where.OR.length >= 4);

  assert.deepEqual(
    buildMentorActivityWhere(scope, ["student-shared", "student-outside"]),
    where,
  );
  assert.deepEqual(
    buildMentorActivityWhere(scope, []),
    { id: { in: [] } },
  );
});
