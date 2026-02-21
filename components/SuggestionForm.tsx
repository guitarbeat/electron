import React, { useState } from 'react';
import { useSuggestions } from '../hooks/useSuggestions';
import { colors, radius, spacing, typography } from '../design-system/tokens';
import Button from './ui/Button';
import Toast from './ui/Toast';

const SuggestionForm: React.FC = () => {
  const { addSuggestion } = useSuggestions();
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    setIsSubmitting(true);
    try {
      await addSuggestion(title, author, reason);
      setTitle('');
      setReason('');
      setAuthor('');
      setToast({ message: 'Suggestion sent! 🎬', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ message: 'Failed to send suggestion', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(20, 25, 40, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: radius.card,
        padding: spacing.xl,
        border: `1px solid rgba(255, 255, 255, 0.1)`,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: spacing.lg }}>
        <h3
          style={{
            margin: 0,
            color: colors.textPrimary,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          Have a Movie Idea? 💡
        </h3>
        <p
          style={{
            margin: `${spacing.xs} 0 0`,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
          }}
        >
          Suggest a movie for the watchlist!
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <div>
          <label
            htmlFor="suggestion-title"
            style={{
              display: 'block',
              color: colors.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              marginBottom: spacing.xs,
              marginLeft: spacing.xs,
            }}
          >
            Movie Title *
          </label>
          <input
            id="suggestion-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Inception"
            required
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: spacing.md,
              borderRadius: radius.lg,
              border: `1px solid rgba(255, 255, 255, 0.15)`,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              color: colors.textPrimary,
              fontSize: typography.fontSize.base,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = colors.accent)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
          />
        </div>

        <div style={{ display: 'flex', gap: spacing.md }}>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="suggestion-author"
              style={{
                display: 'block',
                color: colors.textSecondary,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                marginBottom: spacing.xs,
                marginLeft: spacing.xs,
              }}
            >
              Your Name *
            </label>
            <input
              id="suggestion-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Name"
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: spacing.md,
                borderRadius: radius.lg,
                border: `1px solid rgba(255, 255, 255, 0.15)`,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                color: colors.textPrimary,
                fontSize: typography.fontSize.base,
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = colors.accent)}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="suggestion-reason"
            style={{
              display: 'block',
              color: colors.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              marginBottom: spacing.xs,
              marginLeft: spacing.xs,
            }}
          >
            Why should we watch it? (Optional)
          </label>
          <textarea
            id="suggestion-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="It's a classic!"
            rows={2}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: spacing.md,
              borderRadius: radius.lg,
              border: `1px solid rgba(255, 255, 255, 0.15)`,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              color: colors.textPrimary,
              fontSize: typography.fontSize.base,
              outline: 'none',
              resize: 'vertical',
              minHeight: '80px',
            }}
            onFocus={(e) => (e.target.style.borderColor = colors.accent)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={!title.trim() || !author.trim()}
          style={{ marginTop: spacing.xs }}
        >
          Submit Suggestion
        </Button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default SuggestionForm;
