import React from "react";
import { CollectionGrid } from "@/components/ui";
import { useChromaSpotlight } from "@/hooks";

interface ChromaCollectionGridProps extends React.ComponentProps<
  typeof CollectionGrid
> {
  spotlightRadius?: number;
}

/**
 * Collection grid with ChromaGrid-style cursor spotlight (React Bits).
 * Desaturates the grid outside a soft radial follow-spot; cards use .chroma-card.
 */
const ChromaCollectionGrid: React.FC<ChromaCollectionGridProps> = ({
  spotlightRadius = 280,
  className = "",
  children,
  ...props
}) => {
  const {
    rootRef,
    fadeRef,
    handlePointerEnter,
    handlePointerMove,
    handlePointerLeave,
  } = useChromaSpotlight({ radius: spotlightRadius });

  return (
    <div
      ref={rootRef}
      className={`chroma-grid-root ${className}`.trim()}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <CollectionGrid className={"chroma-grid-inner"} {...props}>
        {children}
      </CollectionGrid>
      <div className={"chroma-grid-overlay"} aria-hidden="true" />
      <div ref={fadeRef} className={"chroma-grid-fade"} aria-hidden="true" />
    </div>
  );
};

export default ChromaCollectionGrid;
