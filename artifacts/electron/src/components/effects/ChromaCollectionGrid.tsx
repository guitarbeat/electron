import React from "react";
import { CollectionGrid } from "@/ui/CollectionLayout";
import { useChromaSpotlight } from "@/hooks/useChromaSpotlight";

interface ChromaCollectionGridProps
  extends React.ComponentProps<typeof CollectionGrid> {
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
  const { rootRef, fadeRef, handlePointerMove, handlePointerLeave } =
    useChromaSpotlight({ radius: spotlightRadius });

  return (
    <div
      ref={rootRef}
      className={`chroma-grid-root ${className}`.trim()}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <CollectionGrid className="chroma-grid-root__grid" {...props}>
        {children}
      </CollectionGrid>
      <div className="chroma-overlay" aria-hidden="true" />
      <div ref={fadeRef} className="chroma-fade" aria-hidden="true" />
    </div>
  );
};

export default ChromaCollectionGrid;
