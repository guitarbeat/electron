import { test, expect, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.route("https://**/*", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
  await page.route("**/api/session", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: "Aaron", activeUsers: ["Aaron"], pinProtectedUsers: ["Aaron", "Electra"], usersMissingPins: [] }) }));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".movie-library-grid .movie-item-details-hit-area").first()).toBeVisible();
}

const notchBox = (page: Page, name: string) =>
  page.locator(`.dyn-notch[data-notch="${name}"]`).evaluate((element) => {
    const { width, height } = element.getBoundingClientRect();
    return { width: Math.round(width), height: Math.round(height) };
  });

test.describe("dynamic notches", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("Settings grows out of its corner notch, stays in the viewport, and only one notch is open", async ({ page }) => {
    await open(page);
    const collapsed = await notchBox(page, "settings");
    const trigger = page.getByRole("button", { name: "Settings", exact: true });
    await trigger.click();
    const panel = page.locator('[data-notch-panel="settings"]');
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    // The notch body itself is what grows: up and to the right from the bottom-left corner.
    await expect.poll(async () => (await notchBox(page, "settings")).height).toBeGreaterThan(collapsed.height + 200);
    const grown = await notchBox(page, "settings");
    expect(grown.width).toBeGreaterThan(collapsed.width + 200);
    // The panel sits inside the notch body, flush with it, and fits on screen.
    const fit = await panel.evaluate((element) => {
      const panelBox = element.getBoundingClientRect();
      const notch = document.querySelector('.dyn-notch[data-notch="settings"]')!.getBoundingClientRect();
      return { top: panelBox.top >= 0, insideLeft: panelBox.left >= notch.left - 1, insideRight: panelBox.right <= notch.right + 1, insideTop: panelBox.top >= notch.top - 1 };
    });
    expect(fit).toEqual({ top: true, insideLeft: true, insideRight: true, insideTop: true });

    // Opening another notch collapses Settings.
    await page.getByRole("button", { name: /^Add a movie or show/ }).click();
    await expect(panel).toBeHidden();
    await expect(page.locator(".y2k-add-form")).toHaveClass(/is-expanded/);
  });

  test("Down opens a bottom notch from the keyboard and Escape returns focus to it", async ({ page }) => {
    await open(page);
    const trigger = page.getByRole("button", { name: "Settings", exact: true });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    const panel = page.locator('[data-notch-panel="settings"]');
    await expect(panel).toBeVisible();
    await expect.poll(() => panel.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    // Focus stays inside the open notch.
    for (let step = 0; step < 12; step++) await page.keyboard.press("Tab");
    expect(await panel.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("the Search island is one rounded field with a soft focus ring and the shortcut keycap inside", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Search movies (/)" }).click();
    const field = page.locator(".y2k-library-search .y2k-symbol-control__field");
    await expect(field).toBeVisible();
    const look = await field.evaluate((element) => {
      const input = element.querySelector("input")!;
      const kbd = element.querySelector("kbd");
      const box = element.getBoundingClientRect();
      const art = document.querySelector(".y2k-library-search .frame-command-art")!.getBoundingClientRect();
      const kbdBox = kbd?.getBoundingClientRect();
      return {
        rounded: parseFloat(getComputedStyle(element).borderTopLeftRadius) >= box.height / 2 - 1,
        inputOutline: getComputedStyle(input).outlineStyle,
        glow: getComputedStyle(element).boxShadow !== "none",
        artInside: art.left >= box.left && art.right <= box.right && art.top >= box.top - 1 && art.bottom <= box.bottom + 1,
        kbdInside: Boolean(kbdBox && kbdBox.right <= box.right && kbdBox.left >= box.left),
        underline: getComputedStyle(document.querySelector(".y2k-library-search")!).boxShadow,
      };
    });
    expect(look).toEqual({ rounded: true, inputOutline: "none", glow: true, artInside: true, kbdInside: true, underline: "none" });
    // The field takes focus once the island has expanded; typing earlier is lost on slow runners.
    await expect(field.locator("input")).toBeFocused();
    await page.keyboard.type("ma");
    await expect(page.locator(".dyn-notch-hint")).toContainText("of 5 titles match");
    await page.keyboard.press("Escape");
    await expect(page.locator(".y2k-library-search")).not.toHaveClass(/is-expanded/);
  });
});
