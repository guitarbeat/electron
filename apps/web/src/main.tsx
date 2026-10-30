import React from "react";
import ReactDOM from "react-dom/client";
import "@total-typescript/ts-reset";
import "@/shared/pwaInstallWindow";
import { preloadCriticalAppModules } from "@/app/preloadAppModules";
import { GlobalErrorBoundary } from "@/app/GlobalErrorBoundary";
import { applyTheme } from "@/theme/tokens";
import App from "./app/App";
import { OrbitLoader } from "@/components/ui/OrbitLoader";

// Explicit local preview switch; mock=0 returns a previously seeded browser to real data.
if (import.meta.env.DEV) {
  const mockMode = new URLSearchParams(window.location.search).get("mock");
  try {
    if (mockMode === "1") window.localStorage.setItem("useMockData", "true");
    else if (mockMode === "0") window.localStorage.removeItem("useMockData");
  } catch {
    // Storage may be unavailable in restricted/private contexts.
  }
}

applyTheme("movies");
void preloadCriticalAppModules();

let isStandalone = false;
try {
  isStandalone =
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;
} catch {
  isStandalone = false;
}

if (isStandalone) {
  document.documentElement.classList.add("app-standalone");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary
      moduleName="RootApplication"
      fallbackTitle="APPLICATION STARTUP FAULT"
      fallbackDescription="A critical error occurred while initializing the workspace. You can reboot the module or reload the page."
    >
      {import.meta.env.DEV && new URLSearchParams(window.location.search).get("previewLoader") === "1" ? <OrbitLoader fullViewport /> : <App />}
    </GlobalErrorBoundary>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        void registration.unregister();
      }
    })
    .catch(() => undefined);

  if ("caches" in window) {
    caches
      .keys()
      .then((keys) => {
        for (const key of keys) {
          void caches.delete(key);
        }
      })
      .catch(() => undefined);
  }
}
