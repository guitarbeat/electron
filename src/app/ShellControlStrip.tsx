import type { FC } from 'react';
import { getWorkspaceMeta } from '@/app/shellState';
import UserSelection from '@/common/UserSelection';
import type { MainTab } from '@/shared/types';
import ThemeToggle from '@/ui/ThemeToggle';

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
    <section className="shell-control-strip" aria-label="App controls">
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

        <div className="shell-control-strip__cluster shell-control-strip__cluster--actions" />
      </div>
    </section>
  );
};

export default ShellControlStrip;
