import type { FC, ReactNode } from 'react';
import {
  getShellActionMeta,
  getWorkspaceMeta,
  type ShellActionId,
} from '@/app/shellState';
import { ELECTRON_LOGO_MARK_PATH } from '@/branding/logoAssets';
import UserSelection from '@/common/UserSelection';
import { BrainIcon, MessageIcon, NoteIcon, SpinIcon } from '@/common/icons';
import type { MainTab, User } from '@/shared/types';
import Button from '@/ui/Button';
import ThemeToggle from '@/ui/ThemeToggle';

interface ShellControlStripProps {
  activeTab: MainTab;
  currentUser: User | null;
  quizCompleted: boolean;
  onAction: (action: ShellActionId) => void;
  onTabChange: (tab: MainTab) => void;
}

const ACTION_ICONS: Record<ShellActionId, ReactNode> = {
  messages: <MessageIcon size={18} />,
  notes: <NoteIcon size={18} />,
  quiz: <BrainIcon size={18} />,
  'spin-match': <SpinIcon size={18} />,
};

const ShellControlStrip: FC<ShellControlStripProps> = ({
  activeTab,
  currentUser,
  quizCompleted,
  onAction,
  onTabChange,
}) => {
  const workspaceMeta = getWorkspaceMeta(activeTab);
  const actions = getShellActionMeta({
    activeTab,
    currentUser,
    quizCompleted,
  });

  return (
    <section className="shell-control-strip" aria-label="App controls">
      <div
        className={`shell-control-strip__bar shell-control-strip__bar--${activeTab}`}
        aria-label={`${workspaceMeta.title} controls`}
      >
        <div className="shell-control-strip__cluster shell-control-strip__cluster--session">
          <div className="shell-control-strip__brand" aria-hidden="true">
            <span className="workspace-header__brand-mark-shell shell-control-strip__mark-shell">
              <img
                src={ELECTRON_LOGO_MARK_PATH}
                alt=""
                className="workspace-header__brand-mark shell-control-strip__mark"
                draggable="false"
              />
            </span>
          </div>

          <UserSelection variant="shell" className="shell-control-strip__profiles" />
        </div>

        <div className="shell-control-strip__cluster shell-control-strip__cluster--context">
          <span className="shell-control-strip__cluster-label">
            <span className="shell-control-strip__cluster-label-icon" aria-hidden="true">
              {workspaceMeta.icon}
            </span>
            {workspaceMeta.eyebrow}
          </span>
          <div className="shell-control-strip__status" aria-live="polite">
            <span className="shell-control-strip__status-title">
              {currentUser ?? 'Guest mode'}
            </span>
            <span className="shell-control-strip__status-copy">
              {workspaceMeta.title} is ready for shared actions.
            </span>
          </div>
          <ThemeToggle
            activeTab={activeTab}
            onChange={onTabChange}
            compact
            className="shell-control-strip__theme-toggle"
            label="Switch between Movies and Places"
          />
        </div>

        <div className="shell-control-strip__cluster shell-control-strip__cluster--actions">
          <div className="shell-control-strip__actions" role="group" aria-label="Quick actions">
            {actions.map((action) => (
              <Button
                key={action.id}
                type="button"
                size="md"
                variant="ghost"
                className={`shell-control-strip__action-button${action.id === 'quiz' ? ' shell-control-strip__action-button--priority' : ''}`}
                leftIcon={ACTION_ICONS[action.id]}
                title={action.description}
                aria-label={`${action.label}. ${action.description}`}
                onClick={() => onAction(action.id)}
              >
                <span className="shell-control-strip__action-copy">
                  <span className="shell-control-strip__action-label">{action.label}</span>
                  <span className="shell-control-strip__action-description">{action.description}</span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShellControlStrip;
