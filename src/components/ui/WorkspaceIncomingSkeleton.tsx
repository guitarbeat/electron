import React from "react";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";

export type WorkspaceIncomingSkeletonVariant = "stack" | "grid";

interface WorkspaceIncomingSkeletonProps {
  variant: WorkspaceIncomingSkeletonVariant;
  hint?: string;
  gridClass?: string;
  minColumnWidth?: number;
}

const WorkspaceIncomingSkeleton: React.FC<WorkspaceIncomingSkeletonProps> = ({
  variant,
  hint = "Loading suggestions",
  gridClass,
  minColumnWidth,
}) => {
  if (variant === "grid") {
    return (
      <ChromaCollectionGrid
        className={gridClass}
        minColumnWidth={minColumnWidth}
        aria-hidden="true"
      >
        {["a", "b"].map((key) => (
          <div key={key} className="places-suggestion-skeleton skeleton" />
        ))}
      </ChromaCollectionGrid>
    );
  }

  return (
    <div
      className="suggestion-stack-stage suggestion-stack-stage--incoming"
      aria-hidden
    >
      <div className="suggestion-stack-skeleton">
        <div className="suggestion-stack-skeleton__card suggestion-stack-skeleton__card--back" />
        <div className="suggestion-stack-skeleton__card suggestion-stack-skeleton__card--mid" />
        <div className="suggestion-stack-skeleton__card" />
      </div>
      <p className="suggestion-stack__hint">{hint}</p>
    </div>
  );
};

export default WorkspaceIncomingSkeleton;
