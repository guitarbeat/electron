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
    await page.route("**/api/omdb**", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.has("s")) {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            Search: [
              {
                Title: "Flow State Test",
                Year: "2026",
                imdbID: "tt-flow-state-test",
                Type: "movie",
                Poster: "N/A",
              },
            ],
            Response: "True",
          }),
        });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ Response: "False", Error: "Movie not found!" }),
      });
    });
    await page.route("**/api/tvmaze**", async (route) => {
      await route.fulfill({ contentType: "application/json", body: "[]" });
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
    await expect(page.locator(".drift-wall--modal-open")).toHaveCSS(
      "filter",
      "blur(5px) brightness(0.68) saturate(0.78)",
    );
    await expect(
      detailsDialog.locator(".movie-details-modal__backdrop"),
    ).toHaveCSS("backdrop-filter", "blur(2px)");
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

    // 6. Clicking empty wall space closes the selected movie.
    const wall = page.locator(".movies-wall-container");
    const wallBounds = await wall.boundingBox();
    expect(wallBounds).not.toBeNull();
    await page.mouse.click(
      (wallBounds?.x ?? 0) + 12,
      (wallBounds?.y ?? 0) + (wallBounds?.height ?? 0) - 12,
    );
    await expect(detailsDialog).toBeHidden();

    // 7. Choosing a catalog result stages it without mutating shared state.
    await searchInput.fill("Flow State");
    const catalogResult = page.getByRole("option", {
      name: /Flow State Test.*Movie.*2026/i,
    });
    await expect(catalogResult).toBeVisible();
    await catalogResult.click();
    await expect(page.getByText("Selected Flow State Test")).toBeVisible();
    await expect(
      page.getByRole("button", { name: 'View details for "Flow State Test"' }),
    ).toHaveCount(0);

    // 8. The explicit add action saves and reveals the new title as an open book.
    await page.getByRole("button", { name: "Add movie" }).click();
    const addedDetails = page.getByRole("dialog");
    await expect(addedDetails).toBeVisible();
    await expect(
      addedDetails.getByRole("heading", { name: "Flow State Test" }),
    ).toBeVisible();
    await addedDetails
      .getByRole("button", { name: "Close details", exact: true })
      .click();

    // 9. Creation is reversible from the success toast.
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(
      page.getByRole("button", { name: 'View details for "Flow State Test"' }),
    ).toHaveCount(0);
  });
});
