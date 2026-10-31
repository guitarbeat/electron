import { test, expect, type Page } from "@playwright/test";

const TV_UA = "Mozilla/5.0 (Linux; Android 11; AFTKM) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 ElectronTV/1.0";

// Every segmented control stays on one row, and its sliding pill covers exactly the chosen option.
async function readSegments(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll<HTMLElement>(".movie-wall-filters__panel .settings-menu__seg")]
    .filter((group) => group.getBoundingClientRect().width > 0)
    .map((group) => {
      const options = [...group.querySelectorAll<HTMLElement>(".settings-menu__opt")];
      const active = group.querySelector<HTMLElement>('[data-segment-active="true"]');
      const pill = group.querySelector<HTMLElement>(".settings-menu__pill");
      const box = (element: Element | null) => {
        if (!element) return null;
        const { left, top, width, height } = element.getBoundingClientRect();
        return { left, top, width, height };
      };
      const groupBox = group.getBoundingClientRect();
      const panelBox = group.closest(".movie-wall-filters__panel")!.getBoundingClientRect();
      return {
        label: group.getAttribute("aria-label"),
        tops: options.map((option) => Math.round(option.getBoundingClientRect().top)),
        overflows: group.scrollWidth > group.clientWidth + 1 || groupBox.right > panelBox.right + 1,
        active: box(active),
        pill: pill && active && getComputedStyle(pill).opacity !== "0" ? box(pill) : null,
      };
    }));
}

async function expectTidySegments(page: Page) {
  await expect.poll(async () => {
    const problems: string[] = [];
    for (const segment of await readSegments(page)) {
      if (new Set(segment.tops).size > 1) problems.push(`${segment.label} wraps (${segment.tops})`);
      if (segment.overflows) problems.push(`${segment.label} overflows the sheet`);
      if (segment.active && segment.pill) {
        const { active, pill } = segment;
        const off = Math.max(Math.abs(active.left - pill.left), Math.abs(active.top - pill.top), Math.abs(active.width - pill.width), Math.abs(active.height - pill.height));
        if (off > 1.5) problems.push(`${segment.label} pill is ${off.toFixed(1)}px off its option`);
      }
    }
    return problems;
  }, { timeout: 3000 }).toEqual([]);
}

const viewports = [
  { name: "desktop 1280x800", viewport: { width: 1280, height: 800 } },
  { name: "laptop 1024x640", viewport: { width: 1024, height: 640 } },
  { name: "phone 390x844", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: "Fire TV 960x540", viewport: { width: 960, height: 540 }, userAgent: TV_UA },
];

for (const { name, ...use } of viewports) {
  test.describe(`Settings segments on ${name}`, () => {
    test.use(use);
    test("never wrap, and the pill matches the chosen option", async ({ page }) => {
      await page.route("https://**/*", (route) => route.abort());
      await page.addInitScript(() => localStorage.setItem("useMockData", "true"));
      await page.route("**/api/session", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: "Aaron", activeUsers: ["Aaron"], pinProtectedUsers: ["Aaron", "Electra"], usersMissingPins: [] }) }));
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator(".movie-library-grid .movie-item-details-hit-area").first()).toBeVisible();
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      const panel = page.locator(".movie-wall-filters__panel");
      await expect(panel).toBeVisible();
      await expectTidySegments(page);

      // The last Sort option is the one that used to drop under the pill.
      const sort = panel.getByRole("radiogroup", { name: "Sort by" });
      const last = sort.getByRole("radio").last();
      await last.scrollIntoViewIfNeeded();
      await last.click();
      await expect(last).toHaveAttribute("aria-checked", "true");
      await expectTidySegments(page);
    });
  });
}
