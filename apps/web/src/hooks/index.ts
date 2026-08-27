import {
  useRef,
  useMemo,
  type RefObject,
  startTransition,
  useSyncExternalStore,
  useCallback,
  useState,
  useEffect,
} from "react";
import { usePwaInstall } from "@/app/PwaInstallProvider";
import { useToast, useAppSession, useUser } from "@/app/providerContexts";
import {
  getOutboxStatusSummary,
  type OutboxStatusSummary,
  syncOutboxStatusEvent,
  flushPendingSync,
} from "@/services/state";
import { stagger, animate } from "motion/react";
import {
  readApiErrorMessage,
  compareCreatedAtAsc,
  prefersReducedMotion,
  sanitizeInput,
  runWithViewTransition,
  consoleError,
  subscribeMotionPreferences,
  getErrorMessage,
  isChromaSpotlightEnabled,
  hasHoverCapability,
  loadFeatureFonts,
} from "@/utils";
import { readHashMainTab, type MainTab } from "@/app/appViewState";
import { preloadWorkspaceTab } from "@/app/preloadAppModules";
import {
  addMessage as addMessageService,
  deleteMessage as deleteMessageService,
} from "@/services/content";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  readScope,
  getStoredScopeSnapshot,
  mutateScope,
  retryScopeSync,
  normalizeQuizData,
} from "../services/state";
import { areDeeplyEqual } from "../utils";
import { User } from "../shared/types";
import { QuizQuestion, QuizCharacter } from "@/components/quiz";
import {
  trapFocusOnTab,
  isFocusWithin,
} from "@/components/ui/lib/modalPrimitives";

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

/**
 * Cinematic card drop-in entrance using motion's animate + stagger.
 * Skipped on mobile/coarse pointers and when reduced motion is requested.
 */
export function useCinematicEntrance(
  containerRef: React.RefObject<HTMLElement | null>,
  ready: boolean,
  selector: string,
  delay = 0,
) {
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (
      !ready ||
      hasAnimated.current ||
      prefersReducedMotion() ||
      !hasHoverCapability()
    ) {
      return;
    }

    let cancelled = false;
    let observer: MutationObserver | undefined;

    function run(): boolean {
      const container = containerRef.current;
      if (!container || hasAnimated.current) return false;

      const targets = Array.from(
        container.querySelectorAll<HTMLElement>(selector),
      );
      if (targets.length === 0) return false;

      hasAnimated.current = true;

      // Set initial state
      for (const el of targets) {
        el.style.transform = "translateY(72px) scale(0.95) rotateX(-10deg)";
        el.style.opacity = "0";
        el.style.filter = "blur(6px)";
      }

      const staggerAmount = Math.min(0.35, targets.length * 0.05);

      animate(
        targets,
        {
          y: [72, 0],
          opacity: [0, 1],
          scale: [0.95, 1],
          filter: ["blur(6px)", "blur(0px)"],
        },
        {
          duration: 0.55,
          delay: stagger(staggerAmount / Math.max(targets.length - 1, 1), {
            startDelay: delay,
          }),
          ease: [0.16, 1, 0.3, 1],
          onComplete: () => {
            // Clean up inline styles after animation
            for (const el of targets) {
              el.style.removeProperty("transform");
              el.style.removeProperty("filter");
            }
          },
        },
      );

      return true;
    }

    if (!run()) {
      const container = containerRef.current;
      if (container) {
        observer = new MutationObserver(() => {
          if (!cancelled && run()) observer?.disconnect();
        });
        observer.observe(container, { childList: true, subtree: true });
      }
    }

    const cleanupContainer = containerRef.current;
    return () => {
      cancelled = true;
      observer?.disconnect();
      if (!hasAnimated.current) {
        cleanupContainer
          ?.querySelectorAll<HTMLElement>(selector)
          .forEach((el) => {
            el.style.removeProperty("transform");
            el.style.removeProperty("opacity");
            el.style.removeProperty("filter");
          });
      }
    };
  }, [ready, containerRef, selector, delay]);
}

interface UseAppTabNavigationOptions {
  initialTab: MainTab;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  onTabSwitch?: () => void;
}

interface UseAppTabNavigationResult {
  activeTab: MainTab;
  handleTabChange: (tab: MainTab) => void;
}

export function useAppTabNavigation({
  initialTab,
  prefersReducedMotion,
  isMobile,
  onTabSwitch,
}: UseAppTabNavigationOptions): UseAppTabNavigationResult {
  const [activeTab, setActiveTab] = useState<MainTab>(() =>
    initialTab === "memories" ? "movies" : initialTab,
  );

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      const nextTab = tab === "memories" ? "movies" : tab;
      if (nextTab === activeTab) {
        return;
      }

      onTabSwitch?.();
      void preloadWorkspaceTab(nextTab);

      runWithViewTransition(() => {
        startTransition(() => {
          setActiveTab(nextTab);
          window.requestAnimationFrame(() => {
            document
              .getElementById("main-content")
              ?.focus({ preventScroll: true });
          });
        });
      }, prefersReducedMotion || isMobile);
    },
    [activeTab, isMobile, onTabSwitch, prefersReducedMotion],
  );

  useEffect(() => {
    const hashTab = readHashMainTab();
    if (hashTab !== activeTab) {
      window.history.replaceState(null, "", `#${activeTab}`);
    }
  }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => {
      const tab = readHashMainTab();
      if (tab) {
        handleTabChange(tab);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [handleTabChange]);

  return { activeTab, handleTabChange };
}

const POLLING_INTERVAL = 15000;

export const useMessages = () => {
  const { currentUser } = useUser();
  const {
    data: remoteMessages,
    error,
    isLoading,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
  } = useSyncedScope("messages", {
    pollingInterval: POLLING_INTERVAL,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messages = useMemo(
    () => [...(remoteMessages ?? [])].sort(compareCreatedAtAsc),
    [remoteMessages],
  );

  const addMessage = useCallback(
    async (content: string) => {
      const trimmedContent = sanitizeInput(content);

      if (!currentUser) {
        throw new Error("Choose Aaron or Electra to send a message.");
      }

      if (!trimmedContent) {
        throw new Error("Please enter a message.");
      }

      setIsSubmitting(true);
      try {
        const result = await addMessageService(currentUser, trimmedContent);
        refresh();
        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, refresh],
  );

  const deleteMessage = useCallback(
    async (message: Message) => {
      if (!currentUser) {
        throw new Error("Choose Aaron or Electra to delete a message.");
      }

      if (message.author !== currentUser) {
        throw new Error("You can only delete your own messages.");
      }

      setIsSubmitting(true);
      try {
        await deleteMessageService(message.id);
        refresh();
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, refresh],
  );

  return {
    currentUser,
    messages,
    error,
    isLoading,
    isSubmitting,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    addMessage,
    deleteMessage,
    refresh,
    retrySync,
  };
};

const TILT_MAX_DEG = 8;
const SCALE_ON_HOVER = 1.025;

export function useCardTilt<T extends HTMLElement = HTMLDivElement>({
  disabled = false,
}: { disabled?: boolean } = {}) {
  const ref = useRef<T | null>(null);
  const raf = useRef<number>(0);
  const coordsRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const rectRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const prefersReduced = useRef(false);
  const isDisabled = useRef(disabled);

  useEffect(() => {
    isDisabled.current = disabled;
  }, [disabled]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReduced.current = mq.matches;
    const h = (e: MediaQueryListEvent) => {
      prefersReduced.current = e.matches;
    };
    mq.addEventListener("change", h);
    return () => {
      mq.removeEventListener("change", h);
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = 0;
      }
    };
  }, []);

  const onMouseEnter = useCallback(() => {
    if (prefersReduced.current || isDisabled.current) return;
    const el = ref.current;
    if (!el) return;
    const domRect = el.getBoundingClientRect();
    rectRef.current = {
      left: domRect.left,
      top: domRect.top,
      width: domRect.width || 1,
      height: domRect.height || 1,
    };
    el.style.willChange = "transform";
    el.style.transition = "transform 0.08s ease-out";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (prefersReduced.current || isDisabled.current) return;
    coordsRef.current = { clientX: e.clientX, clientY: e.clientY };

    if (raf.current !== 0) return;

    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const el = ref.current;
      const coords = coordsRef.current;
      if (!el || !coords) return;

      const domRect = el.getBoundingClientRect();
      const r = {
        left: domRect.left,
        top: domRect.top,
        width: domRect.width || 1,
        height: domRect.height || 1,
      };

      const x = coords.clientX - r.left;
      const y = coords.clientY - r.top;
      const dx = Math.max(-1, Math.min(1, (x / r.width - 0.5) * 2));
      const dy = Math.max(-1, Math.min(1, (y / r.height - 0.5) * 2));
      const rotY = dx * TILT_MAX_DEG;
      const rotX = -dy * TILT_MAX_DEG;

      // Instant 1:1 cursor response without transition latency
      el.style.transition = "none";
      el.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(${SCALE_ON_HOVER}, ${SCALE_ON_HOVER}, ${SCALE_ON_HOVER})`;
      const sheenX = ((dx + 1) * 0.5 * 100).toFixed(1);
      const sheenY = ((dy + 1) * 0.5 * 100).toFixed(1);
      el.style.setProperty("--sheen-x", `${sheenX}%`);
      el.style.setProperty("--sheen-y", `${sheenY}%`);
      el.style.setProperty("--mouse-x", `${x.toFixed(1)}px`);
      el.style.setProperty("--mouse-y", `${y.toFixed(1)}px`);
    });
  }, []);

  const onMouseLeave = useCallback(() => {
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }
    coordsRef.current = null;
    rectRef.current = null;
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    el.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    el.style.willChange = "auto";
    el.style.removeProperty("--sheen-x");
    el.style.removeProperty("--sheen-y");
    el.style.removeProperty("--mouse-x");
    el.style.removeProperty("--mouse-y");
  }, []);

  return { ref, onMouseEnter, onMouseMove, onMouseLeave };
}

/**
 * Spatial navigation and audio unlock hook for TV remote D-Pad controls.
 */
export function useTvSpatialNavigation(isTvEnabled: boolean = true) {
  useEffect(() => {
    if (typeof window === "undefined" || !isTvEnabled) return;

    // Helper to attempt unlocking Web Audio AudioContext on remote input
    const unlockAudio = () => {
      const audioCtx = (
        window as unknown as { _sharedAudioContext?: AudioContext }
      )._sharedAudioContext;
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      unlockAudio();

      const navigationKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ];
      if (!navigationKeys.includes(e.key)) return;

      const active = document.activeElement as HTMLElement | null;

      // If user is inside a text input or textarea, let default text editing work
      if (
        active &&
        (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
      ) {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          return;
        }
      }

      const focusableSelector =
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"]), .ups-card, .card-tilt-wrap';
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          el.offsetWidth > 0 &&
          el.offsetHeight > 0
        );
      });

      if (elements.length === 0) return;

      if (!active || !elements.includes(active)) {
        elements[0].focus();
        e.preventDefault();
        return;
      }

      const currentRect = active.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      let bestNext: HTMLElement | null = null;
      let minDistance = Infinity;

      elements.forEach((el) => {
        if (el === active) return;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = centerX - currentCenterX;
        const dy = centerY - currentCenterY;

        let isValidDirection = false;
        switch (e.key) {
          case "ArrowUp":
            isValidDirection = dy < -5;
            break;
          case "ArrowDown":
            isValidDirection = dy > 5;
            break;
          case "ArrowLeft":
            isValidDirection = dx < -5;
            break;
          case "ArrowRight":
            isValidDirection = dx > 5;
            break;
        }

        if (isValidDirection) {
          const distance = Math.hypot(dx, dy);
          if (distance < minDistance) {
            minDistance = distance;
            bestNext = el;
          }
        }
      });

      if (bestNext) {
        (bestNext as HTMLElement).focus();
        (bestNext as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTvEnabled]);
}

/**
 *
 * Audio effects are disabled for faster perceived performance.
 * All methods are stable no-ops that keep the API contract intact
 * so consumers don't need changes.
 */

const noop = (..._args: unknown[]) => {};
export const useAudio = () => {
  const playTone = useCallback(
    (
      _frequency: number,
      _endFrequency: number | null = null,
      _type: OscillatorType = "sine",
      _duration?: number,
      _volume?: number,
      _attackTime?: number,
    ) => {},
    [],
  );

  return {
    playTone,
    playClick: noop,
    playPop: noop,
    playSwitch: noop,
    playSuccess: noop,
    playError: noop,
    playKeypad: noop,
  };
};

export interface SyncedScopeOptions {
  pollingInterval?: number;
  isPaused?: boolean;
}

interface ScopeMutation<TScope extends StateScope> {
  op: string;
  payload: unknown;
  optimisticData: StateScopeDataMap[TScope];
}

export const useSyncedScope = <TScope extends StateScope>(
  scope: TScope,
  options: SyncedScopeOptions = {},
) => {
  const { pollingInterval = 15000, isPaused = false } = options;
  const queryClient = useQueryClient();
  const [mutationsInFlight, setMutationsInFlight] = useState(0);
  const query = useQuery({
    queryKey: [scope],
    queryFn: () => readScope(scope),
    initialData: () => getStoredScopeSnapshot(scope),
    refetchInterval: isPaused ? false : pollingInterval,
    refetchOnWindowFocus: !isPaused,
    structuralSharing: false,
  });

  const mutate = useCallback(
    async (mutation: ScopeMutation<TScope>) => {
      setMutationsInFlight((count) => count + 1);
      try {
        const snapshot = await mutateScope(scope, mutation);
        await queryClient.invalidateQueries({ queryKey: [scope] });
        return snapshot;
      } finally {
        setMutationsInFlight((count) => count - 1);
      }
    },
    [queryClient, scope],
  );

  const retrySync = useCallback(async () => {
    await retryScopeSync(scope);
    void query.refetch();
  }, [query, scope]);

  const snapshot = query.data;
  return {
    data: snapshot?.data as StateScopeDataMap[TScope] | undefined,
    snapshot,
    error: query.error instanceof Error ? query.error : null,
    isLoading: query.isLoading,
    isMutating: mutationsInFlight > 0,
    isDegraded: snapshot?.degraded ?? false,
    isSyncBlocked: snapshot?.blocked ?? false,
    syncWarning: snapshot?.warning,
    refresh: query.refetch,
    retrySync,
    mutate,
  };
};

export const useMoviesScope = (options?: SyncedScopeOptions) =>
  useSyncedScope("movies", options);
export const useSuggestionsScope = (options?: SyncedScopeOptions) =>
  useSyncedScope("suggestions", options);
interface CollectionOptions {
  pollingInterval?: number;
  isPaused?: boolean;
}

type CollectionScope = {
  [K in StateScope]: StateScopeDataMap[K] extends Array<unknown> ? K : never;
}[StateScope];

const getCollectionItemId = (item: unknown): string | undefined => {
  if (typeof item !== "object" || item === null || !("id" in item)) {
    return undefined;
  }

  const { id } = item as { id: unknown };
  return typeof id === "string" ? id : undefined;
};

const hasLocalOnlyRows = <T>(current: T[], polled: T[]): boolean => {
  // Optimization: Use a single pass loop instead of multi-pass chained array
  // methods (.map().filter()) to build the Set. This eliminates intermediate
  // array allocations and improves performance for large collections.
  const polledIds = new Set<string>();
  for (const item of polled) {
    const id = getCollectionItemId(item);
    if (id) {
      polledIds.add(id);
    }
  }

  return current.some((item) => {
    const id = getCollectionItemId(item);
    return Boolean(id && !polledIds.has(id));
  });
};

export const useCollection = <T>(
  scope: CollectionScope,
  currentUser: User | null | undefined,
  options: CollectionOptions = {},
) => {
  const { pollingInterval = 15000, isPaused = false } = options;
  const {
    data: remoteData,
    snapshot,
    error,
    isLoading,
    isMutating,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    mutate,
  } = useSyncedScope(scope, { pollingInterval, isPaused });
  const polledData = useMemo(() => (remoteData as T[]) ?? [], [remoteData]);
  const [data, setData] = useState<T[]>(polledData);

  useEffect(() => {
    if (isMutating) {
      return;
    }

    setData((current) => {
      if (areDeeplyEqual(current, polledData)) {
        return current;
      }

      // Avoid overwriting optimistic rows with a stale poll that finished before refresh().
      if (snapshot?.degraded || snapshot?.blocked) {
        if (hasLocalOnlyRows(current, polledData)) {
          return current;
        }
      }

      return polledData;
    });
  }, [isMutating, polledData, snapshot?.blocked, snapshot?.degraded]);

  const performMutation = useCallback(
    async (op: string, payload: unknown, optimisticData: T[]) => {
      if (!currentUser) {
        throw new Error("Profile required");
      }

      setData(optimisticData);
      const nextSnapshot = await mutate({
        op,
        payload,
        optimisticData: optimisticData as StateScopeDataMap[CollectionScope],
      });
      setData(nextSnapshot.data as T[]);
      if (nextSnapshot.degraded) {
        throw new Error(
          nextSnapshot.warning ??
            "Change was kept locally because shared sync is unavailable. Retry sync when you are back online.",
        );
      }
      return true;
    },
    [currentUser, mutate],
  );

  return {
    data,
    isLoading,
    isSubmitting: isMutating,
    error,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    performMutation,
  };
};

/** Loads quiz/memories feature fonts once when a feature surface mounts. */
export const useFeatureFonts = (): void => {
  useEffect(() => {
    void loadFeatureFonts();
  }, []);
};

export const mediaBreakpoints = {
  sm: "(max-width: 640px)",
  md: "(max-width: 768px)",
  lg: "(max-width: 1024px)",
  xl: "(max-width: 1280px)",
} as const;

export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (callback: () => void) => {
      const matchMedia = window.matchMedia(query);
      matchMedia.addEventListener("change", callback);
      return () => {
        matchMedia.removeEventListener("change", callback);
      };
    },
    [query],
  );

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

/**
 * useQuiz Hook
 *
 * Provides quiz data with polling and mutation support
 */

const QUIZ_POLLING_INTERVAL = 30000;

export type { QuizData } from "@/services/state";

export const useQuiz = (isPaused: boolean = false) => {
  const {
    data: quizData,
    error,
    isLoading,
    isMutating: isSaving,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    mutate,
  } = useSyncedScope("quiz", {
    pollingInterval: QUIZ_POLLING_INTERVAL,
    isPaused,
  });
  const normalizedQuizData = useMemo(
    () => (quizData ? normalizeQuizData(quizData) : null),
    [quizData],
  );

  const performMutation = useCallback(
    async (mutationFn: (data: QuizData) => QuizData) => {
      if (!normalizedQuizData) return;

      try {
        const updatedData = mutationFn(normalizedQuizData);
        await mutate({
          op: "replace_quiz",
          payload: { quizData: updatedData },
          optimisticData: updatedData,
        });
        void refresh();
      } catch (err) {
        consoleError("Quiz mutation failed:", err);
        throw err;
      }
    },
    [mutate, normalizedQuizData, refresh],
  );

  const updateQuestions = useCallback(
    async (questions: QuizQuestion[]) => {
      await performMutation((data) => ({ ...data, questions }));
    },
    [performMutation],
  );

  const addQuestion = useCallback(
    async (question: QuizQuestion) => {
      await performMutation((data) => ({
        ...data,
        questions: [...data.questions, question],
      }));
    },
    [performMutation],
  );

  const updateQuestion = useCallback(
    async (questionId: string, updatedQuestion: QuizQuestion) => {
      await performMutation((data) => ({
        ...data,
        questions: data.questions.map((q: QuizQuestion) =>
          q.id === questionId ? updatedQuestion : q,
        ),
      }));
    },
    [performMutation],
  );

  const deleteQuestion = useCallback(
    async (questionId: string) => {
      await performMutation((data) => ({
        ...data,
        questions: data.questions.filter(
          (q: QuizQuestion) => q.id !== questionId,
        ),
      }));
    },
    [performMutation],
  );

  const updateCharacterDescription = useCallback(
    async (character: QuizCharacter, description: string) => {
      await performMutation((data) => ({
        ...data,
        characterDescriptions: {
          ...data.characterDescriptions,
          [character]: description,
        },
      }));
    },
    [performMutation],
  );

  const updateNeitherDescription = useCallback(
    async (description: string) => {
      await performMutation((data) => ({
        ...data,
        neitherDescription: description,
      }));
    },
    [performMutation],
  );

  const saveAllData = useCallback(
    async (data: QuizData) => {
      if (!data) return;

      await mutate({
        op: "replace_quiz",
        payload: { quizData: data },
        optimisticData: data,
      });
      void refresh();
    },
    [mutate, refresh],
  );

  return {
    quizData: normalizedQuizData,
    error,
    isLoading,
    isSaving,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    updateQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    updateCharacterDescription,
    updateNeitherDescription,
    saveAllData,
  };
};

const PINS_POLL_INTERVAL = 30000;

export const usePins = (isPaused: boolean = false) => {
  const { currentUser } = useUser();
  const {
    hasAccess,
    pinProtectedUsers,
    usersMissingPins,
    isSessionLoading,
    refreshSession,
  } = useAppSession();

  useEffect(() => {
    if (isPaused || !hasAccess) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      void refreshSession();
    }, PINS_POLL_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [hasAccess, isPaused, refreshSession]);

  const userHasPin = useCallback(
    (user: User): boolean => pinProtectedUsers.includes(user),
    [pinProtectedUsers],
  );

  const userNeedsPin = useCallback(
    (user: User): boolean => usersMissingPins.includes(user),
    [usersMissingPins],
  );

  const setUserPin = useCallback(
    async (user: User, pin: string): Promise<boolean> => {
      if (!hasAccess || !currentUser || currentUser !== user) {
        return false;
      }

      try {
        await mutateScope("pins", {
          op: "set_pin",
          payload: { pin },
          optimisticData: {
            Aaron: user === "Aaron" || pinProtectedUsers.includes("Aaron"),
            Electra:
              user === "Electra" || pinProtectedUsers.includes("Electra"),
          },
        });
        await refreshSession();
        return true;
      } catch (error) {
        consoleError("Error setting PIN:", error);
        return false;
      }
    },
    [currentUser, hasAccess, pinProtectedUsers, refreshSession],
  );

  const verifyUserPin = useCallback(
    async (user: User, pin: string): Promise<boolean> => {
      if (!hasAccess) {
        return false;
      }

      try {
        const response = await fetch("/api/session/profile", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user, pin }),
        });

        if (response.status === 401 || response.status === 403) {
          return false;
        }

        if (!response.ok) {
          throw new Error(
            await readApiErrorMessage(response, "Failed to verify PIN."),
          );
        }

        await refreshSession();
        return true;
      } catch (error) {
        consoleError("PIN verification failed:", error);
        throw new Error(
          getErrorMessage(error, "Profile login is unavailable right now."),
          { cause: error },
        );
      }
    },
    [hasAccess, refreshSession],
  );

  return {
    pins: {
      Aaron: pinProtectedUsers.includes("Aaron"),
      Electra: pinProtectedUsers.includes("Electra"),
    },
    usersMissingPins,
    isLoading: isSessionLoading,
    userHasPin,
    userNeedsPin,
    setUserPin,
    verifyUserPin,
    refresh: refreshSession,
  };
};

export interface ChromaSpotlightOptions {
  radius?: number;
  /** Lerp factor per frame (0–1). Higher = snappier. */
  damping?: number;
  fadeOut?: number;
}

/**
 * Tracks pointer position and updates CSS custom properties --x/--y on the
 * root element for the chroma spotlight effect. Uses a rAF lerp loop instead
 * of GSAP to avoid the dependency while keeping the same smoothing behaviour.
 */
export function useChromaSpotlight({
  radius = 280,
  damping = 0.32,
  fadeOut = 0.6,
}: ChromaSpotlightOptions = {}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fadeRef = useRef<HTMLDivElement | null>(null);
  const rectRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Target position (where the pointer is)
  const target = useRef({ x: 0, y: 0 });
  // Current interpolated position
  const current = useRef({ x: 0, y: 0 });

  const enabled = useRef(true);
  const frameRef = useRef<number | null>(null);

  // Start the rAF lerp loop
  const startLoop = useCallback(
    (el: HTMLDivElement) => {
      if (frameRef.current !== null) return;

      function tick() {
        const dx = target.current.x - current.current.x;
        const dy = target.current.y - current.current.y;

        // Only keep looping while there's meaningful movement
        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
          current.current.x += dx * damping;
          current.current.y += dy * damping;
          el.style.setProperty("--x", `${current.current.x.toFixed(1)}px`);
          el.style.setProperty("--y", `${current.current.y.toFixed(1)}px`);
          frameRef.current = requestAnimationFrame(tick);
        } else {
          // Snap to target and stop
          current.current.x = target.current.x;
          current.current.y = target.current.y;
          el.style.setProperty("--x", `${current.current.x.toFixed(1)}px`);
          el.style.setProperty("--y", `${current.current.y.toFixed(1)}px`);
          frameRef.current = null;
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    },
    [damping],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const syncEnabled = () => {
      enabled.current = isChromaSpotlightEnabled();
      el.style.setProperty("--chroma-enabled", enabled.current ? "1" : "0");
    };
    syncEnabled();

    // Initialise position to element center
    const domRect = el.getBoundingClientRect();
    rectRef.current = {
      left: domRect.left,
      top: domRect.top,
      width: domRect.width || 1,
      height: domRect.height || 1,
    };
    target.current = { x: domRect.width / 2, y: domRect.height / 2 };
    current.current = { ...target.current };
    el.style.setProperty("--r", `${radius}px`);
    el.style.setProperty("--x", `${current.current.x.toFixed(1)}px`);
    el.style.setProperty("--y", `${current.current.y.toFixed(1)}px`);

    const unsubscribe = subscribeMotionPreferences(syncEnabled);
    return () => {
      unsubscribe();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [radius]);

  const handlePointerEnter = useCallback(() => {
    if (!enabled.current) return;
    const root = rootRef.current;
    if (!root) return;
    const domRect = root.getBoundingClientRect();
    rectRef.current = {
      left: domRect.left,
      top: domRect.top,
      width: domRect.width || 1,
      height: domRect.height || 1,
    };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled.current) return;
      const root = rootRef.current;
      if (!root) return;

      let rect = rectRef.current;
      if (!rect) {
        const domRect = root.getBoundingClientRect();
        rect = {
          left: domRect.left,
          top: domRect.top,
          width: domRect.width || 1,
          height: domRect.height || 1,
        };
        rectRef.current = rect;
      }

      target.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Show spotlight
      if (fadeRef.current) {
        fadeRef.current.style.transition = "opacity 0.2s ease";
        fadeRef.current.style.opacity = "0";
      }

      startLoop(root);
    },
    [startLoop],
  );

  const handlePointerLeave = useCallback(() => {
    rectRef.current = null;
    if (!enabled.current || !fadeRef.current) return;
    const fade = fadeRef.current;
    fade.style.transition = `opacity ${fadeOut}s ease`;
    fade.style.opacity = "1";
  }, [fadeOut]);

  return {
    rootRef,
    fadeRef,
    handlePointerEnter,
    handlePointerMove,
    handlePointerLeave,
  };
}

export interface UseModalBehaviorOptions {
  isOpen: boolean;
  onClose: () => void;
  closeDisabled?: boolean;
  /** Ref to the modal/sheet container. Used for focus trap and Escape guard. */
  containerRef: RefObject<HTMLElement | null>;
  /** Ref to the element that should receive initial focus (e.g. close button). */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Shared modal behavior:
 *   - Locks body scroll while open and restores it on close.
 *   - Saves and restores the previously focused element.
 *   - Moves initial focus to `initialFocusRef` (or the container when close is disabled).
 *   - Traps Tab focus within the container.
 *   - Closes on Escape (unless `closeDisabled`).
 *
 * Returns `handleClose` — plays the pop sound and guards against the disabled state.
 */
export const useModalBehavior = ({
  isOpen,
  onClose,
  closeDisabled = false,
  containerRef,
  initialFocusRef,
}: UseModalBehaviorOptions) => {
  const { playPop } = useAudio();
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      previousFocusRef.current?.focus?.();
      return undefined;
    }

    previousFocusRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      if (closeDisabled) {
        containerRef.current?.focus();
      } else {
        (initialFocusRef?.current ?? containerRef.current)?.focus();
      }
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFocusWithin(containerRef.current)) return;
      const isTextInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;
      const isBackKey =
        event.key === "Escape" ||
        event.key === "GoBack" ||
        event.keyCode === 10009 ||
        event.keyCode === 461 ||
        (event.key === "Backspace" && !isTextInput);

      if (isBackKey && !closeDisabled) {
        event.preventDefault();
        onClose();
        return;
      }
      trapFocusOnTab(event, containerRef.current);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeDisabled, onClose, containerRef, initialFocusRef]);

  const handleClose = useCallback(() => {
    if (closeDisabled) return;
    playPop();
    onClose();
  }, [closeDisabled, onClose, playPop]);

  return { handleClose };
};
import type { QuizData } from "@/services/state";
import type { StateScope, StateScopeDataMap } from "@/services/state";
import type { Message } from "@/shared/types";
export * from "./useKineticWallScroll";
