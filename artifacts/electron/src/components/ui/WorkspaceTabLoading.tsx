import type { FC, ReactNode } from "react";

interface WorkspaceTabLoadingProps {
  emoji: string;
  label: string;
  children?: ReactNode;
}

const WorkspaceTabLoading: FC<WorkspaceTabLoadingProps> = ({
  emoji,
  label,
  children,
}) => (
  <div className="workspace-tab-loading" role="status" aria-live="polite">
    <span className="workspace-tab-loading__emoji" aria-hidden="true">
      {emoji}
    </span>
    <span className="workspace-tab-loading__label">{label}</span>
    {children}
  </div>
);

export default WorkspaceTabLoading;
