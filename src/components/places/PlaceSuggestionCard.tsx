import React from 'react';
import BaseSuggestionCard from '@/components/common/BaseSuggestionCard';
import { getPlaceIcon } from '@/components/places/placeMeta';
import type { PlaceSuggestion } from '@/shared/types';
import { colors, typography } from '@/theme/tokens';

interface PlaceSuggestionCardProps {
  suggestion: PlaceSuggestion;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
  animationDelay?: string;
}

const PlaceSuggestionCard: React.FC<PlaceSuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
  animationDelay = '0s',
}) => {
  const icon = getPlaceIcon(suggestion.name);

  return (
    <BaseSuggestionCard
      suggestedBy={suggestion.suggestedBy}
      title={suggestion.name}
      subtitle={suggestion.notes}
      icon={icon}
      onAccept={onAccept}
      onReject={onReject}
      canRespond={canRespond}
      disableActions={disableActions}
      isProcessing={isProcessing}
      animationDelay={animationDelay}
      details={
        suggestion.category ? (
          <div
            style={{
              ...typography.presets.caption,
              color: colors.textTertiary,
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {suggestion.category}
          </div>
        ) : undefined
      }
    />
  );
};

export default PlaceSuggestionCard;
