import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ELECTRON_MARK_VARIANT,
  ELECTRON_MARK_META,
  ELECTRON_MARK_VARIANTS,
  getElectronMarkDataUri,
  getElectronMarkSvgMarkup,
  isElectronMarkVariant,
} from "./ElectronMarkData.ts";

test("electron marks expose the planned five variants", () => {
  assert.deepEqual(ELECTRON_MARK_VARIANTS, [
    "pulse-ae",
    "orbit-e",
    "orbit-a",
    "static-gem",
    "split-spark",
  ]);
  assert.equal(DEFAULT_ELECTRON_MARK_VARIANT, "pulse-ae");
  assert.equal(ELECTRON_MARK_META["pulse-ae"].recommended, true);
});

test("electron mark svg markup renders accessible color output", () => {
  const markup = getElectronMarkSvgMarkup("orbit-e", { title: "Orbit E" });

  assert.match(markup, /^<svg/);
  assert.match(markup, /role="img"/);
  assert.match(markup, /Orbit E/);
  assert.match(markup, /linearGradient/);
});

test("electron mark svg markup supports monochrome output without gradients", () => {
  const markup = getElectronMarkSvgMarkup("static-gem", {
    monochrome: true,
    palette: { mono: "#111111" },
  });

  assert.ok(!markup.includes("linearGradient"));
  assert.ok(markup.includes("#111111"));
});

test("electron mark data uri wraps encoded svg markup", () => {
  const dataUri = getElectronMarkDataUri("split-spark", {
    title: "Split Spark",
  });

  assert.match(dataUri, /^data:image\/svg\+xml;charset=UTF-8,/);
  assert.ok(dataUri.includes(encodeURIComponent("Split Spark")));
});

test("isElectronMarkVariant correctly identifies valid and invalid variants", () => {
  assert.equal(isElectronMarkVariant("pulse-ae"), true);
  assert.equal(isElectronMarkVariant("orbit-e"), true);
  assert.equal(isElectronMarkVariant("orbit-a"), true);
  assert.equal(isElectronMarkVariant("static-gem"), true);
  assert.equal(isElectronMarkVariant("split-spark"), true);
  assert.equal(isElectronMarkVariant("invalid-variant"), false);
  assert.equal(isElectronMarkVariant(null), false);
  assert.equal(isElectronMarkVariant(undefined), false);
});

test("getElectronMarkSvgMarkup handles numeric size correctly", () => {
  const markup = getElectronMarkSvgMarkup("orbit-e", { size: 128 });
  assert.match(markup, /width="128"/);
  assert.match(markup, /height="128"/);
});

test("getElectronMarkSvgMarkup renders pulse-ae variant", () => {
  const markup = getElectronMarkSvgMarkup("pulse-ae");
  assert.match(markup, /M21 16V48/); // path from pulse-ae
});

test("getElectronMarkSvgMarkup renders orbit-a variant", () => {
  const markup = getElectronMarkSvgMarkup("orbit-a");
  assert.match(markup, /M22 45\.5L32 19L42 45\.5/); // path from orbit-a
});

test("getElectronMarkSvgMarkup handles invalid variant gracefully", () => {
  const markup = getElectronMarkSvgMarkup("invalid-variant" as never);
  assert.match(markup, /M21 16V48/); // defaults to pulse-ae path
});

test("buildVariantMarkup handles missing variants", () => {
  const markupOrbitE = getElectronMarkSvgMarkup("orbit-e");
  assert.match(markupOrbitE, /M41\.5 13\.5C49\.8/); // path from orbit-e

  const markupStaticGem = getElectronMarkSvgMarkup("static-gem");
  assert.match(markupStaticGem, /M32 7\.5L49\.5 18\.5/); // path from static-gem

  const markupSplitSpark = getElectronMarkSvgMarkup("split-spark");
  assert.match(markupSplitSpark, /M18 19H46/); // path from split-spark
});

test("getElectronMarkSvgMarkup handles idPrefix and title options", () => {
  const markup = getElectronMarkSvgMarkup("pulse-ae", {
    idPrefix: "custom-prefix",
    title: "Custom Title",
  });

  assert.match(markup, /id="custom-prefix-primary"/);
  assert.match(markup, /id="custom-prefix-secondary"/);
  assert.match(markup, /id="custom-prefix-glow"/);
  assert.match(markup, /id="custom-prefix-title"/);
  assert.match(markup, /aria-labelledby="custom-prefix-title"/);
  assert.match(markup, /<title id="custom-prefix-title">Custom Title<\/title>/);
});

test("getElectronMarkSvgMarkup escapes XML entities in strings correctly", () => {
  const markup = getElectronMarkSvgMarkup("pulse-ae", {
    title: "Title <&>\"'",
    idPrefix: "prefix-<&>\"'",
    palette: {
      accent: "<&>\"'",
      accentLight: "<&>\"'",
      secondary: "<&>\"'",
      tertiary: "<&>\"'",
      highlight: "<&>\"'",
      shadow: "<&>\"'",
      mono: "<&>\"'",
    },
  });

  assert.match(markup, /Title &lt;&amp;&gt;&quot;&apos;/);
  assert.match(markup, /prefix-&lt;&amp;&gt;&quot;&apos;-title/);
  // Using assert.ok instead of match for multiple occurrences
  assert.ok(markup.includes('stop-color="&lt;&amp;&gt;&quot;&apos;"'));
});

test("getElectronMarkSvgMarkup handles string size correctly", () => {
  const markup = getElectronMarkSvgMarkup("pulse-ae", { size: "100%" });
  assert.match(markup, /width="100%"/);
  assert.match(markup, /height="100%"/);
});

test("getElectronMarkSvgMarkup handles missing size correctly", () => {
  const markup = getElectronMarkSvgMarkup("pulse-ae");
  assert.match(markup, /width="64"/);
  assert.match(markup, /height="64"/);
});
