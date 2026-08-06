/**
 * PwaInstallProvider — native PWA install prompt without lit or @khmyznikov/pwa-install.
 *
 * Uses the browser's beforeinstallprompt event directly. On iOS Safari (which
 * doesn't fire beforeinstallprompt), install instructions are shown via toast.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "@/app/useProviders";

// ── Types ──────────────────────────────────────────────────────────

// Mirrors the global augmentation in src/shared/pwaInstallWindow.ts
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PwaInstallContextValue {
  canInstall: boolean;
  isStandalone: boolean;
  openInstallDialog: () => void;
}

// ── Context ────────────────────────────────────────────────────────

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const usePwaInstall = (): PwaInstallContextValue => {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) throw new Error("usePwaInstall must be used within PwaInstallProvider");
  return ctx;
};

// ── Helpers ────────────────────────────────────────────────────────

const readStandaloneMode = (): boolean =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

/** True on iOS Safari, which doesn't fire beforeinstallprompt */
const isIosSafari = (): boolean =>
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !(window as Window & { MSStream?: unknown }).MSStream;

// ── Provider ───────────────────────────────────────────────────────

export const PwaInstallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const autoShownRef = useRef(false);

  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(readStandaloneMode);

  // Pick up a deferred prompt set by index.html before React boots
  useEffect(() => {
    if (window.__electronDeferredInstallPrompt) {
      promptRef.current = window.__electronDeferredInstallPrompt;
      if (!readStandaloneMode()) setCanInstall(true);
    }
  }, []);

  // Listen for the install prompt event
  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      promptRef.current = e;
      if (!readStandaloneMode()) {
        setCanInstall(true);

        // Auto-prompt after a short delay (mirrors old pwa-install behaviour)
        if (!autoShownRef.current) {
          autoShownRef.current = true;
          window.setTimeout(() => {
            if (!readStandaloneMode() && promptRef.current) {
              void promptRef.current.prompt();
            }
          }, 1400);
        }
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Track standalone mode changes
  useEffect(() => {
    const refresh = () => setIsStandalone(readStandaloneMode());
    window.addEventListener("appinstalled", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("appinstalled", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  // After successful install
  useEffect(() => {
    const handler = () => {
      setCanInstall(false);
      setIsStandalone(true);
      showToast({
        type: "success",
        message: "Electron is installed. Open it from your home screen or dock.",
      });
    };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, [showToast]);

  const openInstallDialog = useCallback(async () => {
    if (isStandalone) return;

    if (promptRef.current) {
      await promptRef.current.prompt();
      const { outcome } = await promptRef.current.userChoice;
      if (outcome === "accepted") setCanInstall(false);
      promptRef.current = null;
      return;
    }

    if (isIosSafari()) {
      showToast({
        type: "info",
        message: 'To install: tap the Share button, then "Add to Home Screen".',
      });
    }
  }, [isStandalone, showToast]);

  const value = useMemo(
    () => ({ canInstall, isStandalone, openInstallDialog }),
    [canInstall, isStandalone, openInstallDialog],
  );

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  );
};
