import React from 'react';
import { AgreeDisagreeQuestion } from '../types';
import ScoreSlider from '../ScoreSlider';
import { spacing, colors, typography, radius } from '../../../design-system/tokens';

interface AgreeDisagreeEditorProps {
  question: AgreeDisagreeQuestion;
  onChange: (q: AgreeDisagreeQuestion) => void;
}

const AgreeDisagreeEditor: React.FC<AgreeDisagreeEditorProps> = ({ question, onChange }) => {
  const levels = ['stronglyDisagree', 'disagree', 'neutral', 'agree', 'stronglyAgree'] as const;
  const levelLabels = {
    stronglyDisagree: 'Strongly Disagree',
    disagree: 'Disagree',
    neutral: 'Neutral',
    agree: 'Agree',
    stronglyAgree: 'Strongly Agree',
  };

  return (
    <div>
      <h3 style={{ fontSize: typography.fontSize.lg, marginBottom: spacing.md }}>
        Scoring by Response
      </h3>
      {levels.map((level) => (
        <div
          key={level}
          style={{
            marginBottom: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
          }}
        >
          <div
            style={{
              marginBottom: spacing.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.textSecondary,
            }}
          >
            {levelLabels[level]}
          </div>
          <ScoreSlider
            scores={question.scores[level]}
            onChange={(scores) => {
              onChange({
                ...question,
                scores: { ...question.scores, [level]: scores },
              });
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default AgreeDisagreeEditor;
