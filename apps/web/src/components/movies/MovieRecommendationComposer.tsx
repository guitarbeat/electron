import React from 'react';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import { Input, Textarea } from '@/ui/FormFields';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import type { User } from '@/shared/types';
import {
  MAX_GUEST_SUGGESTER_NAME_LENGTH,
  MAX_RECOMMENDATION_REASON_LENGTH,
} from "./lib/index";

interface MovieRecommendationComposerProps {
  currentUser: User | null;
  movieTitle: string;
  guestName: string;
  reason: string;
  error: string | null;
  isSubmitting: boolean;
  onGuestNameChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
}

const MovieRecommendationComposer: React.FC<
  MovieRecommendationComposerProps
> = ({
  currentUser,
  movieTitle,
  guestName,
  reason,
  error,
  isSubmitting,
  onGuestNameChange,
  onReasonChange,
  onSubmit,
  onCancel,
}) => {
  const remainingChars = MAX_RECOMMENDATION_REASON_LENGTH - reason.length;

  return (
    <Card
      variant="default"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing.md,
        padding: spacing.lg,
        border: `1px solid ${colors.borderSubtle}`,
        background: `radial-gradient(circle at top right, ${colors.accentMuted} 0%, transparent 54%), linear-gradient(180deg, ${colors.surface2}, ${colors.surface1})`,
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}
      >
        <p
          style={{
            margin: 0,
            ...typography.presets.eyebrow,
            color: colors.accentLight,
          }}
        >
          Recommendation
        </p>
        <h3
          style={{
            margin: 0,
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.heading.join(", "),
            fontSize: typography.fontSize.lg,
            lineHeight: typography.lineHeight.snug,
          }}
        >
          {movieTitle}
        </h3>
        <p
          style={{
            margin: 0,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {currentUser
            ? `Send this to Suggestions as ${currentUser}.`
            : "Guests can send titles to Suggestions too. Add your name if you want credit."}
        </p>
      </div>

      {!currentUser ? (
        <Input
          label="Your Name (Optional)"
          value={guestName}
          onChange={(event) =>
            onGuestNameChange(
              event.target.value.slice(0, MAX_GUEST_SUGGESTER_NAME_LENGTH),
            )
          }
          placeholder="Guest"
          maxLength={MAX_GUEST_SUGGESTER_NAME_LENGTH}
        />
      ) : null}

      <Textarea
        label="Why This One? (Optional)"
        value={reason}
        onChange={(event) =>
          onReasonChange(
            event.target.value.slice(0, MAX_RECOMMENDATION_REASON_LENGTH),
          )
        }
        placeholder="A quick reason, vibe, or inside joke."
        maxLength={MAX_RECOMMENDATION_REASON_LENGTH}
        rows={3}
        style={{ minHeight: "88px" }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: spacing.sm,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSize.xs,
          }}
        >
          {remainingChars} characters left
        </span>

        <div style={{ display: "flex", gap: spacing.xs, flexWrap: "wrap" }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void onSubmit()}
            isLoading={isSubmitting}
          >
            Send recommendation
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            color: colors.error,
            fontSize: typography.fontSize.xs,
            background: `${colors.error}10`,
            border: `1px solid ${colors.error}30`,
            borderRadius: radius.md,
            padding: `${spacing.xs} ${spacing.sm}`,
          }}
        >
          {error}
        </div>
      )}
    </Card>
  );
};

export default MovieRecommendationComposer;
