import { AssessmentType, Prisma } from "@prisma/client";

export type CanonicalAssessmentAchievement = {
  source: string;
  points: number;
  bestScore: number;
};

/**
 * Resolve the single XP achievement owned by one assessment. Passing attempts
 * are intentionally considered together: a later failed/regraded attempt must
 * not erase an earlier valid pass.
 */
export function resolveCanonicalAssessmentAchievement(
  assessmentType: AssessmentType,
  passingScores: readonly number[],
): CanonicalAssessmentAchievement | null {
  if (assessmentType === AssessmentType.PRETEST || passingScores.length === 0) {
    return null;
  }

  const bestScore = Math.max(
    0,
    ...passingScores.map(score => Math.min(100, Math.max(0, Math.round(score)))),
  );

  return {
    source: `${assessmentType}_PASSED`,
    points: assessmentType === AssessmentType.FINAL
      ? 50
      : 20 + (bestScore >= 90 ? 10 : 0),
    bestScore,
  };
}

type SyncAssessmentAchievementInput = {
  userId: string;
  assessmentId: string;
  courseId: string;
  assessmentType: AssessmentType;
  completedAt?: Date;
};

/**
 * Synchronize XP and every node linked to an assessment from the complete set
 * of graded attempts. This must run in the same transaction that saves a
 * grade, otherwise concurrent/repeated grading can leave stale progress.
 */
export async function syncAssessmentAchievement(
  tx: Prisma.TransactionClient,
  input: SyncAssessmentAchievementInput,
) {
  const passingAttempts = await tx.assessmentAttempt.findMany({
    where: {
      userId: input.userId,
      assessmentId: input.assessmentId,
      status: "GRADED",
      passed: true,
    },
    select: { score: true },
  });
  const passingScores = passingAttempts.map(attempt => attempt.score);
  const achievement = resolveCanonicalAssessmentAchievement(
    input.assessmentType,
    passingScores,
  );
  const hasPassingAttempt = passingScores.length > 0;

  const linkedNodes = await tx.courseNode.findMany({
    where: {
      courseId: input.courseId,
      assessmentId: input.assessmentId,
    },
    select: { id: true },
  });
  const nodeIds = linkedNodes.map(node => node.id);

  // Remove legacy or non-canonical sources first. This also keeps a changed
  // assessment type from retaining both MODULE_PASSED and FINAL_PASSED rows.
  const retainedSource = achievement?.source;
  await tx.xPLog.deleteMany({
    where: {
      userId: input.userId,
      sourceId: input.assessmentId,
      source: {
        in: ["ASSESSMENT", "MODULE_PASSED", "FINAL_PASSED", "PRETEST_PASSED"]
          .filter(source => source !== retainedSource),
      },
    },
  });

  if (achievement) {
    await tx.xPLog.upsert({
      where: {
        userId_source_sourceId: {
          userId: input.userId,
          source: achievement.source,
          sourceId: input.assessmentId,
        },
      },
      update: { points: achievement.points },
      create: {
        userId: input.userId,
        points: achievement.points,
        source: achievement.source,
        sourceId: input.assessmentId,
      },
    });
  }

  if (nodeIds.length > 0) {
    if (hasPassingAttempt) {
      await tx.nodeProgress.createMany({
        data: nodeIds.map(nodeId => ({
          userId: input.userId,
          nodeId,
          completedAt: input.completedAt ?? new Date(),
        })),
        skipDuplicates: true,
      });
    } else {
      await tx.nodeProgress.deleteMany({
        where: {
          userId: input.userId,
          nodeId: { in: nodeIds },
        },
      });
    }
  }

  return {
    hasPassingAttempt,
    achievement,
    linkedNodeIds: nodeIds,
  };
}
