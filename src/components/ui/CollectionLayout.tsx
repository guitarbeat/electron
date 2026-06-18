import React from "react";
import { colors, spacing, typography } from "@/theme/tokens";

// ============================================================================
// CollectionEmptyState
// ============================================================================

interface CollectionEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: string;
}

const CollectionEmptyState: React.FC<CollectionEmptyStateProps> = ({
  padding = spacing["3xl"],
  className = "",
  style,
  children,
  ...props
}) => (
  <div
    className={`collection-empty-state ${className}`.trim()}
    style={{
      gridColumn: "1 / -1",
      textAlign: "center",
      padding,
      color: colors.textTertiary,
      ...typography.presets.bodySm,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

// ============================================================================
// CollectionGrid
// ============================================================================

interface CollectionGridProps extends React.HTMLAttributes<HTMLDivElement> {
  minColumnWidth?: string;
  gap?: string;
}

const CollectionGrid: React.FC<CollectionGridProps> = ({
  minColumnWidth = "280px",
  gap = spacing.lg,
  className = "",
  style,
  children,
  ...props
}) => (
  <div
    className={`collection-grid ${className}`.trim()}
    style={{
      ["--collection-grid-min-column-width" as string]: minColumnWidth,
      ["--collection-grid-gap" as string]: gap,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

// ============================================================================
// CollectionSection
// ============================================================================

interface CollectionSectionProps extends React.HTMLAttributes<HTMLElement> {
  heading: React.ReactNode;
  count?: number;
  /** When false, renders content only (keeps section id for scroll targets). */
  showHeading?: boolean;
  /** When false, hides the count pill even if `count` is set. */
  showCount?: boolean;
  tone?: "default" | "incoming" | "completed";
  titleClassName?: string;
}

const CollectionSection: React.FC<CollectionSectionProps> = ({
  heading,
  count,
  showHeading = true,
  showCount,
  tone = "default",
  className = "",
  titleClassName = "",
  style,
  children,
  ...props
}) => {
  const headingClassName = [
    "workspace-section-heading",
    tone === "incoming" ? "workspace-section-heading--incoming" : "",
    tone === "completed" ? "workspace-section-heading--completed" : "",
    titleClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const headingLabel =
    typeof heading === "string" || typeof heading === "number"
      ? String(heading)
      : "Section";
  const shouldShowCount =
    showCount ?? (typeof count === "number" && showHeading);

  return (
    <section
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: showHeading ? spacing.sm : 0,
        ...style,
      }}
      {...props}
    >
      {showHeading ? (
        <h3
          className={headingClassName}
          aria-label={
            typeof count === "number"
              ? `${headingLabel}, ${count} items`
              : undefined
          }
        >
          <span className="workspace-section-heading__content">
            <span className="workspace-section-heading__label">{heading}</span>
            {shouldShowCount ? (
              <span className="workspace-section-heading__count" aria-hidden="true">
                {count}
              </span>
            ) : null}
          </span>
        </h3>
      ) : null}
      {children}
    </section>
  );
};

// ============================================================================
// WorkspacePanels
// ============================================================================

interface WorkspacePanelsProps {
  first: React.ReactNode;
  second: React.ReactNode;
  desktopColumns?: string;
  gap?: string;
  mobileGap?: string;
  className?: string;
  firstClassName?: string;
  secondClassName?: string;
  stickyFirst?: boolean;
  stickyOffset?: string;
  firstAs?: React.ElementType;
  secondAs?: React.ElementType;
}

const WorkspacePanels: React.FC<WorkspacePanelsProps> = ({
  first,
  second,
  desktopColumns = "minmax(280px, 320px) 1fr",
  gap = spacing.xl,
  mobileGap = gap,
  className = "",
  firstClassName = "",
  secondClassName = "",
  stickyFirst = false,
  stickyOffset = spacing.xl,
  firstAs: FirstTag = "div",
  secondAs: SecondTag = "div",
}) => {
  return (
    <div
      className={`workspace-layout ${className}`.trim()}
      style={
        {
          "--workspace-layout-columns": desktopColumns,
          "--workspace-layout-gap": gap,
          "--workspace-layout-mobile-gap": mobileGap,
        } as React.CSSProperties
      }
    >
      <FirstTag
        className={`workspace-layout__controls ${
          stickyFirst ? "workspace-layout__controls--sticky" : ""
        } ${firstClassName}`.trim()}
        style={
          stickyFirst
            ? ({
                "--workspace-layout-sticky-offset": stickyOffset,
              } as React.CSSProperties)
            : undefined
        }
      >
        {first}
      </FirstTag>
      <SecondTag
        className={`workspace-layout__content ${secondClassName}`.trim()}
      >
        {second}
      </SecondTag>
    </div>
  );
};

export {
  CollectionEmptyState,
  CollectionGrid,
  CollectionSection,
  WorkspacePanels,
};
