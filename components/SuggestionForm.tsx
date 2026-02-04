import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { spacing, typography, colors, radius } from '../design-system/tokens';
import { useSuggestions } from '../hooks/useSuggestions';
import WatchlistPreview from './WatchlistPreview';

const MAX_TITLE_LENGTH = 100;
const MAX_NAME_LENGTH = 50;
const MAX_REASON_LENGTH = 200;

const SuggestionForm: React.FC = () => {
  const { addSuggestion, pendingSuggestions } = useSuggestions();
  const [title, setTitle] = useState('');
  const [suggestedBy, setSuggestedBy] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = pendingSuggestions?.length || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !suggestedBy.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await addSuggestion(title, suggestedBy, reason || undefined);
      setSubmitted(true);
      setTitle('');
      setSuggestedBy('');
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card variant="elevated" className="animate-fade-in">
        <div style={{ padding: spacing['2xl'], textAlign: 'center' }}>
          <div
            style={{
              fontSize: '3rem',
              marginBottom: spacing.lg,
              animation: 'bounce 0.5s ease-out',
            }}
          >
            🎬
          </div>
          <h3
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: colors.accent,
              marginBottom: spacing.md,
            }}
          >
            Thanks for your suggestion!
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.base,
              color: colors.textSecondary,
              marginBottom: spacing.xl,
            }}
          >
            Aaron & Electra will review it soon.
          </p>
          <Button variant="secondary" size="md" onClick={() => setSubmitted(false)}>
            Suggest Another Movie
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="animate-fade-in" style={{ padding: spacing.sm }}>
      <div style={{ padding: spacing.md }}>
        <h3
          style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: colors.accent,
            marginBottom: spacing.sm,
            marginTop: 0,
            textAlign: 'center',
          }}
        >
          🎬 Suggest a Movie
        </h3>
        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.textSecondary,
            marginBottom: spacing.md,
            textAlign: 'center',
          }}
        >
          Have a movie we should watch? Let us know!
        </p>

        <WatchlistPreview />

        <div style={{ marginTop: spacing.lg }}>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}
          >
            <div style={{ flex: 2 }}>
              <Input
                placeholder="Movie title..."
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                disabled={isSubmitting}
                style={{
                  borderRadius: `${radius.md} 0 0 ${radius.md}`,
                  borderRight: 'none',
                  height: '44px',
                  textAlign: 'left',
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <Input
                placeholder="Your Name"
                value={suggestedBy}
                onChange={(e) => setSuggestedBy(e.target.value.slice(0, MAX_NAME_LENGTH))}
                disabled={isSubmitting}
                style={{
                  borderRadius: 0,
                  borderLeft: `1px solid ${colors.borderSecondary}40`,
                  height: '44px',
                  textAlign: 'left',
                }}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={!title.trim() || !suggestedBy.trim() || isSubmitting}
              isLoading={isSubmitting}
              style={{
                borderRadius: `0 ${radius.md} ${radius.md} 0`,
                minWidth: '60px',
                height: '44px',
                fontSize: '1.25rem',
              }}
            >
              {isSubmitting ? '' : '+'}
            </Button>
          </form>

          {title.trim() && (
            <div className="animate-slide-down" style={{ marginTop: spacing.xs }}>
              <Input
                placeholder="Add a quick note why... (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
                disabled={isSubmitting}
                aria-label="Add a reason for your suggestion (optional)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px dashed ${colors.borderSecondary}60`,
                  fontSize: typography.fontSize.xs,
                  padding: `${spacing.xs} 0`,
                  fontStyle: 'italic',
                  textAlign: 'left',
                }}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: spacing.sm,
                color: colors.error,
                fontSize: '10px',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Pending suggestions social proof */}
          {pendingCount > 0 && (
            <div
              style={{
                marginTop: spacing.md,
                textAlign: 'center',
                fontSize: typography.fontSize.xs,
                color: colors.textTertiary,
                opacity: 0.8,
              }}
            >
              💬 {pendingCount} suggestion{pendingCount !== 1 ? 's' : ''} pending review
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SuggestionForm;
