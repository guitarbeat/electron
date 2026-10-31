import assert from "node:assert/strict";
import { test } from "node:test";
import { canPlayXmbCue, readXmbSoundsEnabled, XMB_CURSOR_THROTTLE_MS } from "./xmbAudio.ts";

const gate = {
  enabled: true,
  hidden: false,
  userActivated: true,
  repeat: false,
  cue: "cursor" as const,
  now: 1_000,
  lastAt: 0,
};

test("television defaults menu sounds on, and the web site stays quiet until chosen", () => {
  assert.equal(readXmbSoundsEnabled(true, null), true);
  assert.equal(readXmbSoundsEnabled(false, null), false);
  assert.equal(readXmbSoundsEnabled(false, "on"), true);
  assert.equal(readXmbSoundsEnabled(true, "off"), false);
});

test("programmatic focus and a hidden or disabled player stay silent", () => {
  assert.equal(canPlayXmbCue({ ...gate, userActivated: false }), false);
  assert.equal(canPlayXmbCue({ ...gate, hidden: true }), false);
  assert.equal(canPlayXmbCue({ ...gate, enabled: false }), false);
});

test("a held direction ticks instead of stacking, and a held select does not repeat", () => {
  assert.equal(canPlayXmbCue({ ...gate, repeat: true, lastAt: gate.now - XMB_CURSOR_THROTTLE_MS }), true);
  assert.equal(canPlayXmbCue({ ...gate, repeat: true, lastAt: gate.now - 10 }), false);
  assert.equal(canPlayXmbCue({ ...gate, cue: "confirm", repeat: true }), false);
  assert.equal(canPlayXmbCue({ ...gate, cue: "cancel", repeat: true }), false);
});
