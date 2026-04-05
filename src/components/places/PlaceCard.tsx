import React, { useState } from 'react';
import { CheckIcon, TrashIcon } from '@/common/icons';
import MediaCard from '@/ui/MediaCard';
import type { Place } from '@/shared/types';
import { colors, radius, spacing, typography, motion } from '@/theme/tokens';

/* ── Category → icon + accent color ── */
interface CategoryMeta { icon: string; color: string; label: string }

export function getPlaceMeta(name: string): CategoryMeta {
  const lower = name.toLowerCase();
  if (/beach|ocean|sea|lake|river|bay|shore|coast|surf|swim/.test(lower))
    return { icon: '🏖️', color: '#4ecdc4', label: 'Water' };
  if (/park|garden|trail|forest|nature|woods|hike|botanical|grove|meadow/.test(lower))
    return { icon: '🌿', color: '#7cb342', label: 'Nature' };
  if (/restaurant|diner|bistro|brasserie|grill|steakhouse|bbq|sushi|pizza|tacos|ramen|burger/.test(lower))
    return { icon: '🍽️', color: '#ff8a65', label: 'Dining' };
  if (/cafe|coffee|espresso|bakery|patisserie|pastry|boulangerie|tea/.test(lower))
    return { icon: '☕', color: '#bcaaa4', label: 'Café' };
  if (/bar|pub|brewery|taproom|cocktail|lounge|nightclub|club|wine/.test(lower))
    return { icon: '🍻', color: '#ffd54f', label: 'Drinks' };
  if (/museum|gallery|art|exhibit|modern/.test(lower))
    return { icon: '🎨', color: '#ce93d8', label: 'Culture' };
  if (/theater|theatre|cinema|movies|show|performance|concert|opera|ballet/.test(lower))
    return { icon: '🎭', color: '#ef5350', label: 'Entertainment' };
  if (/mountain|hill|peak|summit|climb|rock|canyon|cliff/.test(lower))
    return { icon: '⛰️', color: '#8d6e63', label: 'Mountain' };
  if (/shop|store|market|mall|boutique|vintage|thrift/.test(lower))
    return { icon: '🛍️', color: '#f48fb1', label: 'Shopping' };
  if (/gym|fitness|yoga|pilates|spa|wellness|sauna/.test(lower))
    return { icon: '🧘', color: '#80deea', label: 'Wellness' };
  if (/hotel|resort|airbnb|hostel|motel|inn/.test(lower))
    return { icon: '🏨', color: '#9fa8da', label: 'Stay' };
  if (/zoo|aquarium|safari|wildlife|animal/.test(lower))
    return { icon: '🦁', color: '#a5d6a7', label: 'Wildlife' };
  if (/library|bookstore|books|reading/.test(lower))
    return { icon: '📚', color: '#90a4ae', label: 'Library' };
  if (/airport|station|terminal|train/.test(lower))
    return { icon: '✈️', color: '#b0bec5', label: 'Transit' };
  if (/bridge|landmark|tower|castle|palace/.test(lower))
    return { icon: '🏰', color: '#ffcc80', label: 'Landmark' };
  if (/island|cove|lagoon|waterfall/.test(lower))
    return { icon: '🌊', color: '#4fc3f7', label: 'Island' };
  return { icon: '📍', color: colors.accent, label: 'Place' };
}

/** @deprecated Use getPlaceMeta().icon instead */
export function getPlaceIcon(name: string): string {
  return getPlaceMeta(name).icon;
}

interface PlaceCardProps {
  place: Place;
  canEdit: boolean;
  isSubmitting: boolean;
  isActive?: boolean;
  onMarkVisited: (id: string) => void;
  onMarkUnvisited: (id: string) => void;
  onDelete: (place: Place) => void;
  onEdit: (place: Place) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  canEdit,
  isSubmitting,
  isActive = false,
  onMarkVisited,
  onMarkUnvisited,
  onDelete,
  onEdit,
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isVisited = Boolean(place.visitedAt);
  const meta = getPlaceMeta(place.name);
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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(place);
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
        transition: `opacity 0.15s, transform ${motion.duration.normal} ${motion.easing.easeOut}, box-shadow ${motion.duration.normal} ${motion.easing.easeOut}`,
        position: 'relative',
        transform: isActive ? 'translateY(-3px) scale(1.03)' : undefined,
      }}
      className="place-card-hover-lift"
      title={canEdit ? 'Drag onto map to pin location' : undefined}
    >
      {/* Category color stripe */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          borderRadius: `${radius.sm} ${radius.sm} 0 0`,
          background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`,
          zIndex: 5,
        }}
      />

      {/* Active glow ring */}
      {isActive && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: radius.md,
            border: `2px solid ${meta.color}`,
            boxShadow: `0 0 12px ${meta.color}66`,
            zIndex: 3,
            pointerEvents: 'none',
            animation: 'place-card-pulse 1.5s ease-in-out infinite',
          }}
        />
      )}

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
            <span className="place-item-cover__icon" style={{ fontSize: '2rem' }}>{meta.icon}</span>
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
              {/* Coords label */}
              {hasCoords && (
                <span style={{
                  fontSize: typography.fontSize['3xs'],
                  color: colors.textTertiary,
                  fontFamily: typography.fontFamily.mono.join(', '),
                  opacity: 0.7,
                  marginTop: 2,
                  display: 'block',
                }}>
                  {place.lat!.toFixed(2)}, {place.lng!.toFixed(2)}
                </span>
              )}
              {/* Added by */}
              {place.addedBy && (
                <span style={{
                  fontSize: typography.fontSize['3xs'],
                  color: colors.textTertiary,
                  opacity: 0.6,
                  marginTop: 1,
                  display: 'block',
                }}>
                  by {place.addedBy.name}
                </span>
              )}
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
                  onClick={handleEdit}
                  disabled={isSubmitting}
                  aria-label={`Edit ${place.name}`}
                  title="Edit place"
                  style={{ fontSize: '0.85em' }}
                >
                  ✏️
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

      <style>{`
        .place-card-hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        @keyframes place-card-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default PlaceCard;
