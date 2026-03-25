import React, { useState } from 'react';
import { CheckIcon, TrashIcon } from '@/common/icons';
import type { Place } from '@/shared/types';

// ── Icon heuristic ────────────────────────────────────────────────────────────

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

// ── PlaceCard ─────────────────────────────────────────────────────────────────

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
    <div className={`place-item-card${isVisited ? ' place-item-card--visited' : ''}`}>
      <div className="place-item-poster-wrap">
        <div className="place-item-cover" aria-hidden="true">
          <span className="place-item-cover__icon">{icon}</span>
          {hasCoords && <span className="place-item-cover__pin">📍</span>}
        </div>

        {isVisited && (
          <div className="place-item-visited-badge" aria-label="Visited">
            <CheckIcon style={{ width: 10, height: 10 }} />
            {visitedDate ?? 'Visited'}
          </div>
        )}

        <div className="place-item-overlay">
          <div className="place-item-info">
            <h3 className="place-item-title">{place.name}</h3>
            {place.notes && <p className="place-item-notes">{place.notes}</p>}
          </div>

          {canEdit && (
            <div className="place-item-actions">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;
