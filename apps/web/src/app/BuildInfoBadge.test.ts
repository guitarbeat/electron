import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BuildInfoBadge } from "./BuildInfoBadge.tsx";
import { isDevelopmentDeployment } from "./buildInfoDeployment.ts";

describe("BuildInfoBadge", () => {
  it("renders build info text and disappears on single click", () => {
    let dismissed = false;
    const badge = new BuildInfoBadge({
      isDevelopment: true,
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
    const html = renderToStaticMarkup(
      React.createElement(BuildInfoBadge, { isDevelopment: true }),
    );
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

  it("does not render when isDevelopment is false (non-development deployment)", () => {
    const badge = new BuildInfoBadge({
      isDevelopment: false,
    });

    assert.strictEqual(
      badge.state.isVisible,
      false,
      "Badge should not be visible when isDevelopment is false",
    );
    assert.strictEqual(
      badge.render(),
      null,
      "Badge render should return null for non-development deployments",
    );

    const html = renderToStaticMarkup(
      React.createElement(BuildInfoBadge, { isDevelopment: false }),
    );
    assert.strictEqual(
      html,
      "",
      "HTML output should be empty string when isDevelopment is false",
    );
  });

  describe("isDevelopmentDeployment", () => {
    it("identifies localhost and local IPs as development deployments", () => {
      assert.strictEqual(
        isDevelopmentDeployment(
          { hostname: "localhost" },
          { DEV: false, NODE_ENV: "production" },
        ),
        true,
      );
      assert.strictEqual(
        isDevelopmentDeployment(
          { hostname: "127.0.0.1" },
          { DEV: false, NODE_ENV: "production" },
        ),
        true,
      );
      assert.strictEqual(
        isDevelopmentDeployment(
          { hostname: "0.0.0.0" },
          { DEV: false, NODE_ENV: "production" },
        ),
        true,
      );
      assert.strictEqual(
        isDevelopmentDeployment(
          { hostname: "app.local" },
          { DEV: false, NODE_ENV: "production" },
        ),
        true,
      );
      assert.strictEqual(
        isDevelopmentDeployment(
          { hostname: "test-app.test" },
          { DEV: false, NODE_ENV: "production" },
        ),
        true,
      );
    });

    it("identifies AI Studio development deployment hostnames", () => {
      // AI Studio development deployment URLs (ais-dev-*.run.app)
      const devHost = "ais-dev-pu3pqujtddceme4x44d6xb-21866646657.us-east1.run.app";
      assert.strictEqual(
        isDevelopmentDeployment(
          { hostname: devHost },
          { DEV: false, NODE_ENV: "production" },
        ),
        true,
      );
    });

    it("identifies query parameter overrides for debugging (?dev=1 or ?build_info=1)", () => {
      assert.strictEqual(
        isDevelopmentDeployment(
          { hostname: "production-domain.com", search: "?dev=1" },
          { DEV: false, NODE_ENV: "production" },
        ),
        true,
      );
      assert.strictEqual(
        isDevelopmentDeployment(
          { hostname: "production-domain.com", search: "?build_info=1" },
          { DEV: false, NODE_ENV: "production" },
        ),
        true,
      );
    });

    it("identifies shared preview deployments and production domains as non-development", () => {
      // AI Studio shared deployment URL (ais-pre-*.run.app)
      const sharedHost = "ais-pre-pu3pqujtddceme4x44d6xb-21866646657.us-east1.run.app";
      assert.strictEqual(
        isDevelopmentDeployment(
          { hostname: sharedHost, search: "" },
          { DEV: false, NODE_ENV: "production" },
        ),
        false,
      );

      // Custom production domains
      assert.strictEqual(
        isDevelopmentDeployment(
          { hostname: "movienight.app", search: "" },
          { DEV: false, NODE_ENV: "production" },
        ),
        false,
      );
      assert.strictEqual(
        isDevelopmentDeployment(
          { hostname: "movies.example.com", search: "" },
          { DEV: false, NODE_ENV: "production" },
        ),
        false,
      );
    });

    it("respects DEV and development environment overrides", () => {
      assert.strictEqual(
        isDevelopmentDeployment(null, { DEV: true }),
        true,
      );
      assert.strictEqual(
        isDevelopmentDeployment(null, { MODE: "development" }),
        true,
      );
      assert.strictEqual(
        isDevelopmentDeployment(null, { NODE_ENV: "development" }),
        true,
      );
      assert.strictEqual(
        isDevelopmentDeployment(null, { DEV: false, NODE_ENV: "production" }),
        false,
      );
    });
  });
});
