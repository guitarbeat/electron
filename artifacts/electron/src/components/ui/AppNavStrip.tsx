import { type FC, useMemo, useState } from "react";
import {
  RefreshCw,
  SatelliteDish,
  WifiOff,
  X,
} from "lucide-react";
import type { MainTab } from "@/shared/types";
import MagicToggle from "./MagicToggle";
import { useViewport } from "@/app/ViewportContext";
import "./AppNavStrip.css";

export interface AppNavStripStatus {
  isOnline: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  hasUpdateReady: boolean;
  pendingSyncCount: number;
  blockedSyncCount: number;
}

interface Props {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  status?: AppNavStripStatus;
  onInstallApp?: () => void;
  onApplyUpdate?: () => void;
  onRetrySync?: () => void;
}

const pluralize = (n: number, s: string, p = `${s}s`) =>
  `${n} ${n === 1 ? s : p}`;

type StatusChip = {
  tone: "offline" | "update" | "warning" | "syncing" | "install";
  label: string;
  detail: string;
  action?: () => void;
  actionLabel?: string;
  Icon: typeof WifiOff;
};

interface StatusChipBannerProps {
  chip: StatusChip;
  className: string;
  onDismiss: () => void;
}

const StatusChipBanner: FC<StatusChipBannerProps> = ({
  chip,
  className,
  onDismiss,
}) => (
  <div className={className} role="status">
    <chip.Icon size={14} strokeWidth={2.2} aria-hidden="true" />
    <span className="ans__chip-copy">
      <strong>{chip.label}</strong>
      <span>{chip.detail}</span>
    </span>
    {chip.action && chip.actionLabel ? (
      <button
        type="button"
        className="ans__chip-action"
        onClick={chip.action}
        aria-label={chip.actionLabel}
        title={chip.actionLabel}
      >
        {chip.actionLabel}
      </button>
    ) : null}
    <button
      type="button"
      className="ans__chip-dismiss"
      onClick={onDismiss}
      aria-label={`Dismiss ${chip.label.toLowerCase()} status`}
      title={`Dismiss ${chip.label.toLowerCase()} status`}
    >
      <X size={13} strokeWidth={2.3} aria-hidden="true" />
    </button>
  </div>
);

const AppNavStrip: FC<Props> = ({
  activeTab,
  onTabChange,
  status,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
}) => {
  const { isMobile } = useViewport();
  const [dismissedKeys, setDismissedKeys] = useState<Record<string, true>>({});

  const statusChip = useMemo((): StatusChip | null => {
    if (!status) return null;
    if (!status.isOnline)
      return {
        tone: "offline" as const,
        label: "Offline",
        detail: "Local cache only",
        action: undefined,
        actionLabel: undefined,
        Icon: WifiOff,
      };
    if (status.hasUpdateReady)
      return {
        tone: "update" as const,
        label: "Update ready",
        detail: "Refresh app shell",
        action: onApplyUpdate,
        actionLabel: "Refresh",
        Icon: RefreshCw,
      };
    if (status.blockedSyncCount > 0)
      return {
        tone: "warning" as const,
        label: "Sync blocked",
        detail: `${pluralize(status.blockedSyncCount, "section")} need attention`,
        action: onRetrySync,
        actionLabel: "Retry",
        Icon: SatelliteDish,
      };
    if (status.pendingSyncCount > 0)
      return {
        tone: "syncing" as const,
        label: "Syncing",
        detail: `${pluralize(status.pendingSyncCount, "pending change", "pending changes")}`,
        action: onRetrySync,
        actionLabel: "Sync now",
        Icon: SatelliteDish,
      };
    if (status.canInstall && !status.isStandalone)
      return {
        tone: "install" as const,
        label: "Install app",
        detail: "Open like native",
        action: onInstallApp,
        actionLabel: "Install",
        Icon: SatelliteDish,
      };
    return null;
  }, [onApplyUpdate, onInstallApp, onRetrySync, status]);

  const dismissKey = statusChip
    ? `electron:pwa-chip:${statusChip.tone}:${statusChip.detail}`
    : null;
  const isChipDismissed = (() => {
    if (!dismissKey) return false;
    if (dismissedKeys[dismissKey]) return true;
    try {
      return window.localStorage.getItem(dismissKey) === "1";
    } catch {
      return false;
    }
  })();
  const showChip = Boolean(statusChip && !isChipDismissed);
  const showChipBelow = Boolean(isMobile && showChip);
  const showChipInline = Boolean(!isMobile && showChip);

  const dismissChip = () => {
    if (!dismissKey) return;
    try {
      window.localStorage.setItem(dismissKey, "1");
    } catch {
      /* noop */
    }
    setDismissedKeys((prev) => ({ ...prev, [dismissKey]: true }));
  };

  return (
    <div className={`ans-wrap${showChipBelow ? " ans-wrap--has-chip" : ""}`}>
      <nav className="ans" aria-label="Primary navigation">
        <span className="ans__brand" aria-label="Home">
          <span className="ans__brand-glyph" aria-hidden="true">
            ◈
          </span>
        </span>

        <span className="ans__sep" aria-hidden="true" />

        <div className="ans__tabs">
          <MagicToggle
            options={[
              {
                value: "movies",
                label: isMobile ? "🎬" : "Movies",
                ariaLabel: "Movies",
              },
              {
                value: "places",
                label: isMobile ? "📍" : "Places",
                ariaLabel: "Places",
              },
            ]}
            activeValue={activeTab}
            onChange={onTabChange}
            ariaLabel="Main navigation tabs"
          />
        </div>

        {showChipInline && statusChip ? (
          <>
            <span className="ans__sep ans__sep--wide" aria-hidden="true" />
            <StatusChipBanner
              chip={statusChip}
              className={`ans__chip ans__chip--inline ans__chip--${statusChip.tone}`}
              onDismiss={dismissChip}
            />
          </>
        ) : null}
      </nav>

      {showChipBelow && statusChip ? (
        <StatusChipBanner
          chip={statusChip}
          className={`ans__chip ans__chip--mobile-row ans__chip--${statusChip.tone}`}
          onDismiss={dismissChip}
        />
      ) : null}
    </div>
  );
};

export default AppNavStrip;
