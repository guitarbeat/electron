import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getGenreLook } from "./settingsFun";

describe("getGenreLook", () => {
  it("gives known genres their own icon and colour, case-insensitively", () => {
    assert.deepStrictEqual(getGenreLook("Sci-Fi"), { emoji: "🚀", hue: 200 });
    assert.deepStrictEqual(getGenreLook("  horror "), getGenreLook("Horror"));
    assert.notStrictEqual(getGenreLook("Action").hue, getGenreLook("Drama").hue);
  });

  it("gives unknown genres a stable hue from their name", () => {
    const first = getGenreLook("Kaiju");
    assert.strictEqual(first.emoji, "🎬");
    assert.deepStrictEqual(getGenreLook("kaiju"), first);
    assert.ok(first.hue >= 0 && first.hue < 360);
  });
});
