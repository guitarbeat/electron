import React from 'react';
import { MultipleChoiceQuestion as MultipleChoiceQuestionType } from './types';
import Button from '@/ui/Button;
import { spacing, typography, colors } from '@/design-system/tokens;

interface MultipleChoiceQuestionProps {
  question: MultipleChoiceQuestionType;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
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
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant={selectedIndex === index ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => onSelect(index)}
            style={{
              width: '100%',
              fontSize: typography.fontSize.lg,
              textAlign: 'left',
              justifyContent: 'flex-start',
              padding: spacing.lg,
              position: 'relative',
              overflow: 'hidden',
            }}
            aria-pressed={selectedIndex === index}
          >
            {option.text}
            {selectedIndex === index && (
              <span
                style={{
                  position: 'absolute',
                  right: spacing.lg,
                  fontSize: typography.fontSize.xl,
                }}
              >
                ✓
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MultipleChoiceQuestion;
