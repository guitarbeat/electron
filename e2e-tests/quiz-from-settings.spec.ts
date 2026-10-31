import { test, expect, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.route("https://**/*", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
  await page.route("**/api/session", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: "Aaron", activeUsers: ["Aaron"], pinProtectedUsers: [], usersMissingPins: [] }) }));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".movie-library-grid .movie-item-details-hit-area").first()).toBeVisible();
}

for (const viewport of [{ width: 1024, height: 640 }, { width: 390, height: 844 }]) {
  test.describe(`movie quiz from Settings at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("opens the quiz, collapses Settings, and Escape returns to the wall", async ({ page }) => {
      await open(page);
      const settings = page.getByRole("button", { name: "Settings", exact: true });
      await settings.click();
      const panel = page.locator('[data-notch-panel="settings"]');
      await expect(panel).toBeVisible();

      const quizButton = panel.getByRole("button", { name: "Movie quiz" });
      await expect(quizButton).toBeInViewport({ ratio: 1 });
      await quizButton.click();

      const quiz = page.getByRole("dialog", { name: "Personality quiz" });
      await expect(quiz).toBeVisible();
      await expect(panel).toBeHidden();
      const start = quiz.getByRole("button", { name: "Start Quiz", exact: true });
      await expect(start).toBeInViewport({ ratio: 1 });
      await start.click();
      const firstAnswer = quiz.getByRole("button", { name: /Shortlist three great options/ });
      await expect(firstAnswer).toBeInViewport({ ratio: 1 });

      await page.keyboard.press("Escape");
      await expect(quiz).toBeHidden();
      await expect(settings).toBeFocused();
    });
  });
}

test("keyboard: Movie quiz is reachable in Settings and opens with Enter", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const quizButton = page.locator('[data-notch-panel="settings"]').getByRole("button", { name: "Movie quiz" });
  await quizButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Personality quiz" })).toBeVisible();
});
