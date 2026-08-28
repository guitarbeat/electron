import { test, expect } from "@playwright/test";

test.describe("Critical User Journey - Movies & Exploration", () => {
  test("user can browse library, view movie details, open chat dock, and search/suggest items", async ({
    page,
  }) => {
    // 1. Visit the home page
    await page.goto("/");

    // 2. Verify main heading and search input are rendered
    await expect(
      page.getByRole("heading", { name: "Movies & Places" }),
    ).toBeVisible();

    const searchInput = page.getByRole("combobox", {
      name: "Search movies, shows, and places to add",
    });
    await expect(searchInput).toBeVisible();

    // 3. Verify movie items exist on the page
    const movieCards = page.locator(".movie-item-container");
    await expect(movieCards.first()).toBeVisible();

    // 4. Click a movie's details hit area to open details modal
    const firstHitArea = page
      .locator(".movie-item-details-hit-area")
      .first();
    await firstHitArea.click({ force: true });

    // 5. Verify Movie Details dialog is opened
    const detailsDialog = page.getByRole("dialog");
    await expect(detailsDialog).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close movie details" }),
    ).toBeVisible();

    // 6. Close movie details dialog
    await page.getByRole("button", { name: "Close movie details" }).click();
    await expect(detailsDialog).toBeHidden();

    // 7. Open Chat / Messages dock via floating chat button
    const chatFab = page.getByRole("button", { name: /open chat/i });
    await expect(chatFab).toBeVisible();
    await chatFab.click();

    // Verify chat dock is opened
    const chatDock = page.locator("#floating-chat-panel");
    await expect(chatDock).toBeVisible();

    // Close chat dock
    const closeChatBtn = page.getByRole("button", { name: "Close chat" });
    await closeChatBtn.click();
    await expect(chatDock).toBeHidden();

    // 8. Test Search / Suggestion interaction
    await searchInput.fill("Interstellar");
    // Button label reflects submit action (e.g. "Suggest" or "Add" or "Recommend")
    const submitBtn = page.locator(".curved-library-search__submit");
    await expect(submitBtn).toBeVisible();
  });
});
