import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const learnerEmail = process.env.E2E_TEST_EMAIL || "peserta@profas.id";
const learnerPassword = process.env.E2E_TEST_PASSWORD || "profas123";
const coursePath = "/belajar/fondasi-kepemimpinan-berdampak";

async function waitForApp(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  await expect(page.locator("body")).toBeVisible();
}

async function loginAsLearner(page: import("@playwright/test").Page) {
  await page.goto("/masuk");
  await page.locator('input[name="email"]').fill(learnerEmail);
  await page.locator('input[name="password"]').fill(learnerPassword);
  await page.getByRole("button", { name: /masuk ke dashboard/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await waitForApp(page);
  await expect(page.locator(".dashboard-layout")).toBeVisible({ timeout: 20_000 });
}

test.describe("public performance and accessibility", () => {
  test("landing page has no runtime errors and accessible primary actions", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await waitForApp(page);

    await expect(page.getByRole("link", { name: /program/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /mulai|jelajahi/i }).first()).toBeVisible();
    expect(errors).toEqual([]);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("program catalog keeps search and navigation usable on mobile", async ({ page }) => {
    await page.goto("/program");
    await waitForApp(page);
    await expect(page.getByRole("textbox", { name: /cari program/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /program/i }).first()).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("learner journey", () => {
  test("learner can reach dashboard and course player with accessible controls", async ({ page }) => {
    await loginAsLearner(page);
    await expect(page.locator(".hero-banner-student")).toBeVisible({ timeout: 20_000 });

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
