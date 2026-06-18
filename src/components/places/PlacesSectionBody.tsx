import React from "react";
import type { Place, PlaceSuggestion, User } from "@/shared/types";
import { CollectionSection } from "@/ui/CollectionLayout";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import PlaceSuggestionCard from "./PlaceSuggestionCard";
import PlacesGrid from "./PlacesGrid";
import WorkspaceIncomingSkeleton from "@/ui/WorkspaceIncomingSkeleton";
import WorkspaceCollectionLoading from "@/components/ui/WorkspaceCollectionLoading";
import { WorkspaceGlobalEmpty } from "@/components/ui/WorkspaceEmptyState";
import { useViewport } from "@/app/ViewportContext";
import type { PlaceSections } from "./lib/placeSections";
import {
  PLACES_GRID_CLASS,
  PLACES_GRID_MIN_COL,
  workspaceSectionIds,
  workspaceSectionLabels,
} from "@/utils/workspaceConfig";

interface PlacesSectionBodyProps {
  sections: PlaceSections;
  isLoading: boolean;
  isSuggestionsLoading?: boolean;
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
  onAddPlaceFocus?: () => void;
  emptyActionLabel?: string;
  emptyActionBusy?: boolean;
}

const PlacesSectionBody: React.FC<PlacesSectionBodyProps> = ({
  sections,
  isLoading,
  isSuggestionsLoading = false,
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
  onAddPlaceFocus,
  emptyActionLabel,
  emptyActionBusy,
}) => {
  const { isMobile } = useViewport();
  const sectionLabels = workspaceSectionLabels("places", isMobile);
  const sectionIds = workspaceSectionIds("places");

  const allPlaces = [...sections.queue, ...sections.completed];
  const hasPlaces = allPlaces.length > 0;
  const showInitialLoading =
    (isLoading || isSuggestionsLoading) &&
    !hasPlaces &&
    pendingSuggestions.length === 0;
  const showGlobalEmpty =
    !isLoading &&
    !isSuggestionsLoading &&
    !hasPlaces &&
    pendingSuggestions.length === 0;

  if (showInitialLoading) {
    return <WorkspaceCollectionLoading tab="places" />;
  }

  if (showGlobalEmpty) {
    return (
      <ChromaCollectionGrid
        className={PLACES_GRID_CLASS}
        minColumnWidth={PLACES_GRID_MIN_COL}
      >
        <WorkspaceGlobalEmpty
          tab="places"
          onAction={onAddPlaceFocus}
          actionLabel={
            emptyActionLabel ?? (canEdit ? "Add a place" : "Suggest a place")
          }
          actionBusy={emptyActionBusy}
        />
      </ChromaCollectionGrid>
    );
  }

  return (
    <div className="workspace-section-body">
      {mapSlot}

      {(isSuggestionsLoading || pendingSuggestions.length > 0) && (
        <CollectionSection
          heading={sectionLabels.incoming}
          count={
            isSuggestionsLoading && pendingSuggestions.length === 0
              ? undefined
              : pendingSuggestions.length
          }
          tone="incoming"
          id={sectionIds.incoming}
        >
          {isSuggestionsLoading && pendingSuggestions.length === 0 ? (
            <WorkspaceIncomingSkeleton
              variant="grid"
              gridClass={PLACES_GRID_CLASS}
              minColumnWidth={PLACES_GRID_MIN_COL}
            />
          ) : (
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
          )}
        </CollectionSection>
      )}

      {sections.queue.length > 0 && (
        <CollectionSection
          heading={sectionLabels.queue}
          count={sections.queue.length}
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
          count={sections.completed.length}
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
