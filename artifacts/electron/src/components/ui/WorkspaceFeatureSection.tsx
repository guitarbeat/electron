import type { FC, ReactNode } from "react";

export interface WorkspaceFeatureSectionProps {
  id: string;
  ariaLabel: string;
  title?: string;
  variant?: "panel" | "embedded";
  bodyClassName?: string;
  children: ReactNode;
}

export const WorkspaceFeatureSectionLoading: FC<{ label: string }> = ({
  label,
}) => (
  <p className="workspace-feature-section__loading" aria-live="polite" role="status">
    {label}
  </p>
);

const WorkspaceFeatureSection: FC<WorkspaceFeatureSectionProps> = ({
  id,
  ariaLabel,
  title,
  variant = "panel",
  bodyClassName,
  children,
}) => (
  <section
    id={id}
    className={`workspace-feature-section${
      variant === "embedded" ? " workspace-feature-section--embedded" : ""
    }`}
    aria-label={ariaLabel}
  >
    {title ? (
      <header className="workspace-feature-section__header">
        <h2 className="workspace-feature-section__title">{title}</h2>
      </header>
    ) : null}
    <div
      className={["workspace-feature-section__body", bodyClassName]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  </section>
);

export default WorkspaceFeatureSection;
