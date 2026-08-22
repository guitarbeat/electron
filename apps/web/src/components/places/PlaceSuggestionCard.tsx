import React from "react";
import SuggestionCardBase from "@/ui/SuggestionCardBase";
import { getPlaceMeta } from "@/components/places/lib";
import type { PlaceSuggestion } from "@/shared/types";
import { colors, typography } from "@/theme/tokens";

interface PlaceSuggestionCardProps {
  suggestion: PlaceSuggestion;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
}

const PlaceSuggestionCard: React.FC<PlaceSuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
}) => {
  const icon = getPlaceMeta(suggestion.name).icon;

  return (
    <SuggestionCardBase
      suggestedBy={suggestion.suggestedBy}
      title={suggestion.name}
      subtitle={suggestion.notes}
      icon={icon}
      onAccept={onAccept}
      onReject={onReject}
      canRespond={canRespond}
      disableActions={disableActions}
      isProcessing={isProcessing}
      details={
        suggestion.category ? (
          <div
            style={{
              ...typography.presets.caption,
              color: colors.textTertiary,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
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
