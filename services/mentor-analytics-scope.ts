import type { Prisma } from "@prisma/client";

type IdRow = { id: string };
type EnrollmentUserRow = { userId: string };

export type MentorAnalyticsCourseRow = {
  id: string;
  nodes?: readonly IdRow[];
  assessments?: readonly IdRow[];
  calendarEvents?: readonly IdRow[];
  enrollments?: readonly EnrollmentUserRow[];
};

export type MentorAnalyticsScope = {
  courseIds: string[];
  nodeIds: string[];
  assessmentIds: string[];
  eventIds: string[];
  participantIds: string[];
};

const ACTIVITY_METADATA_KEYS = {
  courseIds: ["courseId"],
  nodeIds: ["nodeId", "lessonId", "materialId"],
  assessmentIds: ["assessmentId"],
  eventIds: ["eventId"],
} as const;

function unique(values: readonly string[]) {
  return Array.from(new Set(values));
}

export function buildMentorAnalyticsScope(
  courses: readonly MentorAnalyticsCourseRow[],
): MentorAnalyticsScope {
  return {
    courseIds: unique(courses.map(course => course.id)),
    nodeIds: unique(courses.flatMap(course => course.nodes?.map(node => node.id) ?? [])),
    assessmentIds: unique(courses.flatMap(course => (
      course.assessments?.map(assessment => assessment.id) ?? []
    ))),
    eventIds: unique(courses.flatMap(course => (
      course.calendarEvents?.map(event => event.id) ?? []
    ))),
    participantIds: unique(courses.flatMap(course => (
      course.enrollments?.map(enrollment => enrollment.userId) ?? []
    ))),
  };
}

export function mentorXpSourceIds(scope: MentorAnalyticsScope) {
  return unique([...scope.nodeIds, ...scope.assessmentIds]);
}

function jsonPropertyNeedle(key: string, value: string) {
  return JSON.stringify({ [key]: value }).slice(1, -1);
}

/**
 * Build the narrowest ActivityLog query supported by the current schema.
 * ActivityLog metadata is stored as text, so every result must additionally be
 * verified with activityMetadataBelongsToMentorScope before it is displayed or
 * aggregated.
 */
export function buildMentorActivityWhere(
  scope: MentorAnalyticsScope,
  participantIds: readonly string[] = scope.participantIds,
): Prisma.ActivityLogWhereInput {
  const ownedParticipants = new Set(scope.participantIds);
  const scopedParticipants = unique(participantIds).filter(participantId => (
    ownedParticipants.has(participantId)
  ));
  const metadataFilters: Prisma.ActivityLogWhereInput[] = [];

  for (const [scopeKey, metadataKeys] of Object.entries(ACTIVITY_METADATA_KEYS) as Array<
    [keyof typeof ACTIVITY_METADATA_KEYS, readonly string[]]
  >) {
    for (const id of scope[scopeKey]) {
      for (const metadataKey of metadataKeys) {
        metadataFilters.push({
          metadata: { contains: jsonPropertyNeedle(metadataKey, id) },
        });
      }
    }
  }

  if (scopedParticipants.length === 0 || metadataFilters.length === 0) {
    return { id: { in: [] } };
  }

  return {
    userId: { in: scopedParticipants },
    OR: metadataFilters,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Exact post-query authorization check. This prevents a textual substring
 * match from attributing another course's event to the current mentor.
 */
export function activityMetadataBelongsToMentorScope(
  metadata: string | null,
  scope: MentorAnalyticsScope,
) {
  if (!metadata) return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(metadata);
  } catch {
    return false;
  }
  if (!isRecord(parsed)) return false;

  for (const [scopeKey, metadataKeys] of Object.entries(ACTIVITY_METADATA_KEYS) as Array<
    [keyof typeof ACTIVITY_METADATA_KEYS, readonly string[]]
  >) {
    const ownedIds = new Set(scope[scopeKey]);
    for (const metadataKey of metadataKeys) {
      const value = parsed[metadataKey];
      if (typeof value === "string" && ownedIds.has(value)) return true;
    }
  }

  return false;
}
