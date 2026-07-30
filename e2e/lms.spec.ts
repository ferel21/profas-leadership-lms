import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const learnerEmail = process.env.E2E_TEST_EMAIL || "peserta@profas.id";
const learnerPassword = process.env.E2E_TEST_PASSWORD || "profas123";
const mentorEmail = process.env.E2E_MENTOR_EMAIL || "mentor@profas.id";
const adminEmail = process.env.E2E_ADMIN_EMAIL || "admin@profas.id";
const coursePath = "/belajar/fondasi-kepemimpinan-berdampak";

async function waitForApp(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  await expect(page.locator("body")).toBeVisible();
}

async function waitForLeafAnimations(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => document.querySelector('[data-leaf-state="running"]') === null,
    undefined,
    { timeout: 5_000 },
  );
}

async function loginAs(page: import("@playwright/test").Page, email: string, password = learnerPassword) {
  await page.goto("/masuk");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /masuk ke dashboard/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await waitForApp(page);
  await expect(page.locator(".dashboard-layout")).toBeVisible({ timeout: 20_000 });
}

async function loginAsLearner(page: import("@playwright/test").Page) {
  await loginAs(page, learnerEmail);
}

test.describe("public performance and accessibility", () => {
  test("landing page has no runtime errors and accessible primary actions", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await waitForApp(page);

    await expect(page.locator(".pf-public-page > main > section").first()).toHaveAttribute("data-leaf-group-state", "done", { timeout: 5_000 });
    await expect(page.locator(".pf-hero-layout")).toHaveAttribute("data-leaf-group-state", "done", { timeout: 5_000 });
    await waitForLeafAnimations(page);
    await expect(page.getByRole("link", { name: /program/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /mulai|jelajahi/i }).first()).toBeVisible();
    expect(errors).toEqual([]);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("program catalog keeps search and navigation usable on mobile", async ({ page }) => {
    await page.goto("/program");
    await waitForApp(page);
    await waitForLeafAnimations(page);
    await expect(page.getByRole("textbox", { name: /cari program/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /program/i }).first()).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("login page has accessible auth form controls and no WCAG violations", async ({ page }) => {
    await page.goto("/masuk");
    await waitForApp(page);
    await expect(page.locator("form.auth-form")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("learner journey", () => {
  test("learner can reach dashboard and course player with accessible controls", async ({ page }) => {
    await loginAsLearner(page);
    await expect(page.locator(".pf-student-resume")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".pf-workspace-main > .pf-student-dashboard")).toHaveAttribute("data-leaf-group-state", "done", { timeout: 5_000 });
    await waitForLeafAnimations(page);

    const sidebar = page.getByRole("complementary", { name: /navigasi utama ruang belajar/i });
    await expect(sidebar.getByRole("link", { name: "Ringkasan" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Absensi" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Peringkat" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Pengaturan" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Program Saya" })).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: "Sertifikat" })).toHaveCount(0);
    await expect(sidebar.locator(".logo")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

    const dashboardResults = await new AxeBuilder({ page }).analyze();
    expect(dashboardResults.violations).toEqual([]);

    await page.goto(coursePath);
    await waitForApp(page);
    await expect(page.getByText(/ringkasan belajar|lanjutkan belajar/i).first()).toBeVisible();
    await expect(page.getByRole("progressbar", { name: /progres program/i })).toBeVisible();
    await expect(page.getByRole("tablist", { name: /informasi materi/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /materi sebelumnya/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /tandai selesai|materi berikutnya/i }).last()).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("course player supports keyboard navigation on mobile", async ({ page }) => {
    test.skip((page.viewportSize()?.width || 1280) >= 600, "Test ini dijalankan pada viewport mobile.");
    await loginAsLearner(page);
    await page.goto(coursePath);
    await waitForApp(page);

    const menuButton = page.getByRole("button", { name: /buka daftar materi/i });
    await menuButton.focus();
    await expect(menuButton).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("complementary", { name: /daftar materi/i })).toBeVisible();

    const firstLesson = page.locator(".module-list button").first();
    await expect(firstLesson).toBeVisible();
    await firstLesson.focus();
    await expect(firstLesson).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("tab", { name: /materi/i })).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("mentor and admin workspaces", () => {
  test("mentor keeps grading, participants, attendance, ranking, and calendar available", async ({ page }) => {
    await loginAs(page, mentorEmail);
    await expect(page.locator(".pf-mentor-dashboard")).toBeVisible();
    await expect(page.getByRole("heading", { name: /evaluasi|semua evaluasi/i }).first()).toBeVisible();

    const sidebar = page.getByRole("complementary", { name: /navigasi utama ruang belajar/i });
    for (const label of ["Manajemen Peserta", "Evaluasi", "Kalender", "Absensi", "Analitik", "Peringkat", "Komunitas"]) {
      await expect(sidebar.getByRole("link", { name: label })).toHaveCount(1);
    }

    await page.goto("/mentor/evaluasi");
    await waitForApp(page);
    await expect(page.getByRole("heading", { name: "Riwayat Evaluasi" })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Cari evaluasi" })).toBeVisible();
    await expect(page.getByLabel("Filter status")).toBeVisible();

    await page.goto("/kalender");
    await waitForApp(page);
    await expect(page.getByRole("button", { name: /tambah jadwal/i })).toBeVisible();
  });

  test("admin receives the same minimal shell and all platform controls", async ({ page }) => {
    await loginAs(page, adminEmail);
    await expect(page.locator(".pf-admin-dashboard")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Operasional LMS dalam satu ruang." })).toBeVisible();

    const sidebar = page.getByRole("complementary", { name: /navigasi utama ruang belajar/i });
    for (const label of ["Pengguna", "Program", "Siaran", "Kalender", "Absensi", "Analitik", "Peringkat", "Komunitas"]) {
      await expect(sidebar.getByRole("link", { name: label })).toHaveCount(1);
    }

    await expect(page.locator("#program")).toBeAttached();
    await expect(page.locator("#broadcast-mgmt")).toBeAttached();
    await expect(page.locator("#admin-user-mgmt")).toBeAttached();
    await expect(page.locator("#reports")).toBeAttached();

    await page.goto("/kalender");
    await waitForApp(page);
    await expect(page.getByRole("button", { name: /tambah jadwal/i })).toBeVisible();
  });
});
