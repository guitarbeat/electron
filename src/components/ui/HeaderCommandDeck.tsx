import { useMemo, useState, type FC } from "react";
import { RefreshCw, RotateCw, SatelliteDish, WifiOff, X } from "lucide-react";
import type { MainTab } from "@/shared/types";
import { mediaBreakpoints, useMediaQuery } from "@/hooks/useMediaQuery";
import ThemeToggle from "@/ui/ThemeToggle";
import "./HeaderCommandDeck.css";

export interface HeaderCommandDeckStatus {
  isOnline: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  hasUpdateReady: boolean;
  pendingSyncCount: number;
  blockedSyncCount: number;
}

interface HeaderCommandDeckProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  status?: HeaderCommandDeckStatus;
  onInstallApp?: () => void;
  onApplyUpdate?: () => void;
  onRetrySync?: () => void;
  onOpenSpin?: () => void;
}

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const HeaderCommandDeck: FC<HeaderCommandDeckProps> = ({
  activeTab,
  onTabChange,
  status,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
  onOpenSpin,
}) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const [dismissedKeys, setDismissedKeys] = useState<Record<string, true>>({});

  const statusChip = useMemo(() => {
    if (!status) return null;

    if (!status.isOnline) {
      return {
        tone: "offline" as const,
        label: "Offline",
        detail: "Local cache only",
        action: undefined,
        actionLabel: undefined,
        icon: WifiOff,
      };
    }

    if (status.hasUpdateReady) {
      return {
        tone: "update" as const,
        label: "Update ready",
        detail: "Refresh app shell",
        action: onApplyUpdate,
        actionLabel: "Refresh",
        icon: RefreshCw,
      };
    }

    if (status.blockedSyncCount > 0) {
      return {
        tone: "warning" as const,
        label: "Sync blocked",
        detail: `${pluralize(status.blockedSyncCount, "section")} need attention`,
        action: onRetrySync,
        actionLabel: "Retry",
        icon: SatelliteDish,
      };
    }

    if (status.pendingSyncCount > 0) {
      return {
        tone: "syncing" as const,
        label: "Syncing",
        detail: `${pluralize(status.pendingSyncCount, "pending change", "pending changes")}`,
        action: onRetrySync,
        actionLabel: "Sync now",
        icon: SatelliteDish,
      };
    }

    if (status.canInstall && !status.isStandalone) {
      return {
        tone: "install" as const,
        label: "Install app",
        detail: "Open like native",
        action: onInstallApp,
        actionLabel: "Install",
        icon: SatelliteDish,
      };
    }

    if (status.isStandalone) {
      return {
        tone: "ready" as const,
        label: "Installed",
        detail: "Standalone mode",
        action: undefined,
        actionLabel: undefined,
        icon: SatelliteDish,
      };
    }

    return {
      tone: "ready" as const,
      label: "Live sync",
      detail: "App connected",
      action: undefined,
      actionLabel: undefined,
      icon: SatelliteDish,
    };
  }, [onApplyUpdate, onInstallApp, onRetrySync, status]);

  const dismissKey = statusChip
    ? `electron:pwa-chip:${statusChip.tone}:${statusChip.detail}`
    : null;
  const isStatusDismissed = (() => {
    if (!dismissKey) return false;
    if (dismissedKeys[dismissKey]) return true;

    try {
      return window.localStorage.getItem(dismissKey) === "1";
    } catch {
      return false;
    }
  })();
  const shouldShowStatus = Boolean(
    isMobile && statusChip && statusChip.tone !== "ready" && !isStatusDismissed
  );

  const dismissStatus = () => {
    if (dismissKey) {
      try {
        window.localStorage.setItem(dismissKey, "1");
      } catch {
        // Dismiss in-memory when storage is unavailable.
      }
    }

    if (dismissKey) {
      setDismissedKeys((current) => ({ ...current, [dismissKey]: true }));
    }
  };

  const StatusIcon = statusChip?.icon;

  return (
    <div className="header-command-deck" aria-label="Primary app controls">
      <ThemeToggle
        activeTab={activeTab}
        onChange={onTabChange}
        compact
        className="header-command-deck__tabs"
        label="Switch between Movies and Places"
      />

      {activeTab === "movies" && onOpenSpin ? (
        <button
          type="button"
          className="header-command-deck__spin"
          onClick={onOpenSpin}
          aria-label="Spin the wheel to pick a movie"
          title="Spin the wheel"
        >
          <RotateCw size={15} strokeWidth={2.2} aria-hidden="true" />
          <span>Spin</span>
        </button>
      ) : null}

      {shouldShowStatus && statusChip && StatusIcon ? (
        <div className={`header-command-deck__status header-command-deck__status--${statusChip.tone}`}>
          <StatusIcon size={14} strokeWidth={2.2} aria-hidden="true" />
          <span className="header-command-deck__status-copy">
            <strong>{statusChip.label}</strong>
            <span>{statusChip.detail}</span>
          </span>
          {statusChip.action && statusChip.actionLabel ? (
            <button
              type="button"
              className="header-command-deck__status-action"
              onClick={statusChip.action}
            >
              {statusChip.actionLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="header-command-deck__status-dismiss"
            onClick={dismissStatus}
            aria-label={`Dismiss ${statusChip.label.toLowerCase()} status`}
          >
            <X size={13} strokeWidth={2.3} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default HeaderCommandDeck;
