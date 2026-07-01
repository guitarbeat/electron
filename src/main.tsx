import React from "react";
import ReactDOM from "react-dom/client";
import "@total-typescript/ts-reset";
import "@/shared/pwaInstallWindow";
import { applyTheme } from "@/theme/applyTheme";
import App from "./app/App";

applyTheme("movies");

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

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
