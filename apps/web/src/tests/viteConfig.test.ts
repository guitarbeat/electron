import { describe, it } from "node:test";
import assert from "node:assert/strict";
import viteConfig from "../../vite.config.ts";

describe("Vite Configuration Security & React Singleton Resolution", () => {
  it("should explicitly disable cors and enforce allowedHosts for custom studio domains", () => {
    const config = typeof viteConfig === "function" ? viteConfig({ mode: "development", command: "serve" }) : viteConfig;

    // Check server CORS and allowedHosts settings
    assert.equal(config.server?.cors, false);
    assert.equal(config.server?.allowedHosts, true);

    // Check preview CORS and allowedHosts settings
    assert.equal(config.preview?.cors, false);
    assert.equal(config.preview?.allowedHosts, true);
  });

  it("should enforce singleton React deduplication, aliases, and es2020 compatibility target", () => {
    const config = typeof viteConfig === "function" ? viteConfig({ mode: "development", command: "serve" }) : viteConfig;

    assert.ok(Array.isArray(config.resolve?.dedupe));
    assert.ok(config.resolve?.dedupe.includes("react"));
    assert.ok(config.resolve?.dedupe.includes("react-dom"));
    assert.ok(config.resolve?.dedupe.includes("react/jsx-runtime"));
    assert.equal(config.optimizeDeps?.ignoreOutdatedRequests, true);
    assert.ok(config.optimizeDeps?.include?.includes("@total-typescript/ts-reset"));
    assert.ok(config.optimizeDeps?.needsInterop?.includes("@total-typescript/ts-reset"));
    assert.equal(config.build?.target, "es2020");

    const aliases = config.resolve?.alias as Record<string, string>;
    assert.ok(aliases?.react);
    assert.ok(aliases?.["react-dom"]);
  });
});
