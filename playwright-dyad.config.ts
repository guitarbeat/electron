import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.DYAD_TEST_BASE_URL;

export default defineConfig({
  testDir: "./e2e-tests",
  outputDir: "./e2e-tests/.results/artifacts",
  workers: 1,
  fullyParallel: false,
  reporter: [["json", { outputFile: "e2e-tests/.results/results.json" }]],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
      },
  use: {
    baseURL: externalBaseUrl || "http://127.0.0.1:3000",
    channel: process.env.CI ? undefined : "chrome",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
