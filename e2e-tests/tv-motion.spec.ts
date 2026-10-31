import { test, expect, type Page } from "@playwright/test";

const TV_UA = "Mozilla/5.0 (Linux; Android 11; AFTKM) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 ElectronTV/1.0 (AFTKM)";

async function openTv(page: Page) {
  await page.route("https://**/*", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
  await page.route("**/api/session", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: "Aaron", activeUsers: ["Aaron"], pinProtectedUsers: [], usersMissingPins: [] }) }));
  await page.goto("/#movies", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveClass(/is-tv-runtime/);
  await expect(page.locator(".movie-library-grid .movie-item-details-hit-area").first()).toBeVisible();
}

const durationMs = (value: string) => Math.max(...value.split(",").map((part) => parseFloat(part) * (part.trim().endsWith("ms") ? 1 : 1000)));

test.describe("Fire TV keeps the desktop motion", () => {
  // The suite defaults to reduced motion; these checks are about the full-motion TV path.
  test.use({ viewport: { width: 960, height: 540 }, userAgent: TV_UA, reducedMotion: "no-preference" });

  test("the branded boot screen hands off to the wall and is removed", async ({ page }) => {
    await openTv(page);
    await expect(page.locator("#boot-splash")).toHaveCount(0);
  });

  test("the Settings notch morphs and its status pill slides on TV", async ({ page }) => {
    await openTv(page);
    const notch = page.locator('.dyn-notch[data-notch="settings"]');
    expect(durationMs(await notch.evaluate((element) => getComputedStyle(element).transitionDuration))).toBeGreaterThan(100);
    await page.locator('[data-notch-trigger="bottom"]').first().focus();
    await page.keyboard.press("Enter");
    const pill = page.locator('[data-notch-panel="settings"]:not(.dyn-notch-ghost) .settings-menu__seg--status .settings-menu__pill');
    await expect(page.locator('[data-notch-panel="settings"]:not(.dyn-notch-ghost)')).toBeVisible();
    expect(durationMs(await pill.evaluate((element) => getComputedStyle(element).transitionDuration))).toBeGreaterThan(100);
  });

  test("reduced motion still turns the notch morph off on TV", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openTv(page);
    const notch = page.locator('.dyn-notch[data-notch="settings"]');
    expect(durationMs(await notch.evaluate((element) => getComputedStyle(element).transitionDuration))).toBe(0);
  });
});
