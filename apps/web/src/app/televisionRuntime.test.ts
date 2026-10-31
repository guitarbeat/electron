import assert from "node:assert/strict";
import { test } from "node:test";
import { isTelevisionRuntime } from "./televisionRuntime.ts";

const DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

test("Fire TV shell and television browsers opt into the 10-foot runtime", () => {
  assert.equal(
    isTelevisionRuntime(
      "Mozilla/5.0 (Linux; Android 11; AFTKM) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 ElectronTV/1.0",
    ),
    true,
  );
  assert.equal(isTelevisionRuntime("Mozilla/5.0 (Linux; Android 9; AFTSSS) Silk/120"), true);
  assert.equal(isTelevisionRuntime("Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0)"), true);
  assert.equal(isTelevisionRuntime(DESKTOP, "?tv=1"), true);
});

test("ordinary desktop browsers stay on the pointer layout", () => {
  assert.equal(isTelevisionRuntime(DESKTOP), false);
  assert.equal(isTelevisionRuntime(`${DESKTOP} Stremio`), false);
  assert.equal(isTelevisionRuntime(DESKTOP, "?tv=0"), false);
});
