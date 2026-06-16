import React from "react";
import FishTankSection from "@/components/effects/FishTankSection";
import "./LoadingScreen.css";

/**
 * Full-screen loading state shown while the session is bootstrapping.
 */
const LoadingScreen: React.FC = () => (
  <div
    className="session-loading-screen"
    role="status"
    aria-live="polite"
    aria-label="Loading"
  >
    <div className="session-loading-screen__panel">
      <p className="session-loading-screen__eyebrow">Electron</p>
      <h1 className="session-loading-screen__title">Loading your watchlist</h1>
      <p className="session-loading-screen__subtitle">
        Preparing the app and restoring your session.
      </p>
      <div className="session-loading-screen__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
    <FishTankSection />
  </div>
);

export default LoadingScreen;
