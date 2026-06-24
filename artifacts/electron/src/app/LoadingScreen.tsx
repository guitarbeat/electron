import React from "react";
import "./LoadingScreen.css";

/**
 * Lightweight boot screen — keeps first paint fast while session/chunks warm up.
 */
const LoadingScreen: React.FC = () => (
  <div
    className="session-loading-screen"
    role="status"
    aria-live="polite"
    aria-label="Loading"
  >
    <div className="session-loading-screen__content">
      <span className="session-loading-screen__brand" aria-hidden="true">
        ◈
      </span>
      <span className="session-loading-screen__spinner" aria-hidden="true" />
    </div>
  </div>
);

export default LoadingScreen;
