/**
 * QuestionPreview Component
 *
 * Live preview of how a question will appear to quiz takers
 */

import React from 'react';
import { QuizQuestion, MultipleChoiceQuestion, ImageChoiceQuestion, XYAxisQuestion } from './types';
import { spacing, colors, typography, radius } from '@/theme/tokens';
import Card from '@/ui/Card';

interface QuestionPreviewProps {
  question: QuizQuestion;
  previewMode?: 'desktop' | 'mobile';
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({ question, previewMode = 'desktop' }) => {
  const isMobile = previewMode === 'mobile';
  const scale = isMobile ? 0.84 : 0.72;

  return (
    <div className="quiz-editor-preview">
      <div className="quiz-editor-preview__frame">
        <div className="quiz-editor-preview__header">
          <p className="quiz-editor-preview__title">Live Preview</p>
          <div className="quiz-editor__preview-badge">{isMobile ? 'Mobile' : 'Desktop'}</div>
        </div>

        <div className="quiz-editor-preview__canvas">
          <div
            className="quiz-editor-preview__scale"
            style={{
              transform: `scale(${scale})`,
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                <span className="quiz-editor__type-badge">{question.type.replace('-', ' ')}</span>
              </div>

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

              {question.type === 'multiple-choice' && (
                <MultipleChoicePreview question={question as MultipleChoiceQuestion} />
              )}

              {question.type === 'agree-disagree' && <AgreeDisagreePreview />}

              {question.type === 'image-choice' && (
                <ImageChoicePreview question={question as ImageChoiceQuestion} />
              )}

              {question.type === 'xy-axis' && (
                <XYAxisPreview question={question as XYAxisQuestion} />
              )}
            </Card>
          </div>
        </div>
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
        <span style={{ fontSize: typography.fontSize['2xs'], color: colors.textTertiary }}>
          {labels[0]}
        </span>
        <span style={{ fontSize: typography.fontSize['2xs'], color: colors.textTertiary }}>
          {labels[4]}
        </span>
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
          <span style={{ fontSize: typography.fontSize['2xs'], color: colors.textTertiary }}>
            No image
          </span>
        )}
      </div>
    ))}
  </div>
);

const XYAxisPreview: React.FC<{ question: XYAxisQuestion }> = ({ question }) => (
  <div>
    {/* Top label */}
    <div
      style={{
        textAlign: 'center',
        marginBottom: spacing.xs,
        fontSize: typography.fontSize['3xs'],
        color: colors.secondary,
        fontWeight: typography.fontWeight.bold,
      }}
    >
      {question.yAxis.topLabel}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
      {/* Left label */}
      <div
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontSize: typography.fontSize['3xs'],
          color: colors.secondary,
          fontWeight: typography.fontWeight.bold,
        }}
      >
        {question.xAxis.leftLabel}
      </div>

      {/* Grid */}
      <div
        style={{
          flex: 1,
          aspectRatio: '1',
          backgroundColor: colors.surface,
          borderRadius: radius.sm,
          border: `1px solid ${colors.borderSecondary}40`,
          position: 'relative',
          minHeight: '80px',
        }}
      >
        {/* Crosshairs */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '1px',
            backgroundColor: `${colors.borderSecondary}40`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: `${colors.borderSecondary}40`,
          }}
        />

        {/* Sample marker */}
        <div
          style={{
            position: 'absolute',
            left: '60%',
            top: '40%',
            transform: 'translate(-50%, -50%)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: colors.accent,
            border: '2px solid white',
          }}
        />
      </div>

      {/* Right label */}
      <div
        style={{
          writingMode: 'vertical-rl',
          fontSize: typography.fontSize['3xs'],
          color: colors.secondary,
          fontWeight: typography.fontWeight.bold,
        }}
      >
        {question.xAxis.rightLabel}
      </div>
    </div>

    {/* Bottom label */}
    <div
      style={{
        textAlign: 'center',
        marginTop: spacing.xs,
        fontSize: typography.fontSize['3xs'],
        color: colors.secondary,
        fontWeight: typography.fontWeight.bold,
      }}
    >
      {question.yAxis.bottomLabel}
    </div>
  </div>
);

export default QuestionPreview;
