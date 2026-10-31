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
    const menu = page.getByRole("button", { name: "Settings", exact: true });
    await menu.focus();
    await page.keyboard.press("Enter");
    const settings = page.getByRole("dialog", { name: "Settings", exact: true });
    await expect(settings).toBeVisible();
    await settings.getByRole("switch", { name: "Moving wall", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("button", { name: "Pick a movie", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(settings).not.toBeVisible();
    await expect(page.getByRole("dialog", { name: "Movie picker", exact: true })).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest(".frame-movie-picker"))).toBe(true);
    expect(await page.evaluate(() => window.electronTvBack?.())).toBe(true);
    await expect(page.getByRole("dialog", { name: "Movie picker", exact: true })).not.toBeVisible();
    await expect(menu).toBeFocused();
    await menu.focus();
    await page.keyboard.press("Enter");
    const filters = page.getByRole("dialog", { name: "Settings", exact: true });
    await expect(filters).toBeVisible();
    await expect(filters.getByRole("button", { name: /Queue:/ })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(filters.getByRole("button", { name: /Watching:/ })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Settings, Watching" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(filters).not.toBeVisible();
    await expect(page.locator(".y2k-command-dock .movie-wall-status-buttons")).toHaveCount(0);
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
    await page.getByRole("button", { name: "Settings", exact: true }).focus();
    await page.keyboard.press("Enter");
    const wallSwitch = page.getByRole("dialog", { name: "Settings", exact: true }).getByRole("switch", { name: "Moving wall", exact: true });
    await wallSwitch.focus();
    await page.keyboard.press("Enter");
    await expect(wallSwitch).toHaveAttribute("aria-checked", "true");
    await expect(page.locator(".drift-wall")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Search movies (/)", exact: true }).focus();
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest(".drift-wall"))).toBe(true);
    await expect(page.locator(".viewport-frame")).toHaveCSS("mix-blend-mode", "difference");
  });

  test("D-pad reaches Watch on Stremio without turning the page instead", async ({ page }) => {
    await page.locator(".movie-library-grid [data-movie-id] .movie-item-details-hit-area").first().click();
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').last();
    await expect(dialog).toBeVisible();
    const link = dialog.locator("a.stremio-btn");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /^stremio:\/\/\/search\?search=/);
    await dialog.getByRole("button", { name: /Close details/ }).first().focus();

    const reached = await page.evaluate(async () => {
      const controls = [...document.querySelectorAll<HTMLElement>('a[href],button,[tabindex]')]
        .filter(element => element.tabIndex >= 0);
      controls.forEach((element, index) => { element.dataset.focusProbe = String(index); });
      const idOf = (element: Element | null) => element instanceof HTMLElement ? element.dataset.focusProbe ?? "" : "";
      const seen = new Set<string>();
      const queue = [idOf(document.activeElement)];
      const directions = ["ArrowDown", "ArrowRight", "ArrowLeft", "ArrowUp"];
      while (queue.length && seen.size < 48) {
        const current = queue.shift();
        if (!current || seen.has(current)) continue;
        seen.add(current);
        const origin = document.querySelector<HTMLElement>(`[data-focus-probe="${current}"]`);
        if (origin?.getAttribute("href")?.startsWith("stremio:///search?search=")) return true;
        for (const key of directions) {
          origin?.focus();
          document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
          const next = idOf(document.activeElement);
          if (next && !seen.has(next)) queue.push(next);
        }
      }
      return false;
    });
    expect(reached).toBe(true);

    const activation = await link.evaluate(element => {
      element.focus();
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      const unhandled = element.dispatchEvent(event);
      return {
        unhandled,
        defaultPrevented: event.defaultPrevented,
        href: element.getAttribute("href"),
      };
    });
    expect(activation.defaultPrevented).toBe(false);
    expect(activation.unhandled).toBe(true);
    expect(activation.href).toMatch(/^stremio:\/\/\/search\?search=/);
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
    await page.locator("[data-movie-id] .movie-item-details-hit-area").first().focus();
    await page.keyboard.press("ArrowRight");
    layouts.push(await page.evaluate(() => {
      const grid = getComputedStyle(document.querySelector(".movie-library-grid__canvas")!);
      const frame = getComputedStyle(document.querySelector(".viewport-frame")!);
      const search = getComputedStyle(document.querySelector(".y2k-library-search")!);
      return { columns: grid.gridTemplateColumns, gap: grid.gap, padding: grid.padding,
        border: frame.borderWidth, blend: frame.mixBlendMode, searchWidth: search.width, searchHeight: search.height };
    }));
    await context.close();
  }
  expect(layouts[1]).toEqual(layouts[0]);
});


test("grid follows the focused poster at its center for both desktop arrows and TV", async ({ browser }) => {
  for (const userAgent of ["Desktop browser", "ElectronTV/1.0 AFTKM"]) {
    const context = await browser.newContext({ viewport: { width: 960, height: 540 }, reducedMotion: "reduce", userAgent });
    const page = await context.newPage();
    await page.route("https://**/*", route => route.abort());
    await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
    await page.route("**/api/session", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: null, activeUsers: [], pinProtectedUsers: ["Aaron", "Electra"], usersMissingPins: [] }) }));
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cards = page.locator(".movie-library-grid__item .movie-item-details-hit-area");
    await expect(cards.first()).toBeVisible();
    const centered = async () => {
      await expect.poll(() => page.evaluate(() => {
        const item = document.activeElement?.closest(".movie-library-grid__item");
        if (!item) return Infinity;
        const box = item.getBoundingClientRect();
        const grid = item.closest(".movie-library-grid") as HTMLElement;
        const viewport = grid.getBoundingClientRect();
        return Math.max(Math.abs(box.left + box.width / 2 - viewport.left - grid.clientWidth / 2), Math.abs(box.top + box.height / 2 - viewport.top - grid.clientHeight / 2));
      })).toBeLessThan(2);
    };
    // Padding permits even the first and last card to reach the viewport center.
    await cards.first().focus();
    await centered();
    await page.keyboard.press("ArrowRight");
    await centered();
    await page.keyboard.press("ArrowDown");
    await centered();
    await cards.last().focus();
    await centered();
    await page.keyboard.press("ArrowLeft");
    await centered();
    await context.close();
  }
});
