import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { resolveApiModulePath } from "../../devServerlessRuntime.ts";

const rootApi = path.resolve(import.meta.dirname, "../../../../api");

test("local serverless runtime resolves canonical static routes", () => {
  assert.equal(
    resolveApiModulePath("/api/health"),
    path.join(rootApi, "health.ts"),
  );
  assert.equal(
    resolveApiModulePath("/api/session/profile"),
    path.join(rootApi, "session/profile.ts"),
  );
});

test("local serverless runtime resolves canonical dynamic routes", () => {
  assert.equal(
    resolveApiModulePath("/api/state/movies"),
    path.join(rootApi, "state/[scope].ts"),
  );
  assert.equal(
    resolveApiModulePath("/api/state/movies/mutate"),
    path.join(rootApi, "state/[scope]/mutate.ts"),
  );
  assert.equal(
    resolveApiModulePath("/api/agent/v1/openapi.json"),
    path.join(rootApi, "agent.ts"),
  );
});
