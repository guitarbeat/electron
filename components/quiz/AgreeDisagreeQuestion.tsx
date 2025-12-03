import React from 'react';
import { AgreeDisagreeQuestion as AgreeDisagreeQuestionType } from '../../quizTypes';
import { spacing, typography, colors, shadows } from '../../design-system/tokens';

interface AgreeDisagreeQuestionProps {
  question: AgreeDisagreeQuestionType;
  selectedValue: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree' | null;
  onSelect: (value: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree') => void;
}

const scaleOptions: Array<{
  value: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
  label: string;
  shortLabel: string;
}> = [
  { value: 'stronglyDisagree', label: 'Strongly Disagree', shortLabel: 'SD' },
  { value: 'disagree', label: 'Disagree', shortLabel: 'D' },
  { value: 'neutral', label: 'Neutral', shortLabel: 'N' },
  { value: 'agree', label: 'Agree', shortLabel: 'A' },
  { value: 'stronglyAgree', label: 'Strongly Agree', shortLabel: 'SA' },
];

const AgreeDisagreeQuestion: React.FC<AgreeDisagreeQuestionProps> = ({
  question,
  selectedValue,
  onSelect,
}) => {
  return (
    <div className="animate-fade-in">
      <h3
        style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.semibold,
          color: colors.textPrimary,
          marginBottom: spacing.xl,
          textAlign: 'center',
          lineHeight: typography.lineHeight.normal,
        }}
      >
        {question.question}
      </h3>
      
      {/* Desktop view */}
      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
        className="scale-desktop"
      >
        {scaleOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            style={{
              flex: 1,
              maxWidth: '120px',
              padding: `${spacing.lg} ${spacing.sm}`,
              backgroundColor: selectedValue === option.value ? colors.accent : colors.surface,
              border: `3px solid ${selectedValue === option.value ? colors.accent : colors.borderSecondary}`,
              borderRadius: '8px',
              color: colors.textPrimary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedValue === option.value ? shadows.glow : shadows.card,
              fontFamily: typography.fontFamily.body.join(', '),
            }}
            onMouseEnter={(e) => {
              if (selectedValue !== option.value) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = colors.accent;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedValue !== option.value) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = colors.borderSecondary;
              }
            }}
            aria-pressed={selectedValue === option.value}
          >
            <div style={{ marginBottom: spacing.xs, fontSize: typography.fontSize.lg }}>
              {option.shortLabel}
            </div>
            <div style={{ fontSize: typography.fontSize.xs, opacity: 0.8 }}>
              {option.label}
            </div>
          </button>
        ))}
      </div>

      {/* Mobile view */}
      <div
        style={{
          display: 'none',
          flexDirection: 'column',
          gap: spacing.md,
        }}
        className="scale-mobile"
      >
        {scaleOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            style={{
              width: '100%',
              padding: spacing.lg,
              backgroundColor: selectedValue === option.value ? colors.accent : colors.surface,
              border: `3px solid ${selectedValue === option.value ? colors.accent : colors.borderSecondary}`,
              borderRadius: '8px',
              color: colors.textPrimary,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedValue === option.value ? shadows.glow : shadows.card,
              fontFamily: typography.fontFamily.body.join(', '),
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            aria-pressed={selectedValue === option.value}
          >
            <span>{option.label}</span>
            {selectedValue === option.value && <span>✓</span>}
          </button>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .scale-desktop {
            display: none !important;
          }
          .scale-mobile {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AgreeDisagreeQuestion;
