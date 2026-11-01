import { test, expect, type Page } from "@playwright/test";

async function openWall(page: Page) {
  await page.route("https://**/*", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
  await page.route("**/api/session", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: "Aaron", activeUsers: ["Aaron"], pinProtectedUsers: [], usersMissingPins: [] }) }));
  await page.goto("/#movies", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".movie-library-grid .movie-item-details-hit-area").first()).toBeVisible();
}

const edges = (page: Page) => page.evaluate(() => {
  const read = (selector: string) => {
    const element = document.querySelector(selector)!;
    const before = getComputedStyle(element, "::before");
    return { height: element.getBoundingClientRect().height, blur: before.backdropFilter, background: before.backgroundColor, image: before.backgroundImage, after: getComputedStyle(element, "::after").content };
  };
  const frame = getComputedStyle(document.querySelector(".viewport-frame")!);
  return {
    top: read(".vignette-top"),
    bottom: read(".vignette-bottom"),
    topEdge: parseFloat(frame.borderTopWidth),
    bottomEdge: parseFloat(frame.borderBottomWidth),
    workspaceBand: getComputedStyle(document.querySelector(".library-workspace")!, "::before").content,
    wallMask: getComputedStyle(document.querySelector(".movies-wall-container")!).maskSize,
  };
});

for (const size of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test.describe(`${size.width}x${size.height}`, () => {
    test.use({ viewport: size, ...(size.width < 600 ? { hasTouch: true, isMobile: true } : {}) });

    test("the top edge fades like the bottom, with no dark frosted band", async ({ page }) => {
      await openWall(page);
      const e = await edges(page);
      expect(e.top.blur).toBe(e.bottom.blur);
      expect(e.top.image).toBe("none");
      expect(e.top.after).toBe("none");
      expect(e.workspaceBand).toBe("none");
      // The fade reaches the same distance past each frame edge.
      expect(Math.abs((e.top.height - e.topEdge) - (e.bottom.height - e.bottomEdge))).toBeLessThanOrEqual(1);
      // Posters run up between the top notches instead of stopping at a cropped band.
      expect(e.wallMask.startsWith("100% 100%")).toBe(true);
    });
  });
}

test.describe("TV", () => {
  test.use({ viewport: { width: 960, height: 540 }, userAgent: "Mozilla/5.0 (Linux; Android 11; AFTKM) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 ElectronTV/1.0 (AFTKM)" });

  test("edges use a tinted fade without backdrop blur", async ({ page }) => {
    await openWall(page);
    const e = await edges(page);
    for (const edge of [e.top, e.bottom]) {
      expect(edge.blur).toBe("none");
      expect(edge.background).not.toBe("rgba(0, 0, 0, 0)");
    }
  });
});
