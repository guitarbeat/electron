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
    <FishTankSection />
  </div>
);

export default LoadingScreen;
