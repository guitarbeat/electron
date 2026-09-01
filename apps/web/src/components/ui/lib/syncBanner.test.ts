import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getSyncBannerContent, shouldShowSyncBanner } from "./syncBanner.ts";

describe("syncBanner", () => {
  describe("shouldShowSyncBanner", () => {
    it("returns true when sync is blocked", () => {
      assert.equal(shouldShowSyncBanner({ isBlocked: true }), true);
    });

    it("returns false when missing database pattern is detected in label", () => {
      assert.equal(
        shouldShowSyncBanner({ label: "DATABASE_URL is not configured" }),
        false,
      );
    });

    it("returns true for generic labels", () => {
      assert.equal(
        shouldShowSyncBanner({ label: "Some random sync warning" }),
        true,
      );
    });
  });

  describe("getSyncBannerContent", () => {
    it("returns appropriate content structure for blocked status", () => {
      const content = getSyncBannerContent({ isBlocked: true });
      assert.equal(content.title, "Sync conflict");
      assert.equal(content.badge, "Action needed");
      assert.equal(content.tone, "assertive");
      assert.ok(content.recommendedAction);
      assert.ok(content.debugHints.length > 0);
      assert.ok(content.copyPayload.includes("sync conflict"));
      assert.ok(content.occurredAt);
    });

    it("returns appropriate content structure for network/offline label", () => {
      const content = getSyncBannerContent({
        label: "Could not reach the app sync API",
      });
      assert.equal(content.title, "Saved on this device");
      assert.equal(content.badge, "Offline");
      assert.equal(content.tone, "polite");
    });
  });
});
