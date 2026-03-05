import React from 'react';
import { MultipleChoiceQuestion, QuizCharacter } from '@/types;
import ScoreSlider from '@/ScoreSlider;
import Input from '@/ui/Input;
import Button from '@/ui/Button;
import { spacing, colors, typography, radius } from '@/design-system/tokens;

interface MultipleChoiceEditorProps {
  question: MultipleChoiceQuestion;
  onChange: (q: MultipleChoiceQuestion) => void;
}

const MultipleChoiceEditor: React.FC<MultipleChoiceEditorProps> = ({ question, onChange }) => {
  const updateOption = (
    index: number,
    field: 'text' | 'scores',
    value: string | Partial<Record<QuizCharacter, number>>
  ) => {
    const newOptions = [...question.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange({ ...question, options: newOptions });
  };

  const addOption = () => {
    onChange({
      ...question,
      options: [...question.options, { text: 'New option', scores: {} }],
    });
  };

  const removeOption = (index: number) => {
    if (question.options.length <= 2) return;
    onChange({
      ...question,
      options: question.options.filter((_, i) => i !== index),
    });
  };

  return (
    <div>
      <h3 style={{ fontSize: typography.fontSize.lg, marginBottom: spacing.md }}>Options</h3>
      {question.options.map((option, idx) => (
        <div
          key={idx}
          style={{
            marginBottom: spacing.lg,
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
          }}
        >
          <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.sm }}>
            <div style={{ flex: 1 }}>
              <Input
                value={option.text}
                onChange={(e) => updateOption(idx, 'text', e.target.value)}
                placeholder="Option text"
                style={{ textAlign: 'left' }}
              />
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => removeOption(idx)}
              disabled={question.options.length <= 2}
            >
              ✕
            </Button>
          </div>
          <ScoreSlider
            scores={option.scores}
            onChange={(scores) => {
              const newOptions = [...question.options];
              newOptions[idx] = { ...newOptions[idx], scores };
              onChange({ ...question, options: newOptions });
            }}
          />
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={addOption}>
        + Add Option
      </Button>
    </div>
  );
};

export default MultipleChoiceEditor;
