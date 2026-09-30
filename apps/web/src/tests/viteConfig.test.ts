import { describe, it } from "node:test";
import assert from "node:assert/strict";
import viteConfig from "../../vite.config.ts";

describe("Vite Configuration Security", () => {
  it("should explicitly disable cors and not set allowedHosts to true", () => {
    const config = typeof viteConfig === "function" ? viteConfig({ mode: "development", command: "serve" }) : viteConfig;

    // Check server CORS and allowedHosts settings
    assert.equal(config.server?.cors, false);
    assert.notEqual(config.server?.allowedHosts, true);

    // Check preview CORS and allowedHosts settings
    assert.equal(config.preview?.cors, false);
    assert.notEqual(config.preview?.allowedHosts, true);
  });
});
