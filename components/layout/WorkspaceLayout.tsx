import React from 'react';
import './WorkspaceLayout.css';

interface WorkspaceLayoutProps {
  isMobile: boolean;
  controls: React.ReactNode;
  content: React.ReactNode;
  mobileTopBar?: React.ReactNode;
  mobileSheet?: React.ReactNode;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  isMobile,
  controls,
  content,
  mobileTopBar,
  mobileSheet,
}) => {
  if (isMobile) {
    return (
      <div className="workspace-layout workspace-layout--mobile">
        {mobileTopBar ? <div className="workspace-layout__mobile-topbar">{mobileTopBar}</div> : null}
        <div className="workspace-layout__content">{content}</div>
        {mobileSheet}
      </div>
    );
  }

  return (
    <div className="workspace-layout">
      <aside className="workspace-layout__controls" aria-label="Watchlist controls">
        {controls}
      </aside>
      <section className="workspace-layout__content" aria-label="Watchlist content">
        {content}
      </section>
    </div>
  );
};

export default WorkspaceLayout;
