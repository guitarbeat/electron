import React, { useState } from "react";
import { CheckIcon, EditIcon, TrashIcon } from "@/common/Icons";
import MediaCard from "@/ui/MediaCard";
import type { Place } from "@/shared/types";
import { radius } from "@/theme/tokens";
import {
  MediaCardCover,
  MediaCardInfo,
  MediaCardOverlay,
  MediaCardPosterWrap,
  MediaCardSubtext,
  MediaCardTitle,
  MediaCardStatusBadge,
} from "@/ui/MediaCard";
import { getPlaceMeta } from "./lib/placeMeta";
import WatcherBadge from "@/common/WatcherBadge";
import { CardActionRail, CardActionButton } from "@/ui/CardActionRail";
import MediaCardMetadata from "@/ui/MediaCardMetadata";
import { useCardTilt } from "@/hooks/useCardTilt";

interface PlaceCardProps {
  place: Place;
  canEdit: boolean;
  isSubmitting: boolean;
  isActive?: boolean;
  onActivate?: () => void;
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
  onActivate,
  onMarkVisited,
  onMarkUnvisited,
  onDelete,
  onEdit,
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const tilt = useCardTilt();
  const isVisited = Boolean(place.visitedAt);
  const meta = getPlaceMeta(place.name);
  const hasCoords =
    typeof place.lat === "number" && typeof place.lng === "number";

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
    ? new Date(place.visitedAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  const handleActivate = (event: React.MouseEvent | React.KeyboardEvent) => {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    onActivate?.();
  };

  return (
    <div
      id={`place-card-${place.id}`}
      draggable={canEdit}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "link";
        e.dataTransfer.setData("placeId", place.id);
        e.dataTransfer.setData("placeName", place.name);
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      style={{
        cursor: canEdit ? (isDragging ? "grabbing" : "grab") : undefined,
        opacity: isDragging ? 0.5 : 1,
        position: "relative",
      }}
      title={canEdit ? "Drag onto map to pin location" : undefined}
    >
      {/* Per-user top accent stripe — mirrors movie-item-card[data-added-by] stripe */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
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
            position: "absolute",
            inset: -2,
            borderRadius: radius.md,
            border: `2px solid ${meta.color}`,
            boxShadow: `0 0 12px ${meta.color}66`,
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
      )}

      <div
        ref={tilt.ref}
        className="card-tilt-wrap"
        onMouseEnter={tilt.onMouseEnter}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
      >
        <MediaCard
          variant={isVisited ? "visited" : "default"}
          className={`place-item-card chroma-card${isVisited ? " place-item-card--visited" : ""}`}
          hover={false}
        >
          <div className="card-tilt-sheen" aria-hidden="true" />
          <MediaCardPosterWrap className="place-item-poster-wrap">
            <MediaCardCover
              className="place-item-cover"
              aria-hidden={onActivate ? undefined : true}
              role={onActivate ? "button" : undefined}
              tabIndex={onActivate ? 0 : undefined}
              aria-label={onActivate ? `Show ${place.name} on map` : undefined}
              onClick={onActivate ? handleActivate : undefined}
              onKeyDown={
                onActivate
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleActivate(event);
                      }
                    }
                  : undefined
              }
            >
              {/* Large decorative emoji — acts like a poster focal element */}
              <span className="place-item-cover__icon">{meta.icon}</span>
              {hasCoords && <span className="place-item-cover__pin">📍</span>}
            </MediaCardCover>

            {/* Top-left badge: visited state takes priority over category badge */}
            {isVisited ? (
              <MediaCardStatusBadge
                label={visitedDate ?? "Visited"}
                icon={<CheckIcon style={{ width: 10, height: 10 }} />}
                className="place-item-visited-badge"
                aria-label="Visited"
              />
            ) : (
              <div
                className="place-item-category-badge"
                aria-label={meta.label}
              >
                <span className="place-item-category-badge__icon">
                  {meta.icon}
                </span>
                <span className="place-item-category-badge__label">
                  {meta.label}
                </span>
              </div>
            )}

            <MediaCardOverlay className="place-item-overlay">
              <MediaCardInfo className="place-item-info">
                <MediaCardTitle className="place-item-title">
                  {place.name}
                </MediaCardTitle>

                <MediaCardMetadata
                  items={
                    hasCoords
                      ? [`${place.lat!.toFixed(2)}, ${place.lng!.toFixed(2)}`]
                      : []
                  }
                  chips={[meta.label]}
                  className="place-item-meta-row"
                />

                {place.notes && (
                  <MediaCardSubtext className="place-item-notes">
                    {place.notes}
                  </MediaCardSubtext>
                )}

                {/* Added by */}
                {place.addedBy && (
                  <div
                    className="place-item-added-by-badge-wrap"
                    style={{ marginTop: "auto", paddingTop: "0.5rem" }}
                  >
                    <WatcherBadge user={place.addedBy} size="sm" showLabel />
                  </div>
                )}
              </MediaCardInfo>

              {canEdit && (
                <CardActionRail
                  className="place-item-actions"
                  variant="glass"
                  primary={
                    <CardActionButton
                      isCircle
                      variant={isVisited ? "primary" : "secondary"}
                      onClick={handleVisitToggle}
                      disabled={isSubmitting || isActionLoading}
                      leftIcon={<CheckIcon />}
                      className={`place-item-action-btn${isVisited ? " place-item-action-btn--unmark" : " place-item-action-btn--visit"}`}
                      aria-label={
                        isVisited ? "Mark as unvisited" : "Mark as visited"
                      }
                      title={
                        isVisited ? "Mark as unvisited" : "Mark as visited"
                      }
                    />
                  }
                  secondary={
                    <CardActionButton
                      isCircle
                      variant="glass"
                      onClick={handleEdit}
                      leftIcon={<EditIcon />}
                      disabled={isSubmitting || isActionLoading}
                      className="place-item-edit-btn"
                      aria-label="Edit place"
                      title="Edit place"
                    />
                  }
                  cluster={
                    <CardActionButton
                      isCircle
                      variant="glass"
                      onClick={handleDelete}
                      leftIcon={<TrashIcon />}
                      disabled={isSubmitting || isActionLoading}
                      className="place-item-delete-btn"
                      aria-label="Remove place"
                      title="Remove place"
                    />
                  }
                />
              )}
            </MediaCardOverlay>
          </MediaCardPosterWrap>
        </MediaCard>
      </div>
      {/* card-tilt-wrap */}
    </div>
  );
};

export default PlaceCard;
