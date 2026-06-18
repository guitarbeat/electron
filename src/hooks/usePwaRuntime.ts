import { useState, useRef, useEffect, useCallback } from "react";
import { usePwaInstall } from "@/app/PwaInstallProvider";
import { useToast } from "@/app/useProviders";
import {
  flushPendingSync,
  getOutboxStatusSummary,
  syncOutboxStatusEvent,
  type OutboxStatusSummary,
} from "@/services/state/stateClient";

export interface PwaRuntimeResult {
  isOnline: boolean;
  isStandalone: boolean;
  canInstallApp: boolean;
  hasUpdateReady: boolean;
  outboxStatus: OutboxStatusSummary;
  handleApplyUpdate: () => void;
  handleRetryPendingSync: () => void;
  handleInstallApp: () => void;
}

export function usePwaRuntime(): PwaRuntimeResult {
  const { showToast, dismissToast } = useToast();
  const { canInstall, isStandalone, openInstallDialog } = usePwaInstall();

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [hasUpdateReady, setHasUpdateReady] = useState(false);
  const [outboxStatus, setOutboxStatus] = useState<OutboxStatusSummary>(() =>
    getOutboxStatusSummary(),
  );

  const updateToastIdRef = useRef<string | null>(null);
  const updateRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const offlineToastIdRef = useRef<string | null>(null);

  // Service worker: watch for updates
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let isMounted = true;
    let hasReloaded = false;

    const showUpdateToast = (reg: ServiceWorkerRegistration) => {
      setHasUpdateReady(true);
      if (updateToastIdRef.current) dismissToast(updateToastIdRef.current);
      updateRegistrationRef.current = reg;
      updateToastIdRef.current = showToast({
        type: "info",
        message: "A newer app version is ready.",
        persistent: true,
        actionLabel: "Refresh",
        onAction: () => reg.waiting?.postMessage({ type: "SKIP_WAITING" }),
      });
    };

    const watchRegistration = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) showUpdateToast(reg);
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller)
            showUpdateToast(reg);
        });
      });
    };

    navigator.serviceWorker.ready
      .then((reg) => {
        if (isMounted) watchRegistration(reg);
      })
      .catch(() => undefined);

    const onControllerChange = () => {
      if (hasReloaded) return;
      hasReloaded = true;
      setHasUpdateReady(false);
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, [dismissToast, showToast]);

  // Online / offline
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOffline = () => {
      setIsOnline(false);
      document.documentElement.classList.add("app-offline");
      if (offlineToastIdRef.current) dismissToast(offlineToastIdRef.current);
      offlineToastIdRef.current = showToast({
        type: "error",
        message:
          "You are offline. Saved app screens still work, but sync is paused.",
        persistent: true,
      });
    };

    const handleOnline = () => {
      setIsOnline(true);
      document.documentElement.classList.remove("app-offline");
      if (offlineToastIdRef.current) {
        dismissToast(offlineToastIdRef.current);
        offlineToastIdRef.current = null;
      }
      void flushPendingSync()
        .then(setOutboxStatus)
        .catch(() => undefined);
      updateRegistrationRef.current?.update().catch(() => undefined);
      showToast({
        type: "success",
        message: "Back online. Sync and update checks have resumed.",
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    if (!navigator.onLine) handleOffline();
    else document.documentElement.classList.remove("app-offline");

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [dismissToast, showToast]);

  // Outbox sync polling
  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyStatus = () => setOutboxStatus(getOutboxStatusSummary());
    const onEvent = (e: Event) =>
      setOutboxStatus(
        (e as CustomEvent<OutboxStatusSummary>).detail ??
          getOutboxStatusSummary(),
      );
    const onVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void flushPendingSync()
          .then(setOutboxStatus)
          .catch(() => undefined);
        updateRegistrationRef.current?.update().catch(() => undefined);
      }
    };

    applyStatus();
    window.addEventListener(syncOutboxStatusEvent, onEvent as EventListener);
    window.addEventListener("focus", onVisibility);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(() => {
      if (navigator.onLine)
        void flushPendingSync()
          .then(setOutboxStatus)
          .catch(() => undefined);
    }, 45_000);

    return () => {
      window.removeEventListener(
        syncOutboxStatusEvent,
        onEvent as EventListener,
      );
      window.removeEventListener("focus", onVisibility);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, []);

  const handleApplyUpdate = useCallback(() => {
    setHasUpdateReady(false);
    updateRegistrationRef.current?.waiting?.postMessage({
      type: "SKIP_WAITING",
    });
  }, []);

  const handleRetryPendingSync = useCallback(() => {
    void flushPendingSync()
      .then(setOutboxStatus)
      .catch(() => undefined);
  }, []);

  const handleInstallApp = useCallback(() => {
    openInstallDialog();
  }, [openInstallDialog]);

  return {
    isOnline,
    isStandalone,
    canInstallApp: canInstall,
    hasUpdateReady,
    outboxStatus,
    handleApplyUpdate,
    handleRetryPendingSync,
    handleInstallApp,
  };
}
