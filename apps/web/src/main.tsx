import React from "react";
import ReactDOM from "react-dom/client";
import "@total-typescript/ts-reset";
import "@/shared/pwaInstallWindow";
import { preloadCriticalAppModules } from "@/app/preloadAppModules";
import { GlobalErrorBoundary } from "@/app/GlobalErrorBoundary";
import { applyTheme } from "@/theme/tokens";
import App from "./app/App";

// Dev convenience: ?mock=1 in URL sets mock data mode
if (
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get("mock") === "1"
) {
  try {
    window.localStorage.setItem("useMockData", "true");
  } catch {
    // Ignore storage access errors in restricted/private contexts
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
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  if (import.meta.env.DEV || window.location.hostname.includes("ais-dev")) {
    // Unregister any active service worker and wipe CacheStorage in dev/preview
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
  } else if (import.meta.env.PROD) {
    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                }
              });
            }
          });
        })
        .catch(() => undefined);
    };

    window.addEventListener("load", registerSW);
  }
}
