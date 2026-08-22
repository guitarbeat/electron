import { startTransition, useCallback, useEffect, useState } from "react";
import { readHashMainTab } from "@/app/appViewState";
import { preloadWorkspaceTab } from "@/app/preloadAppModules";
import type { MainTab } from "@/shared/types";
import { runWithViewTransition } from "@/utils";

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
  const [activeTab, setActiveTab] = useState<MainTab>(() => initialTab);

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      if (tab === activeTab) {
        return;
      }

      onTabSwitch?.();
      void preloadWorkspaceTab(tab);

      runWithViewTransition(
        () => {
          startTransition(() => {
            setActiveTab(tab);
            window.requestAnimationFrame(() => {
              document
                .getElementById("main-content")
                ?.focus({ preventScroll: true });
            });
          });
        },
        prefersReducedMotion || isMobile,
      );
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
