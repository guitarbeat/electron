import { test, expect, type Page } from "@playwright/test";

const TV_UA = "Mozilla/5.0 (Linux; Android 11; AFTKM) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 ElectronTV/1.0 (AFTKM)";

async function openWall(page: Page) {
  await page.route("https://**/*", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
  await page.route("**/api/session", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: "Aaron", activeUsers: ["Aaron"], pinProtectedUsers: [], usersMissingPins: [] }) }));
  await page.goto("/#movies", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".movie-library-grid .movie-item-details-hit-area").first()).toBeVisible();
}

const cover = (page: Page, selector: string) => page.locator(selector).first().evaluate((element) => {
  const style = getComputedStyle(element, "::before");
  return { name: style.animationName, display: style.display, visibility: style.visibility };
});
const SETTINGS = '.top-frame-panel[data-frame-panel="filters"]:not(.dyn-notch-ghost)';

test.describe("notch sheets open like the movie book", () => {
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: "no-preference" });

  test("Settings swings its cover open, then the sheet is fully usable from the keyboard", async ({ page }) => {
    await openWall(page);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect.poll(() => cover(page, SETTINGS)).toMatchObject({ name: "bookCoverOpen", display: "flex" });
    // Once open the cover is gone and never blocks the controls.
    await expect.poll(async () => (await cover(page, SETTINGS)).visibility, { timeout: 3000 }).toBe("hidden");
    const sort = page.locator('[data-notch-panel="settings"]:not(.dyn-notch-ghost)').getByRole("radiogroup", { name: "Sort by" });
    await sort.getByRole("radio").first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(sort.getByRole("radio").nth(1)).toBeFocused();
  });

  test("the profile sheet opens from its right-hand spine", async ({ page }) => {
    await openWall(page);
    await page.locator('.frame-corner-profiles [data-notch-trigger="bottom"]').first().click();
    await expect.poll(() => cover(page, ".frame-corner-profiles .profile-settings-menu:not(.dyn-notch-ghost)")).toMatchObject({ name: "bookCoverOpenRight" });
  });
});

test.describe("TV", () => {
  test.use({ viewport: { width: 960, height: 540 }, userAgent: TV_UA, reducedMotion: "no-preference" });

  test("uses the flat fold instead of the 3D swing", async ({ page }) => {
    await openWall(page);
    await page.locator('[data-notch-trigger="bottom"]').first().focus();
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await cover(page, SETTINGS)).name).toBe("bookCoverFold");
  });
});

test.describe("reduced motion", () => {
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });

  test("draws no cover at all", async ({ page }) => {
    await openWall(page);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.locator('[data-notch-panel="settings"]:not(.dyn-notch-ghost)')).toBeVisible();
    expect((await cover(page, SETTINGS)).display).toBe("none");
  });
});
