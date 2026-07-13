import assert from "node:assert/strict";

const baseUrl = new URL(process.env.BASE_URL || "http://127.0.0.1:3000");
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname);
if (!isLocal && process.env.SECURITY_TEST_CONFIRM !== "I_UNDERSTAND") {
  throw new Error("Refusing to run active security checks against a non-local target without SECURITY_TEST_CONFIRM=I_UNDERSTAND.");
}

const checks = [];

function pass(name, detail = "") {
  checks.push({ name, status: "PASS", detail });
}

function skip(name, detail) {
  checks.push({ name, status: "SKIP", detail });
}

async function request(path, init = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    signal: AbortSignal.timeout(Number(process.env.SECURITY_TIMEOUT_MS || 10000)),
    ...init,
  });
  const text = await response.text();
  return { response, text };
}

async function expectStatus(name, path, expected, init) {
  const { response, text } = await request(path, init);
  assert.equal(response.status, expected, `${name}: expected ${expected}, received ${response.status}`);
  pass(name, `${response.status} ${path}`);
  return { response, text };
}

function assertSecurityHeaders(response) {
  const expected = {
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-permitted-cross-domain-policies": "none",
    "origin-agent-cluster": "?1",
  };
  for (const [header, value] of Object.entries(expected)) {
    assert.equal(response.headers.get(header), value, `Missing or invalid ${header}`);
  }
  assert.match(response.headers.get("permissions-policy") || "", /geolocation=\(\)/, "Permissions-Policy must disable geolocation");
}

function assertNoSensitiveHealthData(text) {
  for (const key of ["totalUsers", "totalCourses", "memoryUsageMB", "proLmsFeatures", "environment"]) {
    assert.equal(text.includes(key), false, `Public health response exposes ${key}`);
  }
}

async function main() {
  const home = await expectStatus("public landing", "/", 200);
  assertSecurityHeaders(home.response);
  pass("security headers", "baseline response headers present");

  const health = await expectStatus("public health", "/api/health", 200);
  assertNoSensitiveHealthData(health.text);
  pass("health minimization", "public response omits operational detail");

  const dashboard = await expectStatus("protected dashboard", "/dashboard", 307);
  assert.match(dashboard.response.headers.get("location") || "", /\/masuk\?next=/, "Protected route must redirect to login");
  pass("protected route redirect", "anonymous dashboard access is denied");

  await expectStatus("anonymous progress mutation", "/api/progress", 401, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "enroll", courseId: "not-authorized" }),
  });
  await expectStatus("anonymous upload access", "/api/uploads/assignments/not-issued.pdf", 401);
  await expectStatus("anonymous badge access", "/api/badges?userId=other-user", 401);
  await expectStatus("anonymous mentor question access", "/api/mentor/assessments/not-issued/questions", 401);

  const invalidLogin = await expectStatus("invalid login validation", "/api/auth/login", 400, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: "x" }),
  });
  assert.equal(/stack|prisma|node_modules/i.test(invalidLogin.text), false, "Auth error must not expose implementation details");
  pass("generic auth errors", "invalid input has no stack or database details");

  await expectStatus("invalid course filter", "/api/courses?level=INVALID", 400);

  const email = process.env.SECURITY_TEST_EMAIL;
  const password = process.env.SECURITY_TEST_PASSWORD;
  if (email && password) {
    const login = await expectStatus("authenticated cookie", "/api/auth/login", 200, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, remember: false }),
    });
    const cookie = login.response.headers.get("set-cookie") || "";
    assert.match(cookie, /HttpOnly/i, "Session cookie must be HttpOnly");
    assert.match(cookie, /SameSite=Lax/i, "Session cookie must use SameSite=Lax");
    if (process.env.NODE_ENV === "production") assert.match(cookie, /Secure/i, "Production session cookie must be Secure");
    pass("session cookie flags", "authenticated check completed without printing token");
  } else {
    skip("session cookie flags", "set SECURITY_TEST_EMAIL and SECURITY_TEST_PASSWORD to run with a test account");
  }

  const failed = checks.filter((check) => check.status === "FAIL");
  console.log(JSON.stringify({ target: baseUrl.origin, checks, summary: { passed: checks.filter(c => c.status === "PASS").length, skipped: checks.filter(c => c.status === "SKIP").length, failed: failed.length } }, null, 2));
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Security baseline failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
