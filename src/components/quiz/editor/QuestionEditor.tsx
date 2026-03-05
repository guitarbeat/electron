import React, { useState } from 'react';
import {
  QuizQuestion,
  MultipleChoiceQuestion,
  AgreeDisagreeQuestion,
  ImageChoiceQuestion,
  XYAxisQuestion,
} from '@/types;
import MultipleChoiceEditor from './MultipleChoiceEditor';
import AgreeDisagreeEditor from './AgreeDisagreeEditor';
import ImageChoiceEditor from './ImageChoiceEditor';
import XYAxisEditor from './XYAxisEditor';
import Card from '@/ui/Card;
import Button from '@/ui/Button;
import Textarea from '@/ui/Textarea;
import { spacing, typography } from '@/design-system/tokens;

interface QuestionEditorProps {
  question: QuizQuestion;
  onSave: (q: QuizQuestion) => void;
  onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onSave, onCancel }) => {
  const [local, setLocal] = useState<QuizQuestion>(question);

  const updateField = <K extends keyof QuizQuestion>(field: K, value: QuizQuestion[K]) => {
    setLocal({ ...local, [field]: value } as QuizQuestion);
  };

  return (
    <Card variant="elevated" style={{ padding: spacing.md }}>
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.md,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize.lg,
              margin: 0,
              fontFamily: typography.fontFamily.heading.join(', '),
            }}
          >
            Edit Question
          </h2>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button variant="primary" size="sm" onClick={() => onSave(local)}>
              Save
            </Button>
            <Button variant="secondary" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>

        <div style={{ marginBottom: spacing.md }}>
          <Textarea
            label="Question Text"
            value={local.question}
            onChange={(e) => updateField('question', e.target.value)}
            style={{ textAlign: 'left', minHeight: '80px' }}
          />
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: spacing.xs }}>
          {local.type === 'multiple-choice' && (
            <MultipleChoiceEditor
              question={local as MultipleChoiceQuestion}
              onChange={(q) => setLocal(q)}
            />
          )}

          {local.type === 'agree-disagree' && (
            <AgreeDisagreeEditor
              question={local as AgreeDisagreeQuestion}
              onChange={(q) => setLocal(q)}
            />
          )}

          {local.type === 'image-choice' && (
            <ImageChoiceEditor
              question={local as ImageChoiceQuestion}
              onChange={(q) => setLocal(q)}
            />
          )}

          {local.type === 'xy-axis' && (
            <XYAxisEditor question={local as XYAxisQuestion} onChange={(q) => setLocal(q)} />
          )}
        </div>
      </div>
    </Card>
  );
};

export default QuestionEditor;
