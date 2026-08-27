import React from "react";
import ReactDOM from "react-dom/client";
import "@total-typescript/ts-reset";
import "@/shared/pwaInstallWindow";
import { preloadCriticalAppModules } from "@/app/preloadAppModules";
import { applyTheme } from "@/theme/tokens";
import App from "./app/App";

// Dev convenience: ?mock=1 in URL sets mock data mode
if (
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get("mock") === "1"
) {
  window.localStorage.setItem("useMockData", "true");
}

applyTheme("movies");
void preloadCriticalAppModules();

const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;

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
    <App />
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
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
                // Tell the new service worker to take over immediately
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      })
      .catch(() => undefined);

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  };

  if (import.meta.env.PROD) {
    window.addEventListener("load", registerSW);
  } else {
    if (new URLSearchParams(window.location.search).get("sw") === "1") {
      window.addEventListener("load", registerSW);
    } else {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          let unreg = false;
          for (const registration of registrations) {
            registration.unregister();
            unreg = true;
          }
          if (unreg) {
            window.location.reload();
          }
        })
        .catch(() => undefined);
    }
  }
}
