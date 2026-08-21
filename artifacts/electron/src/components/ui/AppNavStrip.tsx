import { type FC, useRef, useEffect, useMemo, useState } from 'react';
import { Film, MapPin, RefreshCw, RotateCw, SatelliteDish, WifiOff, X } from 'lucide-react';
import type { MainTab } from '@/shared/types';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import MagicToggle from './MagicToggle';

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
  status?: AppNavStripStatus;
  onInstallApp?: () => void;
  onApplyUpdate?: () => void;
  onRetrySync?: () => void;
  onOpenMessages?: () => void;
  onOpenQuiz?: () => void;
}

const pluralize = (n: number, s: string, p = `${s}s`) => `${n} ${n === 1 ? s : p}`;

const AppNavStrip: FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenSpin,
  status,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
}) => {
  const navRef = useRef<HTMLElement>(null);
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const [dismissedKeys, setDismissedKeys] = useState<Record<string, true>>({});

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const btns = Array.from(nav.querySelectorAll<HTMLElement>('.ans__btn'));
    const cleanups = btns.map((el) => {
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const offsetX = (e.clientX - r.left - r.width / 2) * 0.3;
        const offsetY = (e.clientY - r.top - r.height / 2) * 0.3;
        void import('motion').then(({ animate }) => {
          animate(el, { transform: `translate(${offsetX}px, ${offsetY}px)` }, { duration: 0.35, ease: [0.16, 1, 0.3, 1] });
        });
      };
      const onLeave = () => {
        void import('motion').then(({ animate }) => {
          animate(el, { transform: 'translate(0px, 0px)' }, { duration: 1.1, ease: [0.25, 1, 0.5, 1] });
        });
      };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      return () => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
      };
    });
    return () => cleanups.forEach((fn) => fn());
  }, [activeTab]);

  const statusChip = useMemo(() => {
    if (!status) return null;
    if (!status.isOnline)
      return { tone: 'offline' as const, label: 'Offline', detail: 'Local cache only', action: undefined, actionLabel: undefined, Icon: WifiOff };
    if (status.hasUpdateReady)
      return { tone: 'update' as const, label: 'Update ready', detail: 'Refresh app shell', action: onApplyUpdate, actionLabel: 'Refresh', Icon: RefreshCw };
    if (status.blockedSyncCount > 0)
      return { tone: 'warning' as const, label: 'Sync blocked', detail: `${pluralize(status.blockedSyncCount, 'section')} need attention`, action: onRetrySync, actionLabel: 'Retry', Icon: SatelliteDish };
    if (status.pendingSyncCount > 0)
      return { tone: 'syncing' as const, label: 'Syncing', detail: `${pluralize(status.pendingSyncCount, 'pending change', 'pending changes')}`, action: onRetrySync, actionLabel: 'Sync now', Icon: SatelliteDish };
    if (status.canInstall && !status.isStandalone)
      return { tone: 'install' as const, label: 'Install app', detail: 'Open like native', action: onInstallApp, actionLabel: 'Install', Icon: SatelliteDish };
    return null;
  }, [onApplyUpdate, onInstallApp, onRetrySync, status]);

  const dismissKey = statusChip ? `electron:pwa-chip:${statusChip.tone}:${statusChip.detail}` : null;
  const isChipDismissed = (() => {
    if (!dismissKey) return false;
    if (dismissedKeys[dismissKey]) return true;
    try { return window.localStorage.getItem(dismissKey) === '1'; } catch { return false; }
  })();
  const showChip = Boolean(isMobile && statusChip && !isChipDismissed);

  const dismissChip = () => {
    if (!dismissKey) return;
    try { window.localStorage.setItem(dismissKey, '1'); } catch { /* noop */ }
    setDismissedKeys((prev) => ({ ...prev, [dismissKey]: true }));
  };

  return (
    <nav ref={navRef} className="ans" aria-label="Primary navigation">
      <span className="ans__brand" aria-label="Collab">
        <span className="ans__brand-glyph" aria-hidden="true">◈</span>
        Collab
      </span>

      <span className="ans__sep" aria-hidden="true" />

      <div className="ans__magic-toggle-wrapper">
        <MagicToggle
          options={[
            {
              value: 'movies',
              label: (
                <span className="ans__tab-label">
                  <Film size={13} strokeWidth={2.2} aria-hidden="true" />
                  <span>Movies</span>
                </span>
              ),
              ariaLabel: 'Movies workspace',
            },
            {
              value: 'places',
              label: (
                <span className="ans__tab-label">
                  <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                  <span>Places</span>
                </span>
              ),
              ariaLabel: 'Places workspace',
            },
          ]}
          activeValue={activeTab}
          onChange={(val) => onTabChange(val as MainTab)}
          ariaLabel="Workspace navigation"
        />
      </div>

      {onOpenSpin && (
        <>
          <span className="ans__sep" aria-hidden="true" />
          <button
            type="button"
            className="ans__btn ans__btn--spin"
            onClick={onOpenSpin}
            aria-label="Spin the wheel to pick a movie"
          >
            <RotateCw size={13} strokeWidth={2.4} aria-hidden="true" />
            <span className="ans__btn-label">Spin</span>
          </button>
        </>
      )}

      {showChip && statusChip && (
        <>
          <span className="ans__sep ans__sep--wide" aria-hidden="true" />
          <div className={`ans__chip ans__chip--${statusChip.tone}`} role="status">
            <statusChip.Icon size={14} strokeWidth={2.2} aria-hidden="true" />
            <span className="ans__chip-copy">
              <strong>{statusChip.label}</strong>
              <span>{statusChip.detail}</span>
            </span>
            {statusChip.action && statusChip.actionLabel && (
              <button type="button" className="ans__chip-action" onClick={statusChip.action}>
                {statusChip.actionLabel}
              </button>
            )}
            <button
              type="button"
              className="ans__chip-dismiss"
              onClick={dismissChip}
              aria-label={`Dismiss ${statusChip.label.toLowerCase()} status`}
            >
              <X size={13} strokeWidth={2.3} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </nav>
  );
};

export default AppNavStrip;
