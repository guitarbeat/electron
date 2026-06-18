import React from "react";
import type { Place, PlaceSuggestion, User } from "@/shared/types";
import { CollectionSection } from "@/ui/CollectionLayout";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import PlaceSuggestionCard from "./PlaceSuggestionCard";
import PlacesGrid from "./PlacesGrid";
import WorkspaceCollectionLoading from "@/components/ui/WorkspaceCollectionLoading";
import { WorkspaceGlobalEmpty } from "@/components/ui/WorkspaceEmptyState";
import { useViewport } from "@/app/ViewportContext";
import type { PlaceSections } from "./lib/placeSections";
import {
  PLACES_GRID_CLASS,
  PLACES_GRID_MIN_COL,
  workspaceSectionIds,
} from "@/utils/workspaceConfig";
import { workspaceSectionLabels } from "@/utils/workspaceSectionLabels";

interface PlacesSectionBodyProps {
  sections: PlaceSections;
  isLoading: boolean;
  pendingSuggestions: PlaceSuggestion[];
  currentUser: User | null;
  processingSuggestionId: string | null;
  onAcceptSuggestion: (suggestion: PlaceSuggestion) => void;
  onRejectSuggestion: (suggestionId: string, name: string) => void;
  canEdit: boolean;
  isSubmitting: boolean;
  activeCardId: string | null;
  onCardTap: (place: Place) => void;
  onMarkVisited: (id: string) => void;
  onMarkUnvisited: (id: string) => void;
  onDelete: (place: Place) => void;
  onEdit: (place: Place) => void;
  mapSlot?: React.ReactNode;
}

const PlacesSectionBody: React.FC<PlacesSectionBodyProps> = ({
  sections,
  isLoading,
  pendingSuggestions,
  currentUser,
  processingSuggestionId,
  onAcceptSuggestion,
  onRejectSuggestion,
  canEdit,
  isSubmitting,
  activeCardId,
  onCardTap,
  onMarkVisited,
  onMarkUnvisited,
  onDelete,
  onEdit,
  mapSlot,
}) => {
  const { isMobile } = useViewport();
  const sectionLabels = workspaceSectionLabels("places", isMobile);
  const sectionIds = workspaceSectionIds("places");

  const allPlaces = [...sections.queue, ...sections.completed];
  const hasPlaces = allPlaces.length > 0;
  const showInitialLoading = isLoading && !hasPlaces && pendingSuggestions.length === 0;
  const showGlobalEmpty =
    !isLoading && !hasPlaces && pendingSuggestions.length === 0;

  if (showInitialLoading) {
    return <WorkspaceCollectionLoading tab="places" />;
  }

  if (showGlobalEmpty) {
    return (
      <ChromaCollectionGrid
        className={PLACES_GRID_CLASS}
        minColumnWidth={PLACES_GRID_MIN_COL}
      >
        <WorkspaceGlobalEmpty tab="places" />
      </ChromaCollectionGrid>
    );
  }

  return (
    <div className="workspace-section-body">
      {mapSlot}

      {pendingSuggestions.length > 0 && (
        <CollectionSection
          heading={sectionLabels.incoming}
          tone="incoming"
          id={sectionIds.incoming}
        >
          <ChromaCollectionGrid
            className={PLACES_GRID_CLASS}
            minColumnWidth={PLACES_GRID_MIN_COL}
          >
            {pendingSuggestions.map((suggestion) => (
              <PlaceSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => onAcceptSuggestion(suggestion)}
                onReject={() =>
                  onRejectSuggestion(suggestion.id, suggestion.name)
                }
                canRespond={canEdit}
                disableActions={!currentUser}
                isProcessing={processingSuggestionId === suggestion.id}
              />
            ))}
          </ChromaCollectionGrid>
        </CollectionSection>
      )}

      {sections.queue.length > 0 && (
        <CollectionSection
          heading={sectionLabels.queue}
          id={sectionIds.queue}
        >
          <PlacesGrid
            places={sections.queue}
            variant="queue"
            canEdit={canEdit}
            isSubmitting={isSubmitting}
            activeCardId={activeCardId}
            onCardTap={onCardTap}
            onMarkVisited={onMarkVisited}
            onMarkUnvisited={onMarkUnvisited}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </CollectionSection>
      )}

      {sections.completed.length > 0 && (
        <CollectionSection
          heading={sectionLabels.completed}
          tone="completed"
          id={sectionIds.completed}
        >
          <PlacesGrid
            places={sections.completed}
            variant="completed"
            canEdit={canEdit}
            isSubmitting={isSubmitting}
            activeCardId={activeCardId}
            onCardTap={onCardTap}
            onMarkVisited={onMarkVisited}
            onMarkUnvisited={onMarkUnvisited}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </CollectionSection>
      )}
    </div>
  );
};

export default PlacesSectionBody;
