/**
 * XYAxisEditor Component
 *
 * Editor for XY Axis questions - configure axis labels and quadrant scoring
 */

import React from 'react';
import { XYAxisQuestion, QuizCharacter } from './types';
import ScoreSlider from './ScoreSlider';
import Input from '../ui/Input';
import { spacing, colors, typography, radius } from '../../design-system/tokens';

interface XYAxisEditorProps {
  question: XYAxisQuestion;
  onChange: (q: XYAxisQuestion) => void;
}

const QUADRANT_INFO = [
  { key: 'topLeft', icon: '⬆⬅', name: 'Top-Left', position: 'left + top' },
  { key: 'topRight', icon: '⬆➡', name: 'Top-Right', position: 'right + top' },
  { key: 'bottomLeft', icon: '⬇⬅', name: 'Bottom-Left', position: 'left + bottom' },
  { key: 'bottomRight', icon: '⬇➡', name: 'Bottom-Right', position: 'right + bottom' },
] as const;

const XYAxisEditor: React.FC<XYAxisEditorProps> = ({ question, onChange }) => {
  const updateXAxis = (field: 'leftLabel' | 'rightLabel', value: string) => {
    onChange({
      ...question,
      xAxis: { ...question.xAxis, [field]: value },
    });
  };

  const updateYAxis = (field: 'topLabel' | 'bottomLabel', value: string) => {
    onChange({
      ...question,
      yAxis: { ...question.yAxis, [field]: value },
    });
  };

  const updateQuadrantScores = (
    quadrant: keyof XYAxisQuestion['quadrantScores'],
    scores: Partial<Record<QuizCharacter, number>>
  ) => {
    onChange({
      ...question,
      quadrantScores: {
        ...question.quadrantScores,
        [quadrant]: scores,
      },
    });
  };

  return (
    <div>
      {/* Axis Labels Section */}
      <div
        style={{
          marginBottom: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
        }}
      >
        <h3
          style={{
            fontSize: typography.fontSize.base,
            marginBottom: spacing.md,
            color: colors.textPrimary,
          }}
        >
          Axis Labels
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: spacing.md,
          }}
        >
          <div>
            <Input
              label="Y-Axis Top"
              value={question.yAxis.topLabel}
              onChange={(e) => updateYAxis('topLabel', e.target.value)}
              placeholder="e.g., Spontaneous"
              style={{ textAlign: 'left' }}
            />
          </div>
          <div>
            <Input
              label="Y-Axis Bottom"
              value={question.yAxis.bottomLabel}
              onChange={(e) => updateYAxis('bottomLabel', e.target.value)}
              placeholder="e.g., Planned"
              style={{ textAlign: 'left' }}
            />
          </div>
          <div>
            <Input
              label="X-Axis Left"
              value={question.xAxis.leftLabel}
              onChange={(e) => updateXAxis('leftLabel', e.target.value)}
              placeholder="e.g., Solo"
              style={{ textAlign: 'left' }}
            />
          </div>
          <div>
            <Input
              label="X-Axis Right"
              value={question.xAxis.rightLabel}
              onChange={(e) => updateXAxis('rightLabel', e.target.value)}
              placeholder="e.g., Social"
              style={{ textAlign: 'left' }}
            />
          </div>
        </div>

        {/* Visual preview of axis */}
        <div
          style={{
            marginTop: spacing.md,
            padding: spacing.sm,
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: radius.sm,
            fontSize: '10px',
            color: colors.textTertiary,
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '4px' }}>{question.yAxis.topLabel || '(top)'}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{question.xAxis.leftLabel || '(left)'}</span>
            <span style={{ color: colors.accent }}>◆</span>
            <span>{question.xAxis.rightLabel || '(right)'}</span>
          </div>
          <div style={{ marginTop: '4px' }}>{question.yAxis.bottomLabel || '(bottom)'}</div>
        </div>
      </div>

      {/* Quadrant Scores Section */}
      <div>
        <h3
          style={{
            fontSize: typography.fontSize.base,
            marginBottom: spacing.md,
            color: colors.textPrimary,
          }}
        >
          Quadrant Scores
        </h3>
        <p
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.textTertiary,
            marginBottom: spacing.md,
          }}
        >
          Set character scores for each quadrant. Users clicking near a quadrant will receive more
          points for those characters.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {QUADRANT_INFO.map(({ key, icon, name, position }) => (
            <div
              key={key}
              style={{
                padding: spacing.md,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: spacing.sm,
                }}
              >
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <span
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.textPrimary,
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    color: colors.textTertiary,
                    marginLeft: 'auto',
                  }}
                >
                  ({position})
                </span>
              </div>
              <ScoreSlider
                scores={question.quadrantScores[key]}
                onChange={(scores) => updateQuadrantScores(key, scores)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default XYAxisEditor;
