/**
 * QuestionPreview Component
 *
 * Live preview of how a question will appear to quiz takers
 */

import React from 'react';
import {
  QuizQuestion,
  MultipleChoiceQuestion,
  AgreeDisagreeQuestion,
  ImageChoiceQuestion,
} from './types';
import { spacing, colors, typography, radius } from '../../design-system/tokens';
import Card from '../ui/Card';

interface QuestionPreviewProps {
  question: QuizQuestion;
  previewMode?: 'desktop' | 'mobile';
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({ question, previewMode = 'desktop' }) => {
  const isMobile = previewMode === 'mobile';
  const scale = isMobile ? 0.8 : 0.65;

  return (
    <div
      style={{
        backgroundColor: colors.background,
        borderRadius: radius.lg,
        padding: spacing.md,
        border: `2px dashed ${colors.borderSecondary}40`,
        overflow: 'hidden',
      }}
    >
      {/* Preview header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <span
          style={{
            fontSize: '10px',
            color: colors.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Live Preview
        </span>
        <div
          style={{
            padding: '2px 8px',
            fontSize: '9px',
            backgroundColor: `${colors.accent}20`,
            color: colors.accent,
            borderRadius: radius.full,
          }}
        >
          {isMobile ? '📱 Mobile' : '🖥️ Desktop'}
        </div>
      </div>

      {/* Scaled preview container */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          maxWidth: isMobile ? '300px' : '100%',
          margin: '0 auto',
        }}
      >
        <Card
          variant="elevated"
          style={{
            padding: spacing.lg,
            textAlign: 'center',
          }}
        >
          {/* Question text */}
          <h3
            style={{
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamily.heading.join(', '),
              color: colors.textPrimary,
              marginBottom: spacing.lg,
              lineHeight: typography.lineHeight.normal,
            }}
          >
            {question.question || 'Your question here...'}
          </h3>

          {/* Render based on type */}
          {question.type === 'multiple-choice' && (
            <MultipleChoicePreview question={question as MultipleChoiceQuestion} />
          )}

          {question.type === 'agree-disagree' && <AgreeDisagreePreview />}

          {question.type === 'image-choice' && (
            <ImageChoicePreview question={question as ImageChoiceQuestion} />
          )}
        </Card>
      </div>
    </div>
  );
};

const MultipleChoicePreview: React.FC<{ question: MultipleChoiceQuestion }> = ({ question }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
    {question.options.map((option, idx) => (
      <button
        key={idx}
        style={{
          padding: spacing.md,
          backgroundColor: colors.surface,
          border: `2px solid ${colors.borderSecondary}40`,
          borderRadius: radius.md,
          color: colors.textPrimary,
          fontSize: typography.fontSize.sm,
          cursor: 'default',
          textAlign: 'left',
          transition: 'all 0.2s ease',
        }}
      >
        {option.text || `Option ${idx + 1}`}
      </button>
    ))}
  </div>
);

const AgreeDisagreePreview: React.FC = () => {
  const labels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

  return (
    <div>
      {/* Scale visual */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: spacing.xs,
          marginBottom: spacing.sm,
        }}
      >
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: radius.full,
              backgroundColor: val === 3 ? colors.accent : colors.surface,
              border: `2px solid ${val === 3 ? colors.accent : colors.borderSecondary}40`,
              color: val === 3 ? '#000' : colors.textPrimary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              cursor: 'default',
            }}
          >
            {val}
          </button>
        ))}
      </div>

      {/* Labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '10px', color: colors.textTertiary }}>{labels[0]}</span>
        <span style={{ fontSize: '10px', color: colors.textTertiary }}>{labels[4]}</span>
      </div>
    </div>
  );
};

const ImageChoicePreview: React.FC<{ question: ImageChoiceQuestion }> = ({ question }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(question.options.length, 2)}, 1fr)`,
      gap: spacing.sm,
    }}
  >
    {question.options.map((option, idx) => (
      <div
        key={idx}
        style={{
          aspectRatio: '1',
          borderRadius: radius.md,
          border: `2px solid ${colors.borderSecondary}40`,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {option.imageUrl ? (
          <img
            src={option.imageUrl}
            alt={option.alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{ fontSize: '10px', color: colors.textTertiary }}>No image</span>
        )}
      </div>
    ))}
  </div>
);

export default QuestionPreview;
