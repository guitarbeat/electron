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
  '\u00a0\u00a0★ AARON & ELECTRA\'S MOVIE NIGHT · 🎬 NO SPOILERS ALLOWED · 🍿 POPCORN MANDATORY · 2 HEARTS · 1 SCREEN · ★ MADE WITH LOVE · SPIN THE WHEEL · PICK TOGETHER · \u00a0\u00a0★ AARON & ELECTRA\'S MOVIE NIGHT · 🎬 NO SPOILERS ALLOWED · 🍿 POPCORN MANDATORY · 2 HEARTS · 1 SCREEN · ★ MADE WITH LOVE · SPIN THE WHEEL · PICK TOGETHER ·';

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
