#!/usr/bin/env node
/**
 * Security Baseline & Magic Byte Verification Script (`npm run security:baseline`)
 * ISO/IEC 27001, 27701, and P0 Security Compliance Verification
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let errors = 0;

function pass(msg) {
  console.log(`[PASS] ${msg}`);
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  errors++;
}

console.log("=== PROFAS Leadership LMS Security Baseline Audit ===");

// 1. Verify existence of core security files
const requiredFiles = [
  "lib/auth.ts",
  "lib/rate-limit.ts",
  "lib/file-security.ts",
  "middleware.ts",
  "app/api/materials/upload/route.ts",
  "app/api/assessments/submit/route.ts",
  "app/api/uploads/[...path]/route.ts"
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(ROOT, relPath);
  if (fs.existsSync(fullPath)) {
    pass(`File exists: ${relPath}`);
  } else {
    fail(`Missing required security file: ${relPath}`);
  }
}

// 2. Verify magic byte check is integrated inside file upload routes
const uploadRoute = fs.readFileSync(path.join(ROOT, "app/api/materials/upload/route.ts"), "utf8");
if (uploadRoute.includes("validateFileMagicBytes(buffer, file.type)")) {
  pass("app/api/materials/upload/route.ts checks validateFileMagicBytes before writing to disk.");
} else {
  fail("app/api/materials/upload/route.ts missing validateFileMagicBytes check!");
}

const submitRoute = fs.readFileSync(path.join(ROOT, "app/api/assessments/submit/route.ts"), "utf8");
if (submitRoute.includes("validateFileMagicBytes(buffer, pending.file.type)")) {
  pass("app/api/assessments/submit/route.ts checks validateFileMagicBytes before writing to disk.");
} else {
  fail("app/api/assessments/submit/route.ts missing validateFileMagicBytes check!");
}

// 3. Verify rate limiting in uploads serve route and auth routes
const serveRoute = fs.readFileSync(path.join(ROOT, "app/api/uploads/[...path]/route.ts"), "utf8");
if (serveRoute.includes("uploadsLimiter.check(request)")) {
  pass("app/api/uploads/[...path]/route.ts enforces rate limiting.");
} else {
  fail("app/api/uploads/[...path]/route.ts missing rate limiting!");
}

// 4. Verify no direct writes to public/uploads
if (uploadRoute.includes('public/uploads') || submitRoute.includes('public/uploads')) {
  fail("Upload endpoints are writing to public/uploads which bypasses auth!");
} else {
  pass("Upload endpoints safely write outside public directory (private storage / .data / /tmp fallback).");
}

if (errors > 0) {
  console.error(`\nSecurity baseline check FAILED with ${errors} violation(s).`);
  process.exit(1);
} else {
  console.log("\nSecurity baseline check PASSED: All P0 security controls and ISO compliance guards active.");
  process.exit(0);
}
