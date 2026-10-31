import { test, expect } from "@playwright/test";

// Runs against the real state client (no mock-data mode), with the API stubbed,
// so it covers how the Messages panel loads from the server.
const messages = [
  { id: "m1", author: "Aaron", content: "Movie tonight?", createdAt: "2026-10-30T20:00:00.000Z" },
  { id: "m2", author: "Electra", content: "Yes, your pick", createdAt: "2026-10-30T20:01:00.000Z" },
  { id: "m3", author: "Aaron", content: "Dune it is", createdAt: "2026-10-30T20:02:00.000Z" },
];
const listScopes = new Set(["movies", "suggestions", "places", "placeSuggestions", "spinHistory"]);

test("Messages shows the saved messages as soon as the panel opens", async ({ page }) => {
  await page.route("https://**/*", route => route.abort());
  await page.route("**/api/session", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasAccess: true, currentUser: "Aaron", activeUsers: ["Aaron"], pinProtectedUsers: ["Aaron", "Electra"], usersMissingPins: [] }) }));
  let messageReads = 0;
  await page.route("**/api/state/**", route => {
    const scope = new URL(route.request().url()).pathname.split("/")[3];
    if (scope === "messages") {
      messageReads += 1;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: messages, version: "v1", degraded: false }) });
    }
    if (listScopes.has(scope)) {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: [], version: "v1", degraded: false }) });
    }
    return route.fulfill({ status: 503, body: "" });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Messages", exact: true }).click();
  const panel = page.locator("#floating-chat-panel");
  // Well under the 15s poll: the first open has to request the messages itself.
  await expect(panel.getByLabel("3 total messages")).toBeVisible({ timeout: 5000 });
  await expect(panel.locator('[aria-label^="Message from"]')).toHaveCount(3);
  await expect(panel).toContainText("Dune it is");
  await expect(panel).not.toContainText("No messages yet");
  expect(messageReads).toBeGreaterThan(0);
});
