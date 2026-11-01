import { test, expect, type Page } from "@playwright/test";

async function openWall(page: Page) {
  await page.route("https://**/*", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
  await page.route("**/api/session", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: "Aaron", activeUsers: ["Aaron"], pinProtectedUsers: [], usersMissingPins: [] }) }));
  await page.goto("/#movies", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".movie-library-grid .movie-item-details-hit-area").first()).toBeVisible();
}

const box = (page: Page, selector: string) => page.locator(selector).first().evaluate((element) => {
  const rect = element.getBoundingClientRect();
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
});

for (const size of [{ width: 390, height: 844 }, { width: 360, height: 800 }, { width: 320, height: 640 }]) {
  test.describe(`phone ${size.width}x${size.height}`, () => {
    test.use({ viewport: size, hasTouch: true, isMobile: true });

    test("keeps four corner notches instead of a filled top bar", async ({ page }) => {
      await openWall(page);
      const topBorder = await page.locator(".viewport-frame").evaluate((element) => parseFloat(getComputedStyle(element).borderTopWidth));
      expect(topBorder).toBeLessThanOrEqual(8);
      const search = await box(page, '.dyn-notch[data-notch="search"]');
      const add = await box(page, '.dyn-notch[data-notch="add"]');
      const settings = await box(page, '.dyn-notch[data-notch="settings"]');
      const profiles = await box(page, '.dyn-notch[data-notch="profiles"]');
      expect(search).toMatchObject({ left: 0, top: 0 });
      expect(add.right).toBe(size.width);
      expect(add.top).toBe(0);
      // A real gap between the two top notches: they are corners, not one bar.
      expect(add.left - search.right).toBeGreaterThan(size.width / 3);
      expect(settings.bottom).toBe(size.height);
      expect(profiles.right).toBe(size.width);
      for (const label of ["Search movies (/)", "Add a movie or show (Cmd+K)"]) {
        const target = await box(page, `[aria-label="${label}"]`);
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
      }
    });

    test("Settings opens from its corner and fits the screen", async ({ page }) => {
      await openWall(page);
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      const content = page.locator(".y2k-command-dock .top-frame-panels__content");
      await expect(page.locator('[data-notch-panel="settings"]:not(.dyn-notch-ghost)')).toBeVisible();
      await expect.poll(async () => (await content.evaluate((element) => element.getBoundingClientRect().top))).toBeGreaterThan(0);
      const rect = await content.evaluate((element) => element.getBoundingClientRect().toJSON());
      const searchNotch = await box(page, '.dyn-notch[data-notch="search"]');
      expect(rect.top).toBeGreaterThanOrEqual(searchNotch.bottom);
      expect(rect.bottom).toBeLessThanOrEqual(size.height);
      expect(rect.right).toBeLessThanOrEqual(size.width);
    });
  });
}

test.describe("iPhone safe areas", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("top notches clear the status bar and bottom ones clear the home indicator", async ({ page }) => {
    await openWall(page);
    await page.addStyleTag({ content: ":root{--frame-safe-top:47px!important;--frame-safe-bottom:34px!important}" });
    await expect.poll(async () => (await box(page, '[aria-label="Search movies (/)"]')).top).toBeGreaterThanOrEqual(47);
    const settings = await box(page, '[data-notch-trigger="bottom"]');
    expect(settings.bottom).toBeLessThanOrEqual(844 - 34);
    const topBorder = await page.locator(".viewport-frame").evaluate((element) => parseFloat(getComputedStyle(element).borderTopWidth));
    expect(topBorder).toBeLessThanOrEqual(8);
  });
});
