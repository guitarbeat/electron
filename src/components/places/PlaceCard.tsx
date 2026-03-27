import React, { useState } from 'react';
import { CheckIcon, TrashIcon } from '@/common/icons';
import MediaCard from '@/ui/MediaCard';
import type { Place } from '@/shared/types';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export function getPlaceIcon(name: string): string {
  const lower = name.toLowerCase();
  if (/beach|ocean|sea|lake|river|bay|shore|coast|surf|swim/.test(lower)) return '🏖️';
  if (/park|garden|trail|forest|nature|woods|hike|botanical|grove|meadow/.test(lower)) return '🌿';
  if (/restaurant|diner|bistro|brasserie|grill|steakhouse|bbq|sushi|pizza|tacos|ramen|burger/.test(lower)) return '🍽️';
  if (/cafe|coffee|espresso|bakery|patisserie|pastry|boulangerie|tea/.test(lower)) return '☕';
  if (/bar|pub|brewery|taproom|cocktail|lounge|nightclub|club|wine/.test(lower)) return '🍻';
  if (/museum|gallery|art|exhibit|modern/.test(lower)) return '🎨';
  if (/theater|theatre|cinema|movies|show|performance|concert|opera|ballet/.test(lower)) return '🎭';
  if (/mountain|hill|peak|summit|climb|rock|canyon|cliff/.test(lower)) return '⛰️';
  if (/shop|store|market|mall|boutique|vintage|thrift/.test(lower)) return '🛍️';
  if (/gym|fitness|yoga|pilates|spa|wellness|sauna/.test(lower)) return '🧘';
  if (/hotel|resort|airbnb|hostel|motel|inn/.test(lower)) return '🏨';
  if (/zoo|aquarium|safari|wildlife|animal/.test(lower)) return '🦁';
  if (/library|bookstore|books|reading/.test(lower)) return '📚';
  if (/airport|station|terminal|train/.test(lower)) return '✈️';
  if (/bridge|landmark|tower|castle|palace/.test(lower)) return '🏰';
  if (/island|cove|lagoon|waterfall/.test(lower)) return '🌊';
  return '📍';
}

interface PlaceCardProps {
  place: Place;
  canEdit: boolean;
  isSubmitting: boolean;
  onMarkVisited: (id: string) => void;
  onMarkUnvisited: (id: string) => void;
  onDelete: (place: Place) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  canEdit,
  isSubmitting,
  onMarkVisited,
  onMarkUnvisited,
  onDelete,
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isVisited = Boolean(place.visitedAt);
  const icon = getPlaceIcon(place.name);
  const hasCoords = typeof place.lat === 'number' && typeof place.lng === 'number';

  const handleVisitToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubmitting || isActionLoading) return;
    setIsActionLoading(true);
    try {
      if (isVisited) {
        await onMarkUnvisited(place.id);
      } else {
        await onMarkVisited(place.id);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(place);
  };

  const visitedDate = place.visitedAt
    ? new Date(place.visitedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'link';
        e.dataTransfer.setData('placeId', place.id);
        e.dataTransfer.setData('placeName', place.name);
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      style={{
        cursor: canEdit ? (isDragging ? 'grabbing' : 'grab') : undefined,
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 0.15s',
        position: 'relative',
      }}
      title={canEdit ? 'Drag onto map to pin location' : undefined}
    >
      {/* Drag hint badge */}
      {canEdit && !hasCoords && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: spacing.xs,
            left: spacing.xs,
            zIndex: 4,
            background: 'rgba(18,11,6,0.72)',
            backdropFilter: 'blur(6px)',
            border: `1px solid ${colors.border}`,
            borderRadius: radius.sm,
            padding: '2px 5px',
            fontSize: '9px',
            fontFamily: typography.fontFamily.heading.join(', '),
            letterSpacing: '0.06em',
            color: colors.textTertiary,
            pointerEvents: 'none',
            lineHeight: 1.4,
          }}
        >
          drag to pin
        </div>
      )}

      <MediaCard
        variant={isVisited ? 'visited' : 'default'}
        className={`place-item-card${isVisited ? ' place-item-card--visited' : ''}`}
      >
        <MediaCard.PosterWrap className="place-item-poster-wrap">
          <MediaCard.Cover className="place-item-cover" aria-hidden="true">
            <span className="place-item-cover__icon">{icon}</span>
            {hasCoords && <span className="place-item-cover__pin">📍</span>}
          </MediaCard.Cover>

          {isVisited && (
            <div className="place-item-visited-badge" aria-label="Visited">
              <CheckIcon style={{ width: 10, height: 10 }} />
              {visitedDate ?? 'Visited'}
            </div>
          )}

          <MediaCard.Overlay className="place-item-overlay">
            <MediaCard.Info className="place-item-info">
              <MediaCard.Title className="place-item-title">{place.name}</MediaCard.Title>
              {place.notes && <MediaCard.Subtext className="place-item-notes">{place.notes}</MediaCard.Subtext>}
            </MediaCard.Info>

            {canEdit && (
              <MediaCard.Actions className="place-item-actions">
                <button
                  type="button"
                  className={`place-item-action-btn${isVisited ? ' place-item-action-btn--unmark' : ' place-item-action-btn--visit'}`}
                  onClick={handleVisitToggle}
                  disabled={isSubmitting || isActionLoading}
                  aria-label={
                    isVisited
                      ? `Mark ${place.name} as not visited`
                      : `Mark ${place.name} as visited`
                  }
                >
                  {isActionLoading ? '…' : isVisited ? 'Unmark' : 'Been here!'}
                </button>
                <button
                  type="button"
                  className="place-item-delete-btn"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  aria-label={`Remove ${place.name}`}
                >
                  <TrashIcon style={{ width: 13, height: 13 }} />
                </button>
              </MediaCard.Actions>
            )}
          </MediaCard.Overlay>
        </MediaCard.PosterWrap>
      </MediaCard>
    </div>
  );
};

export default PlaceCard;
