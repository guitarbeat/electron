import { test, expect, type Page } from "@playwright/test";

const activeInside = (page: Page, selector: string) =>
  page.evaluate((s) => !!document.activeElement?.closest(s), selector);

test.describe("desktop arrow-key navigation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => {
    await page.route("https://**/*", route => route.abort());
    await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
    await page.route("**/api/session", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: "Aaron", activeUsers: ["Aaron"], pinProtectedUsers: ["Aaron", "Electra"], usersMissingPins: [] }) }));
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).not.toHaveClass(/is-tv-runtime/);
    await expect(page.locator(".movie-library-grid .movie-item-details-hit-area").first()).toBeVisible();
  });

  test("arrows start on the wall, move across cards, and reach the notches", async ({ page }) => {
    // Nothing is focused after load; the first arrow lands on the wall instead of <body>.
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => activeInside(page, ".movie-library-grid")).toBe(true);
    const itemIndex = () => page.evaluate(() => {
      const item = document.activeElement?.closest(".movie-library-grid__item");
      return item ? [...item.parentElement!.children].indexOf(item) : -1;
    });
    const first = await itemIndex();
    await page.keyboard.press("ArrowRight");
    await expect.poll(itemIndex).toBe(first + 1);
    const search = page.getByRole("button", { name: "Search movies (/)", exact: true });
    await search.focus();
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => activeInside(page, ".movie-library-grid")).toBe(true);
  });

  test("Settings menu traps arrows and Escape or Backspace returns to its notch", async ({ page }) => {
    const settings = page.getByRole("button", { name: "Settings", exact: true });
    await settings.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("dialog", { name: "Settings", exact: true });
    await expect(menu).toBeVisible();
    await expect.poll(() => activeInside(page, '[role="dialog"]')).toBe(true);
    await menu.getByRole("button", { name: /Queue:/ }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(menu.getByRole("button", { name: /Watching:/ })).toBeFocused();
    for (const key of ["ArrowDown", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
      await page.keyboard.press(key);
      await expect.poll(() => activeInside(page, '[role="dialog"]')).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(settings).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Backspace");
    await expect(menu).not.toBeVisible();
    await expect(settings).toBeFocused();
  });

  test("chat opens from the keyboard, keeps arrows inside, and closes back to its button", async ({ page }) => {
    const chat = page.getByRole("button", { name: "Messages", exact: true });
    await chat.focus();
    await page.keyboard.press("Enter");
    const dock = page.locator("#floating-chat-panel");
    await expect(dock).toBeVisible();
    await expect.poll(() => activeInside(page, "#floating-chat-panel")).toBe(true);
    await dock.getByRole("button").first().focus();
    for (const key of ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"]) {
      await page.keyboard.press(key);
      await expect.poll(() => activeInside(page, "#floating-chat-panel")).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dock).not.toBeVisible();
    await expect(chat).toBeFocused();
  });

  test("movie details open from a card, keep arrows inside, and Escape returns to the card", async ({ page }) => {
    const card = page.locator(".movie-library-grid [data-movie-id] .movie-item-details-hit-area").first();
    await card.focus();
    const id = await page.evaluate(() => document.activeElement?.closest("[data-movie-id]")?.getAttribute("data-movie-id"));
    await page.keyboard.press("Enter");
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').last();
    await expect(dialog).toBeVisible();
    for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
      await page.keyboard.press(key);
      await expect.poll(() => activeInside(page, '[role="dialog"][aria-modal="true"]')).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest("[data-movie-id]")?.getAttribute("data-movie-id"))).toBe(id);
  });

  test("the book opens on Watch on Stremio, arrows walk rows and turn pages, and everything fits", async ({ page }) => {
    await page.locator(".movie-library-grid [data-movie-id] .movie-item-details-hit-area").first().click();
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').last();
    const stremio = dialog.locator('[data-book-row="actions"] a.stremio-btn');
    await expect(stremio).toBeFocused();
    // Neither page of the spread needs scrolling.
    for (const fit of await page.locator(".book-page").evaluateAll(pages => pages.map(page => page.scrollHeight <= page.clientHeight + 1))) expect(fit).toBe(true);
    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByRole("button", { name: "Edit" })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(stremio).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect.poll(() => activeInside(page, '[data-book-row="people"]')).toBe(true);
    await page.keyboard.press("ArrowDown");
    await expect(stremio).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => activeInside(page, '[data-book-row="nav"]')).toBe(true);
    await page.keyboard.press("ArrowUp");
    await expect.poll(() => activeInside(page, '[data-book-row="actions"]')).toBe(true);
    await stremio.focus();
    // Past the start of a row the page turns back to the cover.
    await page.keyboard.press("ArrowLeft");
    const detailsTab = dialog.getByRole("button", { name: "Details", exact: true });
    await expect(detailsTab).toBeFocused();
    await expect(dialog.getByRole("button", { name: "Cover", exact: true })).toHaveAttribute("aria-current", "page");
    // The cover stays put; the book only auto-opens once when shown.
    await page.waitForTimeout(400);
    await expect(dialog.getByRole("button", { name: "Cover", exact: true })).toHaveAttribute("aria-current", "page");
    await page.keyboard.press("ArrowRight");
    await expect(detailsTab).toHaveAttribute("aria-current", "page");
    await expect(stremio).toBeFocused();
    await expect(dialog.getByRole("button", { name: /Next page|Previous page/ })).toHaveCount(0);
  });

  test("arrows edit text inside fields", async ({ page }) => {
    await page.getByRole("button", { name: "Search movies (/)", exact: true }).focus();
    await page.keyboard.press("Enter");
    const input = page.getByRole("searchbox", { name: "Search your watchlist" });
    await expect(input).toBeFocused();
    await input.fill("Dune");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(input).toBeFocused();
    expect(await input.evaluate((field: HTMLInputElement) => field.selectionStart)).toBe(2);
    await page.keyboard.press("Backspace");
    await expect(input).toHaveValue("Dne");
  });
});
