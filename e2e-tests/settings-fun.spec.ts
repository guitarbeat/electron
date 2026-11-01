import { test, expect, type Page } from "@playwright/test";

async function openSettings(page: Page) {
  await page.route("https://**/*", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
  await page.route("**/api/session", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: "Aaron", activeUsers: ["Aaron"], pinProtectedUsers: [], usersMissingPins: [] }) }));
  await page.goto("/#movies", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".movie-library-grid .movie-item-details-hit-area").first()).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const panel = page.locator('[data-notch-panel="settings"]:not(.dyn-notch-ghost)');
  await expect(panel).toBeVisible();
  return panel;
}

test.describe("playful Settings sheet", () => {
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: "no-preference" });

  test("genres each get their own colour and icon, and people their own tint", async ({ page }) => {
    const panel = await openSettings(page);
    const chips = panel.locator(".settings-menu__chip");
    const looks = await chips.evaluateAll((elements) => elements.map((element) => ({
      background: getComputedStyle(element).backgroundColor,
      icon: element.querySelector(".settings-menu__chip-icon")?.textContent ?? "",
    })));
    expect(looks.length).toBeGreaterThan(3);
    expect(looks.every((look) => look.icon.length > 0)).toBe(true);
    expect(new Set(looks.map((look) => look.background)).size).toBeGreaterThan(3);
    const pills = await panel.locator(".settings-menu__person .settings-menu__pill").evaluateAll((elements) => elements.map((element) => getComputedStyle(element).backgroundColor));
    expect(pills).toHaveLength(2);
    expect(pills[0]).not.toBe(pills[1]);
  });

  test("the status highlight takes the chosen shelf's colour and still works from the keyboard", async ({ page }) => {
    const panel = await openSettings(page);
    const status = panel.locator(".settings-menu__seg--status");
    await status.getByRole("button", { name: /^Seen/ }).focus();
    await page.keyboard.press("Enter");
    await expect(status).toHaveAttribute("data-active-tone", "seen");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await expect(status).toHaveAttribute("data-active-tone", "watching");
  });

  test("Pick a movie throws pixel confetti", async ({ page }) => {
    const panel = await openSettings(page);
    await panel.locator(".frame-picker-trigger").click();
    await expect(page.locator("body > .settings-confetti")).toHaveCount(1);
    await expect(page.locator("body > .settings-confetti")).toHaveCount(0, { timeout: 3000 });
  });
});

test.describe("reduced motion", () => {
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });

  test("no confetti and no looping shimmer", async ({ page }) => {
    const panel = await openSettings(page);
    const shimmer = await panel.locator(".frame-picker-trigger").evaluate((element) => getComputedStyle(element, "::after").animationName);
    expect(shimmer).toBe("none");
    await panel.locator(".frame-picker-trigger").click();
    await page.waitForTimeout(100);
    await expect(page.locator("body > .settings-confetti")).toHaveCount(0);
  });
});
