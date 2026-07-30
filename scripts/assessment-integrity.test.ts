import assert from "node:assert/strict";
import test from "node:test";
import { AssessmentType } from "@prisma/client";
import { resolveCanonicalAssessmentAchievement } from "../services/assessment-achievement";

test("failed attempts do not create an assessment achievement", () => {
  assert.equal(
    resolveCanonicalAssessmentAchievement(AssessmentType.MODULE, []),
    null,
  );
});

test("the best passing module attempt owns one canonical XP source", () => {
  assert.deepEqual(
    resolveCanonicalAssessmentAchievement(AssessmentType.MODULE, [72, 95, 68]),
    {
      source: "MODULE_PASSED",
      points: 30,
      bestScore: 95,
    },
  );
});

test("final assessments use their canonical fixed XP award", () => {
  assert.deepEqual(
    resolveCanonicalAssessmentAchievement(AssessmentType.FINAL, [70, 100]),
    {
      source: "FINAL_PASSED",
      points: 50,
      bestScore: 100,
    },
  );
});

test("pretests never award assessment XP", () => {
  assert.equal(
    resolveCanonicalAssessmentAchievement(AssessmentType.PRETEST, [100]),
    null,
  );
});
