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
        <div className="shell-control-strip__toggle-row">
          <ThemeToggle
            activeTab={activeTab}
            onChange={onTabChange}
            compact
            className="shell-control-strip__theme-toggle"
            label="Switch between Movies and Places"
          />
        </div>

        <div className="shell-control-strip__profiles-row">
          <UserSelection variant="shell" className="shell-control-strip__profiles" />
        </div>
      </div>
    </section>
  );
};

export default ShellControlStrip;
