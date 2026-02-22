import React, { useState } from 'react';
import { useSuggestions } from '../hooks/useSuggestions';
import Input from './ui/Input';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import { spacing, colors, radius, typography } from '../design-system/tokens';

const SuggestionForm: React.FC = () => {
  const { addSuggestion } = useSuggestions();
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await addSuggestion(title, 'Guest', reason);
      setTitle('');
      setReason('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        padding: spacing.lg,
        backgroundColor: 'rgba(20, 20, 25, 0.8)',
        borderRadius: radius.lg,
        border: `1px solid ${colors.borderSecondary}40`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: spacing.sm }}>
        <h3
          style={{
            color: colors.textPrimary,
            fontSize: typography.fontSize.lg,
            marginBottom: spacing.xs,
          }}
        >
          Got a movie idea?
        </h3>
        <p style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
          Drop a suggestion for Aaron & Electra!
        </p>
      </div>

      <Input
        label="Movie Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Inception"
        required
        disabled={isSubmitting}
      />

      <Textarea
        label="Why should they watch it? (Optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="It's mind-bending!"
        disabled={isSubmitting}
        style={{ minHeight: '100px' }}
      />

      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={!title.trim() || isSubmitting}
        variant="primary"
        style={{ width: '100%' }}
      >
        {submitted ? 'Sent! 🚀' : 'Send Suggestion'}
      </Button>
    </form>
  );
};

export default SuggestionForm;
