import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import { spacing, typography, colors, shadows } from '../design-system/tokens';
import { useSuggestions } from '../hooks/useSuggestions';

const MAX_TITLE_LENGTH = 100;
const MAX_NAME_LENGTH = 50;
const MAX_REASON_LENGTH = 200;

const SuggestionForm: React.FC = () => {
  const { addSuggestion } = useSuggestions();
  const [title, setTitle] = useState('');
  const [suggestedBy, setSuggestedBy] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleReset = () => {
    setSubmitted(false);
    setError(null);
  };

  if (submitted) {
    return (
      <Card variant="elevated" className="animate-fade-in">
        <div style={{ padding: spacing['2xl'], textAlign: 'center' }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.lg,
            animation: 'bounce 0.5s ease-out',
          }}>
            🎬
          </div>
          <h3 style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: colors.accent,
            background: shadows.textGradientPink,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))',
          }}>
            Thanks for your suggestion!
          </h3>
          <p style={{
            fontSize: typography.fontSize.base,
            color: colors.textSecondary,
            marginBottom: spacing.xl,
            lineHeight: typography.lineHeight.relaxed,
          }}>
            Aaron & Electra will review it soon.
          </p>
          <Button
            variant="secondary"
            size="md"
            onClick={handleReset}
          >
            Suggest Another Movie
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="animate-fade-in">
      <div style={{ padding: spacing.xl }}>
        <h3 style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          color: colors.accent,
          background: shadows.textGradientPink,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: spacing.sm,
          marginTop: 0,
          textAlign: 'center',
          filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))',
        }}>
          🎬 Suggest a Movie
        </h3>
        <p style={{
          fontSize: typography.fontSize.sm,
          color: colors.textSecondary,
          marginBottom: spacing.xl,
          textAlign: 'center',
          lineHeight: typography.lineHeight.relaxed,
        }}>
          Have a movie we should watch? Let us know!
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Input
            label="Movie Title *"
            placeholder="e.g., The Princess Bride"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
            disabled={isSubmitting}
            style={{ textAlign: 'left' }}
          />
          
          <Input
            label="Your Name *"
            placeholder="e.g., Movie Enthusiast"
            value={suggestedBy}
            onChange={(e) => setSuggestedBy(e.target.value.slice(0, MAX_NAME_LENGTH))}
            disabled={isSubmitting}
            style={{ textAlign: 'left' }}
          />

          <div>
            <label style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.textSecondary,
            }}>
              Why should we watch it? (Optional)
            </label>
            <Textarea
              placeholder="It's a classic! You'll love the sword fighting scenes..."
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
              disabled={isSubmitting}
              style={{ minHeight: '80px', textAlign: 'left' }}
            />
            <div style={{
              fontSize: typography.fontSize.xs,
              color: colors.textTertiary,
              marginTop: spacing.xs,
              textAlign: 'right',
            }}>
              {reason.length}/{MAX_REASON_LENGTH}
            </div>
          </div>

          {error && (
            <div style={{
              padding: spacing.md,
              backgroundColor: colors.error + '20',
              border: `1px solid ${colors.error}`,
              borderRadius: spacing.sm,
              color: colors.error,
              fontSize: typography.fontSize.sm,
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Submitting..."
            disabled={!title.trim() || !suggestedBy.trim() || isSubmitting}
            style={{ width: '100%' }}
          >
            Submit Suggestion
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default SuggestionForm;
