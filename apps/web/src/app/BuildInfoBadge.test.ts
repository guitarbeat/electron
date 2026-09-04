import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BuildInfoBadge } from "./BuildInfoBadge.tsx";

describe("BuildInfoBadge", () => {
  it("renders build info text and disappears on single click", () => {
    let dismissed = false;
    const badge = new BuildInfoBadge({
      onDismiss: () => {
        dismissed = true;
      },
    });

    // Mock setState to synchronously update state during unit test execution
    badge.setState = (updater) => {
      const nextState =
        typeof updater === "function"
          ? updater(badge.state, badge.props)
          : updater;
      badge.state = { ...badge.state, ...nextState };
    };

    // 1. Confirm initial render state
    assert.strictEqual(
      badge.state.isVisible,
      true,
      "Badge should initially be visible",
    );
    const initialElement = badge.render();
    assert.ok(
      initialElement !== null,
      "Badge element should not be null initially",
    );
    assert.strictEqual(
      initialElement.props.children,
      "v0.1 · AI Studio test",
      "Badge should render the exact build info text",
    );

    // 2. Confirm static HTML rendering contains the badge text and element id
    const html = renderToStaticMarkup(React.createElement(BuildInfoBadge));
    assert.ok(
      html.includes("v0.1 · AI Studio test"),
      "HTML output contains build info text",
    );
    assert.ok(
      html.includes("build-info-badge"),
      "HTML output contains build info badge id",
    );

    // 3. Simulate click to dismiss
    assert.strictEqual(typeof initialElement.props.onClick, "function");
    initialElement.props.onClick({
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as React.MouseEvent);

    // 4. Confirm badge disappears on click
    assert.strictEqual(
      badge.state.isVisible,
      false,
      "Badge visibility state should be false after click",
    );
    assert.strictEqual(dismissed, true, "onDismiss callback should be invoked");
    const dismissedElement = badge.render();
    assert.strictEqual(
      dismissedElement,
      null,
      "Badge element should be null (disappear) after click",
    );
  });
});
