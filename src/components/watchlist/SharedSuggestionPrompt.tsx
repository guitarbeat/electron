import React from 'react';
import type { SharedSuggestionIntent } from '@/app/sharedSuggestion';
import { colors, motion, spacing, typography } from '@/theme/tokens';
import Button from '@/ui/Button';
import Card from '@/ui/Card';

interface SharedSuggestionPromptProps {
  intent: SharedSuggestionIntent;
  isSaving: boolean;
  isAlreadySaved: boolean;
  canSave?: boolean;
  onSave: () => void;
  onDismiss: () => void;
}

const SharedSuggestionPrompt: React.FC<SharedSuggestionPromptProps> = ({
  intent,
  isSaving,
  isAlreadySaved,
  canSave = true,
  onSave,
  onDismiss,
}) => {
  const headline =
    intent.suggestedBy === 'Someone'
      ? `"${intent.title}" was shared with you`
      : `${intent.suggestedBy} shared "${intent.title}"`;

  return (
    <Card
      variant="elevated"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        padding: spacing.lg,
        border: `1px solid ${colors.secondary}55`,
        background:
          'radial-gradient(circle at top right, rgba(149, 220, 255, 0.2), transparent 52%), linear-gradient(180deg, rgba(18, 25, 44, 0.94), rgba(12, 19, 34, 0.96))',
        boxShadow: `0 18px 38px rgba(0, 0, 0, 0.32), 0 0 28px ${colors.secondary}20`,
        animation: `fade-in ${motion.duration.normal} ${motion.easing.easeOut}`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        <p style={{ margin: 0, ...typography.presets.eyebrow, color: colors.secondary }}>
          Shared Pick
        </p>
        <h3
          style={{
            margin: 0,
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.heading.join(', '),
            fontSize: typography.fontSize.xl,
            lineHeight: typography.lineHeight.snug,
          }}
        >
          {headline}
        </h3>
        <p
          style={{
            margin: 0,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {canSave
            ? 'Save it into Suggestions so it drops straight into the duo queue for review.'
            : 'Pick Aaron or Electra to save this into shared Suggestions.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onSave}
          isLoading={isSaving}
          disabled={isAlreadySaved || !canSave}
        >
          {isAlreadySaved ? 'Already saved' : canSave ? 'Save suggestion' : 'Pick a profile'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </Card>
  );
};

export default SharedSuggestionPrompt;
