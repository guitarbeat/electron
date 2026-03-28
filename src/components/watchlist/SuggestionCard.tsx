import React from 'react';
import type { MovieSuggestion } from '@/shared/types';
import BaseSuggestionCard from '@/components/common/BaseSuggestionCard';

interface SuggestionCardProps {
  suggestion: MovieSuggestion;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
  animationDelay?: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
  animationDelay = '0s',
}) => {
  return (
    <BaseSuggestionCard
      suggestedBy={suggestion.suggestedBy}
      title={suggestion.title}
      subtitle={suggestion.reason}
      onAccept={onAccept}
      onReject={onReject}
      canRespond={canRespond}
      disableActions={disableActions}
      isProcessing={isProcessing}
      animationDelay={animationDelay}
    />
  );
};

export default SuggestionCard;
