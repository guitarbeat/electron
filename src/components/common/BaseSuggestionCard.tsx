import React from "react";
import Card from "@/ui/Card";
import Button from "@/ui/Button";
import { colors, spacing, typography } from "@/theme/tokens";
import { CheckIcon, CrossIcon } from "@/common/Icons";
import {
  MediaCardInfo,
  MediaCardOverlay,
  MediaCardPosterWrap,
  MediaCardTitle,
} from "@/ui/MediaCard";
import { CardActionRail, CardActionButton } from "@/ui/CardActionRail";

export interface BaseSuggestionCardProps {
  suggestedBy: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  media?: React.ReactNode;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
  details?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const BaseSuggestionCard: React.FC<BaseSuggestionCardProps> = ({
  suggestedBy,
  title,
  subtitle,
  icon,
  media,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
  details,
  className = "",
  style,
}) => {
  const actionsDisabled = isProcessing || disableActions || !canRespond;

  if (media) {
    return (
      <Card
        variant="default"
        className={`suggestion-item-card suggestion-item-card--media chroma-card ${className}`.trim()}
        style={{
          padding: 0,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          ...style,
        }}
      >
        <MediaCardPosterWrap className="movie-item-poster-wrap">
          {media}
          <MediaCardOverlay>
            <MediaCardInfo>
              <div
                className="suggestion-item-card__eyebrow"
                style={{
                  ...typography.presets.eyebrow,
                  color: colors.accent,
                  opacity: 0.8,
                }}
              >
                Suggested by {suggestedBy}
              </div>
              <MediaCardTitle className="movie-item-title">
                {title}
              </MediaCardTitle>
              {subtitle && (
                <p
                  style={{
                    margin: 0,
                    ...typography.presets.caption,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                    lineHeight: 1.4,
                  }}
                >
                  &quot;{subtitle}&quot;
                </p>
              )}
              {details}
            </MediaCardInfo>
          </MediaCardOverlay>
          <CardActionRail
            variant="glass"
            primary={
              <CardActionButton
                isCircle
                variant="primary"
                onClick={onAccept}
                disabled={actionsDisabled}
                leftIcon={<CheckIcon />}
                aria-label="Accept suggestion"
                title="Accept suggestion"
              />
            }
            cluster={
              <CardActionButton
                isCircle
                variant="glass"
                onClick={onReject}
                disabled={actionsDisabled}
                leftIcon={<CrossIcon />}
                aria-label="Reject suggestion"
                title="Reject suggestion"
              />
            }
          />
        </MediaCardPosterWrap>

        {isProcessing && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.1)",
              backdropFilter: "blur(1px)",
              zIndex: 1,
            }}
          />
        )}
      </Card>
    );
  }

  return (
    <Card
      variant="default"
      className={`suggestion-item-card chroma-card ${className}`.trim()}
      style={{
        padding: spacing.md,
        display: "flex",
        flexDirection: "column",
        gap: spacing.sm,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            className="suggestion-item-card__eyebrow"
            style={{
              ...typography.presets.eyebrow,
              color: colors.accent,
              opacity: 0.8,
            }}
          >
            Suggestion from {suggestedBy}
          </div>
          {icon && <span style={{ fontSize: "1.2rem" }}>{icon}</span>}
        </div>
        <h3
          style={{
            margin: 0,
            ...typography.presets.bodySm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.textPrimary,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              margin: 0,
              ...typography.presets.caption,
              color: colors.textSecondary,
              fontStyle: "italic",
              lineHeight: 1.4,
              marginTop: spacing.xs,
            }}
          >
            &quot;{subtitle}&quot;
          </p>
        )}
        {details}
      </div>

      <div
        style={{
          display: "flex",
          gap: spacing.xs,
          marginTop: "auto",
          paddingTop: spacing.xs,
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={onAccept}
          isLoading={isProcessing}
          disabled={actionsDisabled}
          className="suggestion-item-card__button is-accept"
          aria-label="Accept suggestion"
          style={{ padding: 0 }}
        >
          <CheckIcon style={{ width: 16, height: 16 }} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={actionsDisabled}
          className="suggestion-item-card__button is-reject"
          aria-label="Reject suggestion"
          style={{ padding: 0 }}
        >
          <CrossIcon style={{ width: 16, height: 16 }} />
        </Button>
      </div>

      {!canRespond && (
        <p
          className="suggestion-item-card__profile-hint"
          style={{
            margin: 0,
            ...typography.presets.caption,
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: spacing.xs,
          }}
        >
          Pick a profile to review suggestions.
        </p>
      )}

      {isProcessing && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.1)",
            backdropFilter: "blur(1px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        />
      )}
    </Card>
  );
};

export default BaseSuggestionCard;
