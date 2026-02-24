import React from 'react';
import { ImageChoiceQuestion as ImageChoiceQuestionType } from './types';
import { spacing, typography, colors, shadows } from '../../design-system/tokens';

interface ImageChoiceQuestionProps {
  question: ImageChoiceQuestionType;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const ImageChoiceQuestion: React.FC<ImageChoiceQuestionProps> = ({
  question,
  selectedIndex,
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            question.options.length === 2
              ? 'repeat(2, 1fr)'
              : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.lg,
        }}
      >
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            style={{
              position: 'relative',
              padding: 0,
              backgroundColor: 'transparent',
              border: `4px solid ${selectedIndex === index ? colors.accent : colors.borderSecondary}`,
              borderRadius: '12px',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              boxShadow: selectedIndex === index ? shadows.glow : shadows.card,
              aspectRatio: '3/2',
            }}
            onMouseEnter={(e) => {
              if (selectedIndex !== index) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = colors.accentHover;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedIndex !== index) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = colors.borderSecondary;
              }
            }}
            aria-pressed={selectedIndex === index}
            aria-label={option.alt}
          >
            <img
              src={option.imageUrl}
              alt={option.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {selectedIndex === index && (
              <div
                style={{
                  position: 'absolute',
                  top: spacing.sm,
                  right: spacing.sm,
                  backgroundColor: colors.accent,
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize.xl,
                  boxShadow: shadows.glow,
                }}
                className="bounce-in"
              >
                ✓
              </div>
            )}
            {selectedIndex === index && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(255, 105, 180, 0.2)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageChoiceQuestion;
