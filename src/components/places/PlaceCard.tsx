import React, { useState } from 'react';
import { CheckIcon, EditIcon, TrashIcon } from '@/common/Icons';
import MediaCard from '@/ui/MediaCard';
import type { Place } from '@/shared/types';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import {
  MediaCardActions,
  MediaCardCover,
  MediaCardInfo,
  MediaCardOverlay,
  MediaCardPosterWrap,
  MediaCardSubtext,
  MediaCardTitle,
} from '@/ui/MediaCard';
import { getPlaceMeta } from './lib/placeMeta';
import WatcherBadge from '@/common/WatcherBadge';

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
        position: 'relative',
      }}
      title={canEdit ? 'Drag onto map to pin location' : undefined}
    >
      {/* Per-user top accent stripe — mirrors movie-item-card[data-added-by] stripe */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          borderRadius: `${radius.sm} ${radius.sm} 0 0`,
          background: `linear-gradient(90deg, transparent 0%, ${meta.color}99 30%, ${meta.color}cc 50%, ${meta.color}99 70%, transparent 100%)`,
          boxShadow: `0 0 10px ${meta.color}55`,
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
        hover={false}
      >
        <MediaCardPosterWrap className="place-item-poster-wrap">
          <MediaCardCover className="place-item-cover" aria-hidden="true">
            {/* Large decorative emoji — acts like a poster focal element */}
            <span className="place-item-cover__icon">{meta.icon}</span>
            {hasCoords && <span className="place-item-cover__pin">📍</span>}
          </MediaCardCover>

          {/* Top-left badge: visited state takes priority over category badge */}
          {isVisited ? (
            <div className="place-item-visited-badge" aria-label="Visited">
              <CheckIcon style={{ width: 10, height: 10 }} />
              {visitedDate ?? 'Visited'}
            </div>
          ) : (
            <div className="place-item-category-badge" aria-label={meta.label}>
              <span className="place-item-category-badge__icon">{meta.icon}</span>
              <span className="place-item-category-badge__label">{meta.label}</span>
            </div>
          )}

          <MediaCardOverlay className="place-item-overlay">
            <MediaCardInfo className="place-item-info">
              <MediaCardTitle className="place-item-title">{place.name}</MediaCardTitle>

              {/* Category chip — mirrors movie genre chip */}
              <div className="place-item-meta-row">
                <span className="place-item-genre-chip">{meta.label}</span>
                {hasCoords && (
                  <span className="place-item-coords-chip">
                    {place.lat!.toFixed(2)}, {place.lng!.toFixed(2)}
                  </span>
                )}
              </div>

              {place.notes && <MediaCardSubtext className="place-item-notes">{place.notes}</MediaCardSubtext>}
              {/* Added by */}
              {place.addedBy && (
                <div className="place-item-added-by-badge-wrap">
                  <WatcherBadge user={place.addedBy} size="sm" showLabel />
                </div>
              )}
            </MediaCardInfo>

            {canEdit && (
              <MediaCardActions className="workspace-card-actions place-item-actions">
                <div className="workspace-card-actions__row workspace-card-actions__row--primary">
                  <button
                    type="button"
                    className={`workspace-card-action workspace-card-action--primary place-item-action-btn${isVisited ? ' place-item-action-btn--unmark' : ' place-item-action-btn--visit'}`}
                    onClick={handleVisitToggle}
                    disabled={isSubmitting || isActionLoading}
                    aria-label={
                      isVisited
                        ? `Mark ${place.name} as not visited`
                        : `Mark ${place.name} as visited`
                    }
                  >
                    <CheckIcon style={{ width: 15, height: 15 }} />
                    <span className="place-item-action-btn__label">
                      {isActionLoading ? 'Updating…' : isVisited ? 'Visited' : 'Been here'}
                    </span>
                  </button>
                </div>
                <div className="workspace-card-actions__row workspace-card-actions__row--secondary">
                  <button
                    type="button"
                    className="workspace-card-action workspace-card-action--secondary workspace-card-action--expansive place-item-edit-btn"
                    onClick={handleEdit}
                    disabled={isSubmitting}
                    aria-label={`Edit ${place.name}`}
                    title="Edit place"
                  >
                    <EditIcon style={{ width: 15, height: 15 }} />
                    <span className="workspace-card-action__text">Edit</span>
                  </button>
                  <div className="workspace-card-actions__cluster place-secondary-actions">
                    <button
                      type="button"
                      className="workspace-card-action workspace-card-action--secondary workspace-card-action--compact place-item-delete-btn"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      aria-label={`Remove ${place.name}`}
                      title="Remove place"
                    >
                      <TrashIcon style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              </MediaCardActions>
            )}
          </MediaCardOverlay>
        </MediaCardPosterWrap>
      </MediaCard>
    </div>
  );
};

export default PlaceCard;
