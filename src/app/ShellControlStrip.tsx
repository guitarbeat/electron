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

const WORKSPACE_COPY: Record<MainTab, string> = {
  queue: 'Switch between spaces or jump straight into the movie rituals tied to the watchlist.',
  places: 'Keep the shared chat and quiz close while you plan date spots together.',
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
  const sessionLabel = currentUser ? `${currentUser} active` : 'Guest mode';

  return (
    <section className="shell-control-strip" aria-label="App controls">
      <div className="shell-control-strip__grid">
        <section className="shell-control-strip__session ui-control-surface" aria-label="Profiles">
          <div className="shell-control-strip__brand">
            <span className="workspace-header__brand-mark-shell shell-control-strip__mark-shell">
              <img
                src={ELECTRON_LOGO_MARK_PATH}
                alt=""
                className="workspace-header__brand-mark shell-control-strip__mark"
                draggable="false"
              />
            </span>
            <div className="workspace-control-panel__header">
              <p className="workspace-control-panel__eyebrow">Shared Session</p>
              <h2 className="workspace-control-panel__title">Profiles</h2>
              <p className="workspace-control-panel__copy">
                Switch profiles, manage PINs, and keep the shared space aligned.
              </p>
            </div>
          </div>

          <div className="workspace-control-panel__meta shell-control-strip__meta">
            <span className="workspace-control-panel__pill">{sessionLabel}</span>
            <span className="workspace-control-panel__pill">{workspaceMeta.title}</span>
          </div>

          <UserSelection variant="shell" className="shell-control-strip__profiles" />
        </section>

        <section
          className={`shell-control-strip__workspace workspace-control-panel ui-control-surface shell-control-strip__workspace--${activeTab}`}
          aria-label={`${workspaceMeta.title} controls`}
        >
          <div className="shell-control-strip__workspace-header">
            <div className="workspace-control-panel__header">
              <p className="workspace-control-panel__eyebrow">{workspaceMeta.eyebrow}</p>
              <h2 className="workspace-control-panel__title shell-control-strip__workspace-title">
                <span className="shell-control-strip__workspace-title-icon" aria-hidden="true">
                  {workspaceMeta.icon}
                </span>
                {workspaceMeta.title}
              </h2>
              <p className="workspace-control-panel__copy">{WORKSPACE_COPY[activeTab]}</p>
            </div>

            <ThemeToggle
              activeTab={activeTab}
              onChange={onTabChange}
              className="shell-control-strip__theme-toggle"
              label="Switch between Movies and Places"
            />
          </div>

          <div className="shell-control-strip__actions" role="group" aria-label="Quick actions">
            {actions.map((action) => (
              <Button
                key={action.id}
                type="button"
                size="md"
                variant={action.id === 'quiz' ? 'secondary' : 'ghost'}
                className="shell-control-strip__action-button"
                leftIcon={ACTION_ICONS[action.id]}
                title={action.description}
                onClick={() => onAction(action.id)}
              >
                <>
                  <span className="shell-control-strip__action-label">{action.label}</span>
                  <span className="shell-control-strip__action-description">
                    {action.description}
                  </span>
                </>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};

export default ShellControlStrip;
