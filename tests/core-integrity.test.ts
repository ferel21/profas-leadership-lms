import assert from "node:assert/strict";
import test from "node:test";
import { AssessmentType } from "@prisma/client";
import { strFromU8, unzipSync } from "fflate";
import { resolveCanonicalAssessmentAchievement } from "@/services/assessment-achievement";
import { getCourseCompletionState } from "@/services/completion";
import { createExcelWorkbook } from "@/services/export/xlsxExport";
import { validateFileMagicBytes } from "@/services/file-security";

test("course completion requires every lesson rather than a rounded percentage", () => {
  assert.deepEqual(getCourseCompletionState(300, 299, 1, 1), {
    progressPercent: 99,
    eligible: false,
  });
  assert.deepEqual(getCourseCompletionState(0, 0, 0, 0), {
    progressPercent: 0,
    eligible: false,
  });
  assert.deepEqual(getCourseCompletionState(12, 12, 2, 2), {
    progressPercent: 100,
    eligible: true,
  });
});

test("assessment achievement is canonical across repeated passing attempts", () => {
  assert.equal(
    resolveCanonicalAssessmentAchievement(AssessmentType.PRETEST, [100]),
    null,
  );
  assert.deepEqual(
    resolveCanonicalAssessmentAchievement(AssessmentType.MODULE, [75, 92, 80]),
    { source: "MODULE_PASSED", points: 30, bestScore: 92 },
  );
  assert.deepEqual(
    resolveCanonicalAssessmentAchievement(AssessmentType.FINAL, [70]),
    { source: "FINAL_PASSED", points: 50, bestScore: 70 },
  );
});

test("file validation rejects spoofed content and accepts known signatures", () => {
  assert.equal(validateFileMagicBytes(Buffer.from("%PDF-1.7"), "application/pdf"), true);
  assert.equal(validateFileMagicBytes(Buffer.from("not a PDF"), "application/pdf"), false);
  assert.equal(
    validateFileMagicBytes(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "image/png",
    ),
    true,
  );
});

test("spreadsheet export creates a valid XLSX package and neutralizes formulas", () => {
  const archive = createExcelWorkbook([{
    name: "Security",
    headers: ["Value"],
    rows: [["=HYPERLINK(\"https://invalid\")"]],
  }]);
  const files = unzipSync(archive);
  assert.ok(files["[Content_Types].xml"]);
  assert.ok(files["xl/workbook.xml"]);
  assert.ok(files["xl/worksheets/sheet1.xml"]);
  const worksheet = strFromU8(files["xl/worksheets/sheet1.xml"]);
  assert.match(worksheet, /&apos;=HYPERLINK/);
});
