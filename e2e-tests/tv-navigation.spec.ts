import { test, expect } from "@playwright/test";

test.describe("Fire TV remote navigation", () => {
  test.use({ viewport: { width: 960, height: 540 }, userAgent: "Mozilla/5.0 (Linux; Android 11; AFTKM) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 ElectronTV/1.0" });
  test.beforeEach(async ({ page }) => {
    await page.route("https://**/*", route => route.abort());
    await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
    await page.route("**/api/session", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: "Aaron", activeUsers: ["Aaron"], pinProtectedUsers: ["Aaron", "Electra"], usersMissingPins: [] }) }));
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveClass(/is-tv-runtime/);
    await expect(page.locator(".movie-library-grid .movie-item-details-hit-area").first()).toBeVisible();
  });

  test("D-pad reaches posters, scrolls rows, confines dialogs, and Back restores focus", async ({ page }) => {
    const search = page.getByRole("button", { name: "Search movies (/)", exact: true });
    await search.focus();
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest(".movie-library-grid"))).toBe(true);
    // Suggestions have their own Accept/Reject controls; continue across to a saved movie.
    for (let step = 0; step < 8 && !await page.evaluate(() => document.activeElement?.closest("[data-movie-id]")); step++) {
      await page.keyboard.press("ArrowRight");
    }
    const firstId = await page.evaluate(() => document.activeElement?.closest("[data-movie-id]")?.getAttribute("data-movie-id"));
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest("[data-movie-id]")?.getAttribute("data-movie-id"))).not.toBe(firstId);
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => page.locator(".movie-library-grid").evaluate(e => e.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest("[data-movie-id]"))).toBe(true);
    const selectedId = await page.evaluate(() => document.activeElement?.closest("[data-movie-id]")?.getAttribute("data-movie-id"));
    await page.keyboard.press("Enter");
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').last();
    await expect(dialog).toBeVisible();
    for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
      await page.keyboard.press(key);
      await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    }
    expect(await page.evaluate(() => window.electronTvBack?.())).toBe(true);
    await expect(dialog).not.toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest("[data-movie-id]")?.getAttribute("data-movie-id"))).toBe(selectedId);
    await expect(page.locator(".viewport-frame")).toHaveCSS("mix-blend-mode", "difference");
  });

  test("view menu, picker, filter dialog, and text entry support the remote", async ({ page }) => {
    const menu = page.locator(".library-settings summary");
    await menu.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Grid", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("button", { name: "Moving wall", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("button", { name: "Pick a movie", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Movie picker", exact: true })).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest(".frame-movie-picker"))).toBe(true);
    expect(await page.evaluate(() => window.electronTvBack?.())).toBe(true);
    await expect(page.getByRole("dialog", { name: "Movie picker", exact: true })).not.toBeVisible();
    await page.evaluate(() => window.electronTvBack?.());
    await page.getByRole("button", { name: "Filter", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Movie filters", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Movie filters", exact: true })).not.toBeVisible();
    await page.getByRole("button", { name: "Search movies (/)", exact: true }).focus();
    await page.keyboard.press("Enter");
    const input = page.getByRole("searchbox", { name: "Search your watchlist" });
    await expect(input).toBeFocused();
    await input.fill("Dune");
    await page.keyboard.press("ArrowLeft");
    await expect(input).toBeFocused();
    expect(await page.evaluate(() => window.electronTvBack?.())).toBe(true);
    await expect(input).not.toBeVisible();
    expect(await page.evaluate(() => window.electronTvBack?.())).toBe(false);
    await page.evaluate(() => window.addEventListener("electron-tv-media", event => {
      document.documentElement.dataset.mediaKey = (event as CustomEvent<string>).detail;
    }, { once: true }));
    await page.keyboard.press("MediaPlayPause");
    await expect(page.locator("html")).toHaveAttribute("data-media-key", "MediaPlayPause");
  });
  test("Select reveals suggestion details and moving-wall posters remain remote-accessible", async ({ page }) => {
    const suggestion = page.locator(".suggestion-item-container").first();
    await suggestion.locator(".movie-item-details-hit-area").focus();
    await page.keyboard.press("Enter");
    await expect(suggestion.locator(".suggestion-poster-details")).toBeVisible();
    expect(await page.evaluate(() => window.electronTvBack?.())).toBe(true);
    await expect(suggestion.locator(".suggestion-poster-details")).not.toBeVisible();
    await page.locator(".library-settings summary").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Grid", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(page.locator(".drift-wall")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Search movies (/)", exact: true }).focus();
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest(".drift-wall"))).toBe(true);
    await expect(page.locator(".viewport-frame")).toHaveCSS("mix-blend-mode", "difference");
  });

});

test("desktop and Fire TV share the same grid density and frame geometry", async ({ browser }) => {
  const layouts: unknown[] = [];
  for (const userAgent of ["Desktop browser", "ElectronTV/1.0 AFTKM"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, userAgent });
    const page = await context.newPage();
    await page.route("https://**/*", route => route.abort());
    await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
    await page.route("**/api/session", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: null, activeUsers: [], pinProtectedUsers: ["Aaron", "Electra"], usersMissingPins: [] }) }));
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".movie-library-grid .movie-item-details-hit-area").first()).toBeVisible();
    layouts.push(await page.evaluate(() => {
      const grid = getComputedStyle(document.querySelector(".movie-library-grid")!);
      const frame = getComputedStyle(document.querySelector(".viewport-frame")!);
      const search = getComputedStyle(document.querySelector(".y2k-library-search")!);
      return { columns: grid.gridTemplateColumns, gap: grid.gap, padding: grid.padding,
        border: frame.borderWidth, blend: frame.mixBlendMode, searchWidth: search.width, searchHeight: search.height };
    }));
    await context.close();
  }
  expect(layouts[1]).toEqual(layouts[0]);
});
