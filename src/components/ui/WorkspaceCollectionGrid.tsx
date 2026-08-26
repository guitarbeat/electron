import React from "react";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";

interface WorkspaceCollectionGridProps<T> {
  className: string;
  minColumnWidth: string;
  items: readonly T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T) => string;
  empty: React.ReactNode;
}

function WorkspaceCollectionGrid<T>({
  className,
  minColumnWidth,
  items,
  renderItem,
  getItemKey,
  empty,
}: WorkspaceCollectionGridProps<T>) {
  return (
    <ChromaCollectionGrid
      className={className}
      minColumnWidth={minColumnWidth}
    >
      {items.length > 0
        ? items.map((item, index) => (
            <React.Fragment key={getItemKey(item)}>
              {renderItem(item, index)}
            </React.Fragment>
          ))
        : empty}
    </ChromaCollectionGrid>
  );
}

export default WorkspaceCollectionGrid;
