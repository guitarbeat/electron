import React from 'react';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import { CheckIcon, TrashIcon } from '@/common/icons';
import { colors, motion, shadows, spacing, typography } from '@/design-system';
import type { Place } from '@/types';

interface PlaceCardProps {
  place: Place;
  isSubmitting: boolean;
  animationDelay?: string;
  onMarkVisited: () => void;
  onMarkUnvisited: () => void;
  onDelete: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSubmitting,
  animationDelay = '0s',
  onMarkVisited,
  onMarkUnvisited,
  onDelete,
}) => {
  const isVisited = Boolean(place.visitedAt);

  return (
    <Card
      variant={isVisited ? 'default' : 'elevated'}
      style={{
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        animation: `slide-up ${motion.duration.normal} ${motion.easing.easeOut} ${animationDelay} both`,
        border: isVisited ? `1px solid ${colors.borderSubtle}` : `1px solid ${colors.accent}20`,
        boxShadow: isVisited ? 'none' : shadows.card,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h3 style={{ ...typography.presets.bodySm, fontWeight: 600, margin: 0 }}>{place.name}</h3>
          {isVisited && (
            <span
              style={{
                ...typography.presets.caption,
                color: colors.success,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckIcon style={{ width: 12, height: 12 }} />
              Visited
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: spacing.xs }}>
          {isVisited ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onMarkUnvisited}
              disabled={isSubmitting}
              style={{ fontSize: '0.75rem', padding: `2px ${spacing.sm}` }}
            >
              Mark unvisited
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={onMarkVisited}
              disabled={isSubmitting}
              style={{ fontSize: '0.75rem', padding: `2px ${spacing.sm}` }}
            >
              Mark visited
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={isSubmitting}
            aria-label={`Delete ${place.name}`}
            style={{ padding: spacing.xs, color: colors.textTertiary }}
          >
            <TrashIcon style={{ width: 16, height: 16 }} />
          </Button>
        </div>
      </div>
      {place.notes && (
        <p
          style={{
            ...typography.presets.caption,
            color: colors.textSecondary,
            margin: 0,
            lineBreak: 'anywhere',
          }}
        >
          {place.notes}
        </p>
      )}
    </Card>
  );
};

export default React.memo(PlaceCard);
