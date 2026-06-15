import React, { useRef, useState } from 'react';
import type {
  AgreeDisagreeQuestion,
  ImageChoiceQuestion,
  MultipleChoiceQuestion,
  QuizCharacter,
  QuizQuestion,
  XYAxisQuestion,
} from './lib/types';
import ScoreSlider from './ScoreSlider';
import { getQuestionDetail, QUESTION_TYPE_LABELS } from './lib/QuestionEditorMeta';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import { Input, Textarea } from '@/ui/FormFields';
import { useToast } from '@/app/useProviders';
import { spacing, colors, typography } from '@/theme/tokens';

const QUADRANT_INFO = [
  { key: 'topLeft', icon: '⬆⬅', name: 'Top-Left', position: 'left + top' },
  { key: 'topRight', icon: '⬆➡', name: 'Top-Right', position: 'right + top' },
  { key: 'bottomLeft', icon: '⬇⬅', name: 'Bottom-Left', position: 'left + bottom' },
  { key: 'bottomRight', icon: '⬇➡', name: 'Bottom-Right', position: 'right + bottom' },
] as const;

const AgreeDisagreeEditor: React.FC<{
  question: AgreeDisagreeQuestion;
  onChange: (q: AgreeDisagreeQuestion) => void;
}> = ({ question, onChange }) => {
  const levels = ['stronglyDisagree', 'disagree', 'neutral', 'agree', 'stronglyAgree'] as const;
  const levelLabels = {
    stronglyDisagree: 'Strongly Disagree',
    disagree: 'Disagree',
    neutral: 'Neutral',
    agree: 'Agree',
    stronglyAgree: 'Strongly Agree',
  };

  return (
    <div className="quiz-editor__editor-section">
      <div className="quiz-editor__editor-subsection">
        <h3 className="quiz-editor__subsection-title">Scoring by response</h3>
        <p className="quiz-editor__subsection-copy">
          Shape how each point on the scale contributes to each character result.
        </p>
      </div>
      {levels.map((level) => (
        <div key={level} className="quiz-editor__score-card">
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

const MultipleChoiceEditor: React.FC<{
  question: MultipleChoiceQuestion;
  onChange: (q: MultipleChoiceQuestion) => void;
}> = ({ question, onChange }) => {
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
    <div className="quiz-editor__editor-section">
      <div className="quiz-editor__editor-subsection">
        <h3 className="quiz-editor__subsection-title">Answer options</h3>
        <p className="quiz-editor__subsection-copy">
          Write the answer copy, then assign score weight to each character outcome.
        </p>
      </div>
      {question.options.map((option, idx) => (
        <div key={idx} className="quiz-editor__option-card">
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
              aria-label="Remove option"
              title="Remove option"
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
        Add Option
      </Button>
    </div>
  );
};

const ImageChoiceEditor: React.FC<{
  question: ImageChoiceQuestion;
  onChange: (q: ImageChoiceQuestion) => void;
}> = ({ question, onChange }) => {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { showToast } = useToast();

  const updateOption = (index: number, field: 'imageUrl' | 'alt', value: string) => {
    const newOptions = [...question.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange({ ...question, options: newOptions });
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast({ message: 'Please select an image file.', type: 'error' });
      return;
    }

    if (file.size > 500 * 1024) {
      showToast({
        message: 'Image too large. Please use an image under 500KB.',
        type: 'error',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const newOptions = [...question.options];
      newOptions[index] = {
        ...newOptions[index],
        imageUrl: base64,
        alt: newOptions[index].alt || file.name.replace(/\.[^/.]+$/, ''),
      };
      onChange({ ...question, options: newOptions });
    };
    reader.readAsDataURL(file);
  };

  const addOption = () => {
    onChange({
      ...question,
      options: [...question.options, { imageUrl: '', alt: 'New image', scores: {} }],
    });
  };

  const removeOption = (index: number) => {
    if (question.options.length <= 2) return;
    onChange({
      ...question,
      options: question.options.filter((_, i) => i !== index),
    });
  };

  const isBase64Image = (url: string) => url.startsWith('data:image');

  return (
    <div className="quiz-editor__editor-section">
      <div className="quiz-editor__editor-subsection">
        <h3 className="quiz-editor__subsection-title">Image options</h3>
        <p className="quiz-editor__subsection-copy">
          Upload art under 500KB, or point to an existing asset from `/quiz-photos/`.
        </p>
      </div>
      {question.options.map((option, idx) => (
        <div key={idx} className="quiz-editor__option-card">
          <div className="quiz-editor__upload-shell">
            <button
              type="button"
              className="quiz-editor__upload-preview"
              onClick={() => fileInputRefs.current[idx]?.click()}
              aria-label="Upload image for option"
              title="Upload image for option"
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
                <div className="quiz-editor__upload-preview-note">Click to upload</div>
              )}
            </button>

            <div style={{ flex: 1 }}>
              <input
                ref={(el) => {
                  fileInputRefs.current[idx] = el;
                }}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(idx, file);
                }}
              />

              <div style={{ marginBottom: spacing.sm }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  style={{ width: '100%' }}
                >
                  Upload Image
                </Button>
              </div>

              <Input
                label="Or enter URL"
                value={isBase64Image(option.imageUrl) ? '(uploaded image)' : option.imageUrl}
                onChange={(e) => updateOption(idx, 'imageUrl', e.target.value)}
                placeholder="/quiz-photos/quiz-img-1.png"
                style={{ textAlign: 'left' }}
                disabled={isBase64Image(option.imageUrl)}
              />

              {isBase64Image(option.imageUrl) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateOption(idx, 'imageUrl', '')}
                  style={{ marginTop: spacing.xs, fontSize: typography.fontSize.xs }}
                >
                  Clear uploaded image
                </Button>
              )}
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => removeOption(idx)}
              disabled={question.options.length <= 2}
              style={{ flexShrink: 0 }}
              aria-label="Remove option"
              title="Remove option"
            >
              ✕
            </Button>
          </div>

          <div style={{ marginBottom: spacing.sm }}>
            <Input
              label="Alt Text (description)"
              value={option.alt}
              onChange={(e) => updateOption(idx, 'alt', e.target.value)}
              placeholder="Description of the image"
              style={{ textAlign: 'left' }}
            />
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
        Add Image Option
      </Button>
    </div>
  );
};

const XYAxisEditor: React.FC<{
  question: XYAxisQuestion;
  onChange: (q: XYAxisQuestion) => void;
}> = ({ question, onChange }) => {
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
    <div className="quiz-editor__editor-section">
      <div className="quiz-editor__editor-block">
        <div className="quiz-editor__editor-subsection" style={{ marginBottom: spacing.md }}>
          <h3 className="quiz-editor__subsection-title">Axis labels</h3>
          <p className="quiz-editor__subsection-copy">
            Name the two poles so the grid feels immediately understandable to quiz takers.
          </p>
        </div>

        <div className="quiz-editor__editor-grid">
          <Input
            label="Y-Axis Top"
            value={question.yAxis.topLabel}
            onChange={(e) => updateYAxis('topLabel', e.target.value)}
            placeholder="e.g., Spontaneous"
            style={{ textAlign: 'left' }}
          />
          <Input
            label="Y-Axis Bottom"
            value={question.yAxis.bottomLabel}
            onChange={(e) => updateYAxis('bottomLabel', e.target.value)}
            placeholder="e.g., Planned"
            style={{ textAlign: 'left' }}
          />
          <Input
            label="X-Axis Left"
            value={question.xAxis.leftLabel}
            onChange={(e) => updateXAxis('leftLabel', e.target.value)}
            placeholder="e.g., Solo"
            style={{ textAlign: 'left' }}
          />
          <Input
            label="X-Axis Right"
            value={question.xAxis.rightLabel}
            onChange={(e) => updateXAxis('rightLabel', e.target.value)}
            placeholder="e.g., Social"
            style={{ textAlign: 'left' }}
          />
        </div>
      </div>

      <div className="quiz-editor__editor-subsection">
        <h3 className="quiz-editor__subsection-title">Quadrant scores</h3>
        <p className="quiz-editor__subsection-copy">
          Define which character wins when someone lands in each region of the grid.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {QUADRANT_INFO.map(({ key, icon, name, position }) => (
          <div key={key} className="quiz-editor__score-card">
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
                  fontSize: typography.fontSize['2xs'],
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
  );
};

export const OptionsSummary: React.FC<{ options: MultipleChoiceQuestion['options'] }> = ({
  options,
}) => (
  <div className="quiz-editor__summary-list">
    {options.map((opt, i) => {
      const scoreStr = Object.entries(opt.scores)
        .filter(([, v]) => typeof v === 'number' && v > 0)
        .map(([char, v]) => `${char[0]}:${v}`)
        .join(' ');
      return (
        <div key={i} className="quiz-editor__summary-line">
          {opt.text} {scoreStr ? `(${scoreStr})` : ''}
        </div>
      );
    })}
  </div>
);

export const ImageOptionsSummary: React.FC<{ options: ImageChoiceQuestion['options'] }> = ({
  options,
}) => (
  <div className="quiz-editor__summary-thumbs">
    {options.map((opt, i) => (
      <div key={i} className="quiz-editor__summary-thumb">
        {opt.imageUrl && (
          <img
            src={opt.imageUrl}
            alt={opt.alt}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
    ))}
  </div>
);

export const AgreeDisagreeSummary: React.FC<{ scores: AgreeDisagreeQuestion['scores'] }> = ({
  scores,
}) => {
  const levels = ['stronglyDisagree', 'disagree', 'neutral', 'agree', 'stronglyAgree'] as const;
  return (
    <div className="quiz-editor__summary-pills">
      {levels.map((level) => {
        const scoreStr = Object.entries(scores[level])
          .filter(([, v]) => typeof v === 'number' && v > 0)
          .map(([char, v]) => `${char[0]}:${v}`)
          .join(' ');
        return (
          <span key={level} className="quiz-editor__summary-pill">
            {level.slice(0, 2).toUpperCase()}: {scoreStr || '—'}
          </span>
        );
      })}
    </div>
  );
};

export const XYAxisSummary: React.FC<{ question: XYAxisQuestion }> = ({ question }) => (
  <div className="quiz-editor__summary-list">
    <div className="quiz-editor__summary-line">
      X: {question.xAxis.leftLabel} ↔ {question.xAxis.rightLabel}
    </div>
    <div className="quiz-editor__summary-line">
      Y: {question.yAxis.bottomLabel} ↔ {question.yAxis.topLabel}
    </div>
  </div>
);

interface QuestionEditorPanelProps {
  question: QuizQuestion;
  onDraftChange?: (q: QuizQuestion) => void;
  onSave: (q: QuizQuestion) => void;
  onCancel: () => void;
}

const QuestionEditorPanel: React.FC<QuestionEditorPanelProps> = ({
  question,
  onDraftChange,
  onSave,
  onCancel,
}) => {
  const [local, setLocal] = useState<QuizQuestion>(question);
  const questionTypeLabel = QUESTION_TYPE_LABELS[local.type];

  const commitChange = (nextQuestion: QuizQuestion) => {
    setLocal(nextQuestion);
    onDraftChange?.(nextQuestion);
  };

  const updateField = <K extends keyof QuizQuestion>(field: K, value: QuizQuestion[K]) => {
    commitChange({ ...local, [field]: value } as QuizQuestion);
  };

  return (
    <Card variant="elevated" className="quiz-editor__editor-card">
      <div className="quiz-editor__editor-shell">
        <div className="quiz-editor__editor-header">
          <div className="quiz-editor__panel-intro">
            <p className="quiz-editor__section-eyebrow">Question Composer</p>
            <h2 className="quiz-editor__section-title">Refine how this moment feels.</h2>
            <p className="quiz-editor__section-copy">
              Tighten the prompt, then calibrate the scoring so the result logic stays intentional.
            </p>
          </div>

          <div className="quiz-editor__editor-actions">
            <Button variant="primary" size="sm" onClick={() => onSave(local)}>
              Save Question
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Back to List
            </Button>
          </div>
        </div>

        <div className="quiz-editor__editor-meta">
          <span className="quiz-editor__type-badge">{questionTypeLabel}</span>
          <span className="quiz-editor__editor-meta-note">{getQuestionDetail(local)}</span>
        </div>

        <div className="quiz-editor__editor-section">
          <Textarea
            label="Question Text"
            value={local.question}
            onChange={(e) => updateField('question', e.target.value)}
            rows={4}
            style={{ textAlign: 'left', minHeight: '6.25rem' }}
          />
        </div>

        <div className="quiz-editor__editor-scroll">
          {local.type === 'multiple-choice' && (
            <MultipleChoiceEditor
              question={local as MultipleChoiceQuestion}
              onChange={commitChange}
            />
          )}

          {local.type === 'agree-disagree' && (
            <AgreeDisagreeEditor
              question={local as AgreeDisagreeQuestion}
              onChange={commitChange}
            />
          )}

          {local.type === 'image-choice' && (
            <ImageChoiceEditor
              question={local as ImageChoiceQuestion}
              onChange={commitChange}
            />
          )}

          {local.type === 'xy-axis' && (
            <XYAxisEditor question={local as XYAxisQuestion} onChange={commitChange} />
          )}
        </div>
      </div>
    </Card>
  );
};

export default QuestionEditorPanel;
