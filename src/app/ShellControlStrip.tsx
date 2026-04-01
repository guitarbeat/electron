import type { FC } from 'react';
import { getWorkspaceMeta } from '@/app/shellState';
import UserSelection from '@/common/UserSelection';
import type { MainTab } from '@/shared/types';
import ThemeToggle from '@/ui/ThemeToggle';
import './ShellControlStrip.css';

interface ShellControlStripProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

const TICKER_TEXT =
  '\u00a0\u00a0★ NOW ONLINE · VISITORS: 1,337 · ★ BEST VIEWED IN NETSCAPE 4.0 · PLEASE DO NOT HOTLINK · FREE WINAMP SKIN INSIDE · ★ ELECTRON MOVIE NIGHT v2.0 · \u00a0\u00a0★ NOW ONLINE · VISITORS: 1,337 · ★ BEST VIEWED IN NETSCAPE 4.0 · PLEASE DO NOT HOTLINK · FREE WINAMP SKIN INSIDE · ★ ELECTRON MOVIE NIGHT v2.0 ·';

const ShellControlStrip: FC<ShellControlStripProps> = ({
  activeTab,
  onTabChange,
}) => {
  const workspaceMeta = getWorkspaceMeta(activeTab);

  return (
    <section
      className="shell-control-strip shell-control-strip--retro"
      aria-label="App controls"
    >
      <div className="y2k-title-bar" aria-hidden="true">
        <span className="y2k-title-bar__icon">🎬</span>
        <span className="y2k-title-bar__text">★ ELECTRON MOVIE NIGHT ★</span>
        <div className="y2k-title-bar__controls">
          <span className="y2k-title-bar__btn">_</span>
          <span className="y2k-title-bar__btn">□</span>
          <span className="y2k-title-bar__btn">✕</span>
        </div>
      </div>

      <div
        className={`shell-control-strip__bar shell-control-strip__bar--${activeTab}`}
        aria-label={`${workspaceMeta.title} controls`}
      >
        <div className="shell-control-strip__cluster shell-control-strip__cluster--session">
          <UserSelection variant="shell" className="shell-control-strip__profiles" />
        </div>

        <div className="shell-control-strip__cluster shell-control-strip__cluster--center">
          <ThemeToggle
            activeTab={activeTab}
            onChange={onTabChange}
            compact
            className="shell-control-strip__theme-toggle"
            label="Switch between Movies and Places"
          />
        </div>

        <div className="shell-control-strip__cluster shell-control-strip__cluster--actions">
          <div className="y2k-online-badge" aria-label="Online status">
            <span className="y2k-online-badge__dot" aria-hidden="true">●</span>
            <span className="y2k-online-badge__label">
              <span className="y2k-online-badge__top">ONLINE</span>
              <span className="y2k-online-badge__bottom">56K</span>
            </span>
          </div>
        </div>
      </div>

      <div className="y2k-ticker" aria-hidden="true">
        <div className="y2k-ticker__inner">
          <span className="y2k-ticker__text">{TICKER_TEXT}</span>
        </div>
      </div>
    </section>
  );
};

export default ShellControlStrip;
