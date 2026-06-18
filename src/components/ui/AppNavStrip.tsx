import { type FC, type ReactNode, useMemo, useState } from "react";
import {
  CircleDot,
  MessageCircle,
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
  onOpenSpin?: () => void;
  onOpenMessages?: () => void;
  status?: AppNavStripStatus;
  onInstallApp?: () => void;
  onApplyUpdate?: () => void;
  onRetrySync?: () => void;
}

const pluralize = (n: number, s: string, p = `${s}s`) =>
  `${n} ${n === 1 ? s : p}`;

const AppNavStrip: FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenSpin,
  onOpenMessages,
  status,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
}) => {
  const { isMobile } = useViewport();
  const [dismissedKeys, setDismissedKeys] = useState<Record<string, true>>({});

  const statusChip = useMemo(() => {
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

  const utilityButtons = [
    onOpenSpin
      ? {
          key: "spin",
          label: "Open spin wheel",
          title: "Spin wheel",
          onClick: onOpenSpin,
          icon: <CircleDot size={16} strokeWidth={2.2} aria-hidden="true" />,
        }
      : null,
    isMobile && onOpenMessages
      ? {
          key: "messages",
          label: "Open messages",
          title: "Messages",
          onClick: onOpenMessages,
          icon: <MessageCircle size={16} strokeWidth={2.2} aria-hidden="true" />,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    title: string;
    onClick: () => void;
    icon: ReactNode;
  }>;

  return (
    <div className={`ans-wrap${showChipBelow ? " ans-wrap--has-chip" : ""}`}>
      <nav className="ans" aria-label="Primary navigation">
        <span className="ans__brand" aria-label="Electron">
          <span className="ans__brand-glyph" aria-hidden="true">
            ◈
          </span>
          <span className="ans__brand-text">Electron</span>
        </span>

        <span className="ans__sep" aria-hidden="true" />

        <div className="ans__tabs">
          <MagicToggle<MainTab>
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

        {utilityButtons.length > 0 ? (
          <>
            <span className="ans__sep ans__sep--wide" aria-hidden="true" />
            <div className="ans__tools" role="group" aria-label="Quick actions">
              {utilityButtons.map((button) => (
                <button
                  key={button.key}
                  type="button"
                  className="ans__icon-btn"
                  onClick={button.onClick}
                  aria-label={button.label}
                  title={button.title}
                >
                  {button.icon}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {showChipInline && statusChip ? (
          <>
            <span className="ans__sep ans__sep--wide" aria-hidden="true" />
            <div
              className={`ans__chip ans__chip--inline ans__chip--${statusChip.tone}`}
              role="status"
            >
              <statusChip.Icon size={14} strokeWidth={2.2} aria-hidden="true" />
              <span className="ans__chip-copy">
                <strong>{statusChip.label}</strong>
                <span>{statusChip.detail}</span>
              </span>
              {statusChip.action && statusChip.actionLabel ? (
                <button
                  type="button"
                  className="ans__chip-action"
                  onClick={statusChip.action}
                  aria-label={statusChip.actionLabel}
                  title={statusChip.actionLabel}
                >
                  {statusChip.actionLabel}
                </button>
              ) : null}
              <button
                type="button"
                className="ans__chip-dismiss"
                onClick={dismissChip}
                aria-label={`Dismiss ${statusChip.label.toLowerCase()} status`}
                title={`Dismiss ${statusChip.label.toLowerCase()} status`}
              >
                <X size={13} strokeWidth={2.3} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : null}
      </nav>

      {showChipBelow && statusChip ? (
        <div
          className={`ans__chip ans__chip--mobile-row ans__chip--${statusChip.tone}`}
          role="status"
        >
          <statusChip.Icon size={14} strokeWidth={2.2} aria-hidden="true" />
          <span className="ans__chip-copy">
            <strong>{statusChip.label}</strong>
            <span>{statusChip.detail}</span>
          </span>
          {statusChip.action && statusChip.actionLabel && (
            <button
              type="button"
              className="ans__chip-action"
              onClick={statusChip.action}
              aria-label={statusChip.actionLabel}
              title={statusChip.actionLabel}
            >
              {statusChip.actionLabel}
            </button>
          )}
          <button
            type="button"
            className="ans__chip-dismiss"
            onClick={dismissChip}
            aria-label={`Dismiss ${statusChip.label.toLowerCase()} status`}
            title={`Dismiss ${statusChip.label.toLowerCase()} status`}
          >
            <X size={13} strokeWidth={2.3} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AppNavStrip;
