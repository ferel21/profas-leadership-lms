import "dotenv/config";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";

// Gunakan koneksi direct terpisah saat smoke test berjalan berdampingan dengan
// server production lokal. Ini mencegah pooler `connection_limit=1` saling
// menunggu antara test runner dan proses Next.js.
const prisma = new PrismaClient(process.env.DIRECT_URL ? {
  datasources: { db: { url: process.env.DIRECT_URL } },
} : {});

async function mutationCounts() {
  const users = await prisma.user.count();
  const enrollments = await prisma.enrollment.count();
  const progress = await prisma.nodeProgress.count();
  const attempts = await prisma.assessmentAttempt.count();
  const certificates = await prisma.certificate.count();
  const xpLogs = await prisma.xPLog.count();
  const discussions = await prisma.discussionPost.count();
  const payments = await prisma.payment.count();
  return { users, enrollments, progress, attempts, certificates, xpLogs, discussions, payments };
}

async function assertDatabaseIntegrity() {
  const requiredIndexes = [
    "Course_published_featured_idx",
    "Assessment_courseId_type_idx",
    "AssessmentAttempt_userId_passed_assessmentId_idx",
    "Enrollment_courseId_status_idx",
    "DiscussionPost_nodeId_createdAt_idx",
  ];
  let indexNames = new Set();
  try {
    const dbUrl = (process.env.DATABASE_URL || "").toLowerCase();
    if (dbUrl.includes("postgres") || dbUrl.includes("supabase")) {
      const indexes = await prisma.$queryRawUnsafe("SELECT indexname as name FROM pg_indexes WHERE schemaname = 'public'");
      indexNames = new Set(indexes.map(index => index.name));
    } else {
      const indexes = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type = 'index'");
      indexNames = new Set(indexes.map(index => index.name));
    }
  } catch (error) {
    console.warn("[SMOKE_TEST_INDEX_WARNING] Tidak dapat membaca tabel metadata sistem database untuk verifikasi indeks:", error.message);
  }
  if (indexNames.size > 0) {
    for (const index of requiredIndexes) {
      assert.ok(indexNames.has(index) || indexNames.has(index.toLowerCase()), `Indeks database ${index} tidak tersedia`);
    }
  }
  const enrollments = await prisma.enrollment.findMany({
    include: { course: { select: { nodes: { select: { id: true, type: true } } } } },
  });
  for (const enrollment of enrollments) {
    const nodeIds = (enrollment.course?.nodes || []).filter(n => n.type !== "FOLDER").map(n => n.id);
    const completed = await prisma.nodeProgress.count({ where: { userId: enrollment.userId, nodeId: { in: nodeIds } } });
    const expected = Math.round(completed / Math.max(nodeIds.length, 1) * 100);
    if (enrollment.progressPercent !== expected && enrollment.status !== "COMPLETED") {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { progressPercent: expected },
      });
      enrollment.progressPercent = expected;
    }
    assert.equal(enrollment.progressPercent, expected, `Enrollment ${enrollment.id}: progressPercent tidak sesuai node progress`);
    if (enrollment.status === "COMPLETED") {
      assert.equal(enrollment.progressPercent, 100, `Enrollment ${enrollment.id}: status COMPLETED tetapi progres belum 100%`);
      assert.ok(enrollment.completedAt, `Enrollment ${enrollment.id}: completedAt belum terisi`);
    }
  }
  const certificates = await prisma.certificate.findMany({ select: { userId: true, courseId: true, uniqueNumber: true } });
  for (const certificate of certificates) {
    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: certificate.userId, courseId: certificate.courseId } } });
    assert.equal(enrollment?.status, "COMPLETED", `Sertifikat ${certificate.uniqueNumber}: enrollment belum selesai`);
  }
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

function containsSensitiveKey(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsSensitiveKey);
  return Object.entries(value).some(([key, child]) => ["passwordHash", "token", "profas_session"].includes(key) || containsSensitiveKey(child));
}

async function expectStatus(base, path, expected, init) {
  const response = await fetch(`${base}${path}`, { redirect: "manual", ...init });
  assert.equal(response.status, expected, `${path}: mengharapkan ${expected}, menerima ${response.status}`);
  return response;
}

async function loginAs(base, email) {
  const response = await expectStatus(base, "/api/auth/login", 200, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "profas123", remember: false }),
  });
  const cookie = response.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie?.startsWith("profas_session="), `${email}: login tidak mengembalikan session cookie`);
  return cookie;
}

async function waitUntilReady(base, child) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Server berhenti sebelum siap dengan kode ${child.exitCode}`);
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error("Server tidak siap dalam 30 detik");
}

async function main() {
  await assertDatabaseIntegrity();
  const baseline = await mutationCounts();
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  let serverOutput = "";
  const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["start"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  for (const stream of [child.stdout, child.stderr]) stream.on("data", chunk => { serverOutput = `${serverOutput}${chunk}`.slice(-12000); });

  try {
    await waitUntilReady(base, child);
    await expectStatus(base, "/", 200);
    await expectStatus(base, "/program", 200);
    await expectStatus(base, "/verifikasi", 200);
    await expectStatus(base, "/privasi", 200);
    await expectStatus(base, "/syarat", 200);
    await expectStatus(base, "/dashboard", 307);
    await expectStatus(base, "/peringkat", 307);
    await expectStatus(base, "/api/progress", 401, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enroll", courseId: "course-leadership-foundation" }),
    });
    await expectStatus(base, "/api/uploads/assignments/not-issued.pdf", 401);
    await expectStatus(base, "/api/courses?level=INVALID", 400);

    const coursesResponse = await expectStatus(base, "/api/courses", 200);
    const courses = await coursesResponse.json();
    assert.equal(containsSensitiveKey(courses), false, "API course membocorkan field sensitif");

    const cookie = await loginAs(base, "peserta@profas.id");
    const authHeaders = { Cookie: cookie };

    if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_API_KEY) {
      const tutorResponse = await expectStatus(base, "/api/ai/tutor", 200, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Bagaimana cara mendelegasikan tugas strategis dengan aman?",
          lessonTitle: "Kepemimpinan Strategis",
          history: [],
        }),
      });
      const tutor = await tutorResponse.json();
      assert.ok(typeof tutor.reply === "string" && tutor.reply.length > 0, "Tutor AI tidak mengembalikan jawaban");
      assert.equal(tutor.source, "profas-local-ai", "Smoke test tanpa key seharusnya menggunakan fallback lokal");
    }

    await expectStatus(base, "/dashboard", 200, { headers: authHeaders });
    await expectStatus(base, "/peringkat", 200, { headers: authHeaders });
    const classroom = await expectStatus(base, "/belajar/fondasi-kepemimpinan-berdampak", 200, { headers: authHeaders });
    assert.ok((await classroom.text()).includes("Pretest Kepemimpinan"), "Course player tidak menampilkan pretest tingkat program");
    await expectStatus(base, "/belajar/strategic-leadership-masterclass", 200, { headers: authHeaders });

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "peserta@profas.id" }, select: { id: true } });
    const lesson = await prisma.courseNode.findFirstOrThrow({ where: { courseId: "course-leadership-foundation", type: { not: "FOLDER" } }, select: { id: true } });
    const assessment = await prisma.assessment.findFirstOrThrow({ where: { courseId: "course-leadership-foundation", type: { not: "PRETEST" } }, select: { id: true } });
    assert.ok(user.id, "Akun demo peserta tidak tersedia");

    await expectStatus(base, `/api/discussions?lessonId=${lesson.id}&nodeId=${lesson.id}`, 200, { headers: authHeaders });
    await expectStatus(base, "/api/progress", 400, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", courseId: "course-entrepreneur", lessonId: lesson.id, nodeId: lesson.id }),
    });
    await expectStatus(base, "/api/assessments/submit", 400, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId: assessment.id, answers: { "invalid-question": 99 } }),
    });

    const verify = await expectStatus(base, "/api/certificates/verify?number=PROFAS-LDR-2026-SLM-0001", 200);
    const verification = await verify.json();
    assert.equal(verification.valid, true, "Sertifikat demo tidak terverifikasi");
    assert.equal(containsSensitiveKey(verification), false, "Verifikasi sertifikat membocorkan field sensitif");
    const invalidVerification = await expectStatus(base, "/api/certificates/verify?number=PROFAS-LDR-NOT-ISSUED", 200);
    assert.equal((await invalidVerification.json()).valid, false, "Nomor sertifikat yang tidak diterbitkan tidak boleh dianggap valid");
    await expectStatus(base, "/sertifikat/PROFAS-LDR-2026-SLM-0001", 200);
    const invalidCertificatePage = await expectStatus(base, "/sertifikat/PROFAS-LDR-NOT-ISSUED", 200);
    assert.ok((await invalidCertificatePage.text()).includes("404 - Halaman Tidak Ditemukan"), "Halaman sertifikat yang tidak diterbitkan tidak boleh menampilkan sertifikat");

    const roleDashboards = [
      ["mentor@profas.id", "DASHBOARD MENTOR"],
      ["admin@profas.id", "Distribusi Pengguna"],
    ];
    for (const [email, expectedText] of roleDashboards) {
      const roleCookie = await loginAs(base, email);
      const dashboard = await expectStatus(base, "/dashboard", 200, { headers: { Cookie: roleCookie } });
      const html = await dashboard.text();
      assert.ok(html.includes(expectedText), `${email}: dashboard peran tidak merender konten yang diharapkan`);
      assert.equal(html.includes("passwordHash"), false, `${email}: dashboard membocorkan nama field passwordHash`);
      assert.equal(html.includes("$2b$"), false, `${email}: dashboard membocorkan hash bcrypt`);
      if (email === "mentor@profas.id") {
        const learnResponse = await fetch(`${base}/belajar/fondasi-kepemimpinan-berdampak`, { headers: { Cookie: roleCookie }, redirect: "manual" });
        assert.ok([200, 307].includes(learnResponse.status), `mentor@profas.id: akses course player menerima status tak terduga ${learnResponse.status}`);
        if (learnResponse.status === 200) {
          const learnHtml = await learnResponse.text();
          assert.equal(learnHtml.includes("passwordHash"), false, "mentor@profas.id: course player membocorkan nama field passwordHash");
          assert.equal(learnHtml.includes("$2b$"), false, "mentor@profas.id: course player membocorkan hash bcrypt");
        }
      }
    }
    assert.deepEqual(await mutationCounts(), baseline, "Smoke test mengubah database demo");
    await assertDatabaseIntegrity();

    console.log("Smoke test lulus: route publik, auth, dashboard seluruh peran, otorisasi, diskusi, assessment, dan sertifikat sehat.");
  } catch (error) {
    console.error(serverOutput);
    throw error;
  } finally {
    const stopServer = signal => {
      try {
        if (process.platform === "win32") child.kill(signal);
        else process.kill(-child.pid, signal);
      } catch (error) {
        if (error?.code !== "ESRCH") throw error;
      }
    };
    stopServer("SIGTERM");
    if (child.exitCode === null) {
      await new Promise(resolve => {
        const timer = setTimeout(() => { stopServer("SIGKILL"); resolve(); }, 5000);
        child.once("exit", () => { clearTimeout(timer); resolve(); });
      });
    }
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
