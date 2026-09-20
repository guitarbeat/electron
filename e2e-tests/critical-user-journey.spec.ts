import { test, expect } from "@playwright/test";

test.describe("Critical User Journey - Movies & Exploration", () => {
  test("user can browse the library, view movie details, and search for suggestions", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("useMockData", "true");
    });
    await page.route("**/api/session", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          hasAccess: true,
          currentUser: "Aaron",
          activeUsers: ["Aaron"],
          pinProtectedUsers: ["Aaron", "Electra"],
          usersMissingPins: [],
        }),
      });
    });

    // 1. Visit the home page
    await page.goto("/");

    // 2. Verify main heading and search input are rendered
    await expect(
      page.getByRole("heading", { name: "Movies & Places", level: 2 }),
    ).toBeVisible();

    const searchInput = page.getByRole("combobox", {
      name: "Search movies, shows, and places to add",
    });
    await expect(searchInput).toBeVisible();

    // 3. Verify movie items exist on the page
    const movieCards = page.locator(".movie-item-container");
    await expect(movieCards.first()).toBeVisible();

    // 4. Open a known movie rather than a pending suggestion card.
    await page
      .getByRole("button", {
        name: 'View details for "Everything Everywhere All at Once"',
      })
      .click({ force: true });

    // 5. Verify Movie Details dialog is opened
    const detailsDialog = page.getByRole("dialog");
    await expect(detailsDialog).toBeVisible();
    await expect(
      detailsDialog.getByRole("button", {
        name: "Page 1 of 2 (turned)",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    const closeDetailsButton = page.getByRole("button", {
      name: "Close details",
      exact: true,
    });
    await expect(closeDetailsButton).toBeVisible();

    // 6. Close movie details dialog
    await closeDetailsButton.click();
    await expect(detailsDialog).toBeHidden();

    // 7. Test Search / Suggestion interaction
    await searchInput.fill("Interstellar");
    const submitBtn = page.getByRole("button", { name: "Recommend" });
    await expect(submitBtn).toBeVisible();
  });
});
