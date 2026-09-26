import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FrameEffect, ViewportFrame } from "./FrameEffect.tsx";

describe("FrameEffect & ViewportFrame", () => {
  it("renders viewport frame overlay with default attributes", () => {
    const html = renderToStaticMarkup(React.createElement(FrameEffect));

    assert.ok(
      html.includes('class="viewport-frame"'),
      "HTML output should include viewport-frame class",
    );
    assert.ok(
      html.includes('aria-hidden="true"'),
      "HTML output should be marked as aria-hidden for accessibility",
    );
    assert.ok(
      html.includes('data-testid="viewport-frame"'),
      "HTML output should have testid for test selectors",
    );
  });

  it("renders with custom borderWidth, color, borderRadius, and zIndex overrides", () => {
    const html = renderToStaticMarkup(
      React.createElement(FrameEffect, {
        borderWidth: "10px",
        color: "#ff7da8",
        borderRadius: "24px",
        zIndex: 95,
      }),
    );

    assert.ok(
      html.includes("--frame-border-width:10px"),
      "HTML output should include custom border width style property",
    );
    assert.ok(
      html.includes("--frame-color:#ff7da8"),
      "HTML output should include custom color style property",
    );
    assert.ok(
      html.includes("--frame-border-radius:24px"),
      "HTML output should include custom border radius style property",
    );
    assert.ok(
      html.includes("--z-index-frame:95"),
      "HTML output should include custom z-index style property",
    );
  });

  it("renders children wrapped inside content wrapper when children are provided", () => {
    const childText = "Hello from framed content";
    const html = renderToStaticMarkup(
      React.createElement(
        FrameEffect,
        null,
        React.createElement("div", { id: "child-node" }, childText),
      ),
    );

    assert.ok(
      html.includes('class="frame-effect-root"'),
      "HTML output should contain frame-effect-root container",
    );
    assert.ok(
      html.includes('class="frame-effect-content"'),
      "HTML output should contain frame-effect-content wrapper",
    );
    assert.ok(
      html.includes('id="child-node"'),
      "HTML output should contain child node",
    );
    assert.ok(
      html.includes(childText),
      "HTML output should contain child text",
    );
    assert.ok(
      html.includes('class="viewport-frame"'),
      "HTML output should still include the viewport frame element",
    );
  });

  it("ViewportFrame alias behaves identically to FrameEffect", () => {
    const htmlAlias = renderToStaticMarkup(React.createElement(ViewportFrame));
    const htmlOriginal = renderToStaticMarkup(React.createElement(FrameEffect));

    assert.strictEqual(
      htmlAlias,
      htmlOriginal,
      "ViewportFrame should produce identical static markup to FrameEffect",
    );
  });
});
