import React, { useRef, useState } from 'react';
import {
  QuizCharacter,
  QuizQuestion,
  MultipleChoiceQuestion,
  AgreeDisagreeQuestion,
  ImageChoiceQuestion,
  XYAxisQuestion,
} from './types';
import { questionTemplates, TemplateType } from './QuestionTemplates';
import QuestionPreview from './QuestionPreview';
import ScoreSlider from './ScoreSlider';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import { Input, Textarea } from '@/ui/FormFields';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { useToast } from '@/app/useProviders';
import { spacing, colors, typography, radius } from '@/theme/tokens';

interface QuestionsTabProps {
  questions: QuizQuestion[];
  editingQuestion: QuizQuestion | null;
  setEditingQuestion: (q: QuizQuestion | null) => void;
  onUpdateQuestions: (questions: QuizQuestion[]) => void;
  showPreview: boolean;
  showTemplates: boolean;
  setShowTemplates: (show: boolean) => void;
  expandedQuestions: Set<string>;
  setExpandedQuestions: (set: Set<string>) => void;
  draggedIndex: number | null;
  setDraggedIndex: (index: number | null) => void;
  dragOverIndex: number | null;
  setDragOverIndex: (index: number | null) => void;
  isMobile: boolean;
}

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
    <div>
      <h3 style={{ fontSize: typography.fontSize.lg, marginBottom: spacing.md }}>Image Options</h3>
      <p
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.textTertiary,
          marginBottom: spacing.lg,
        }}
      >
        Upload images (under 500KB) or enter URLs to existing images in /quiz-photos/
      </p>
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
          <div
            style={{
              display: 'flex',
              gap: spacing.md,
              marginBottom: spacing.md,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: radius.md,
                border: `2px dashed ${colors.borderSecondary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: colors.background,
                cursor: 'pointer',
                flexShrink: 0,
              }}
              onClick={() => fileInputRefs.current[idx]?.click()}
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
                <div
                  style={{
                    textAlign: 'center',
                    padding: spacing.sm,
                    color: colors.textTertiary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  Click to upload
                </div>
              )}
            </div>

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
                  📷 Upload Image
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
        + Add Image Option
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
    <div>
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
    </div>
  );
};

const QuestionEditor: React.FC<{
  question: QuizQuestion;
  onSave: (q: QuizQuestion) => void;
  onCancel: () => void;
}> = ({ question, onSave, onCancel }) => {
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

const QuestionsTab: React.FC<QuestionsTabProps> = ({
  questions,
  editingQuestion,
  setEditingQuestion,
  onUpdateQuestions,
  showPreview,
  showTemplates,
  setShowTemplates,
  expandedQuestions,
  setExpandedQuestions,
  draggedIndex,
  setDraggedIndex,
  dragOverIndex,
  setDragOverIndex,
  isMobile,
}) => {
  const [questionToDeleteId, setQuestionToDeleteId] = useState<string | null>(null);

  const addNewQuestion = (templateId: TemplateType = 'blank') => {
    const template = questionTemplates.find((t) => t.id === templateId);
    if (!template) return;

    const newQuestion = template.create();
    onUpdateQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion);
    setShowTemplates(false);
  };

  const deleteQuestion = (id: string) => {
    setQuestionToDeleteId(id);
  };

  const confirmDeleteQuestion = () => {
    if (!questionToDeleteId) return;
    const id = questionToDeleteId;
    onUpdateQuestions(questions.filter((q) => q.id !== id));
    if (editingQuestion?.id === id) setEditingQuestion(null);
    setQuestionToDeleteId(null);
  };

  const duplicateQuestion = (q: QuizQuestion) => {
    const idx = questions.findIndex((question) => question.id === q.id);
    const duplicate = {
      ...(JSON.parse(JSON.stringify(q)) as QuizQuestion),
      id: `q_${Date.now()}`,
      question: `${q.question} (copy)`,
    };
    const newQuestions = [...questions];
    newQuestions.splice(idx + 1, 0, duplicate);
    onUpdateQuestions(newQuestions);
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newQuestions = [...questions];
    const [moved] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, moved);
    onUpdateQuestions(newQuestions);
  };

  const saveQuestion = (updated: QuizQuestion) => {
    onUpdateQuestions(questions.map((q) => (q.id === updated.id ? updated : q)));
    setEditingQuestion(null);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedQuestions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedQuestions(newSet);
  };

  const expandAll = () => {
    setExpandedQuestions(new Set(questions.map((q) => q.id)));
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (toIndex: number) => {
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      moveQuestion(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (editingQuestion) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showPreview ? '1fr 300px' : '1fr',
          gap: spacing.lg,
        }}
      >
        <QuestionEditor
          question={editingQuestion}
          onSave={saveQuestion}
          onCancel={() => setEditingQuestion(null)}
        />
        {showPreview && (
          <div style={{ position: 'sticky', top: spacing.lg, alignSelf: 'start' }}>
            <QuestionPreview question={editingQuestion} />
          </div>
        )}
      </div>
    );
  }

  const questionToDelete = questionToDeleteId
    ? questions.find((question) => question.id === questionToDeleteId)
    : null;

  return (
    <div>
      <Card
        variant="default"
        style={{
          padding: spacing.md,
          marginBottom: spacing.lg,
          backgroundColor: colors.surfaceElevated,
        }}
      >
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
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              color: colors.textPrimary,
            }}
          >
            Add New Question
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            style={{ fontSize: typography.fontSize.xs }}
          >
            {showTemplates ? 'Hide Templates' : '📋 Use Template'}
          </Button>
        </div>

        {showTemplates ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: spacing.sm,
            }}
          >
            {questionTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => addNewQuestion(template.id)}
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.surface,
                  border: `2px solid ${colors.borderSecondary}20`,
                  borderRadius: radius.md,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.accent;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${colors.borderSecondary}20`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: spacing.xs }}>{template.icon}</div>
                <div
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.textPrimary,
                    marginBottom: '2px',
                  }}
                >
                  {template.name}
                </div>
                <div style={{ fontSize: typography.fontSize['2xs'], color: colors.textTertiary }}>
                  {template.description}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={() => addNewQuestion('blank')}>
              + Multiple Choice
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const q: AgreeDisagreeQuestion = {
                  id: `q_${Date.now()}`,
                  type: 'agree-disagree',
                  question: 'New agree/disagree statement',
                  scores: {
                    stronglyDisagree: {},
                    disagree: {},
                    neutral: {},
                    agree: {},
                    stronglyAgree: {},
                  },
                };
                onUpdateQuestions([...questions, q]);
                setEditingQuestion(q);
              }}
            >
              + Agree/Disagree
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const q: ImageChoiceQuestion = {
                  id: `q_${Date.now()}`,
                  type: 'image-choice',
                  question: 'Choose an image:',
                  options: [
                    { imageUrl: '/quiz-photos/quiz-img-1.png', alt: 'Image 1', scores: {} },
                    { imageUrl: '/quiz-photos/quiz-img-2.png', alt: 'Image 2', scores: {} },
                  ],
                };
                onUpdateQuestions([...questions, q]);
                setEditingQuestion(q);
              }}
            >
              + Image Choice
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const q: XYAxisQuestion = {
                  id: `q_${Date.now()}`,
                  type: 'xy-axis',
                  question: 'Where do you see yourself on this grid?',
                  xAxis: { leftLabel: 'Solo', rightLabel: 'Social' },
                  yAxis: { topLabel: 'Spontaneous', bottomLabel: 'Planned' },
                  quadrantScores: {
                    topLeft: {},
                    topRight: {},
                    bottomLeft: {},
                    bottomRight: {},
                  },
                };
                onUpdateQuestions([...questions, q]);
                setEditingQuestion(q);
              }}
            >
              + XY Axis
            </Button>
          </div>
        )}
      </Card>

      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          marginBottom: spacing.md,
          justifyContent: 'flex-end',
        }}
      >
        <Button variant="ghost" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="ghost" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {questions.map((q, index) => {
          const isExpanded = expandedQuestions.has(q.id);
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <Card
              key={q.id}
              variant="default"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              style={{
                padding: spacing.md,
                backgroundColor: isDragOver ? `${colors.accent}10` : colors.surfaceElevated,
                border: `2px solid ${isDragOver ? colors.accent : 'transparent'}`,
                transition: 'all 0.2s ease',
                opacity: isDragging ? 0.5 : 1,
                cursor: 'grab',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <div
                  style={{
                    cursor: 'grab',
                    color: colors.textTertiary,
                    fontSize: '14px',
                    padding: spacing.xs,
                  }}
                  title="Drag to reorder"
                >
                  ⋮⋮
                </div>

                <div
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                  onClick={() => toggleExpand(q.id)}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      marginBottom: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: typography.fontSize['2xs'],
                        color: colors.accent,
                        fontWeight: typography.fontWeight.bold,
                        backgroundColor: `${colors.accent}20`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      #{index + 1}
                    </span>
                    <span
                      style={{
                        fontSize: typography.fontSize['3xs'],
                        color: colors.textTertiary,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        padding: '2px 6px',
                        borderRadius: radius.full,
                        textTransform: typography.presets.badge.textTransform,
                        letterSpacing: typography.letterSpacing.wider,
                        fontWeight: typography.fontWeight.bold,
                      }}
                    >
                      {q.type.replace('-', ' ')}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.textPrimary,
                      margin: 0,
                      fontWeight: typography.fontWeight.semibold,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {q.question}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: spacing.xs, flexShrink: 0 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateQuestion(q)}
                    title="Duplicate"
                    style={{ padding: spacing.xs, opacity: 0.7 }}
                  >
                    📋
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveQuestion(index, Math.max(0, index - 1))}
                    disabled={index === 0}
                    title="Move up"
                    style={{ padding: spacing.xs, opacity: index === 0 ? 0.3 : 0.7 }}
                  >
                    ⬆
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveQuestion(index, Math.min(questions.length - 1, index + 1))}
                    disabled={index === questions.length - 1}
                    title="Move down"
                    style={{
                      padding: spacing.xs,
                      opacity: index === questions.length - 1 ? 0.3 : 0.7,
                    }}
                  >
                    ⬇
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuestion(q.id)}
                    style={{ color: colors.error, padding: spacing.xs, opacity: 0.6 }}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div
                  style={{
                    marginTop: spacing.sm,
                    paddingTop: spacing.sm,
                    borderTop: `1px solid ${colors.borderSecondary}20`,
                  }}
                >
                  {q.type === 'multiple-choice' && (
                    <OptionsSummary options={(q as MultipleChoiceQuestion).options} />
                  )}
                  {q.type === 'image-choice' && (
                    <ImageOptionsSummary options={(q as ImageChoiceQuestion).options} />
                  )}
                  {q.type === 'agree-disagree' && (
                    <AgreeDisagreeSummary scores={(q as AgreeDisagreeQuestion).scores} />
                  )}
                  {q.type === 'xy-axis' && <XYAxisSummary question={q as XYAxisQuestion} />}

                  <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
                    <Button variant="secondary" size="sm" onClick={() => setEditingQuestion(q)}>
                      ✏️ Edit Question
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!questionToDeleteId}
        title="Delete Question"
        message={`Delete "${questionToDelete?.question || 'this question'}"?`}
        confirmText="Delete"
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setQuestionToDeleteId(null)}
      />
    </div>
  );
};

const OptionsSummary: React.FC<{ options: MultipleChoiceQuestion['options'] }> = ({ options }) => (
  <div style={{ fontSize: typography.presets.eyebrow.fontSize, color: colors.textTertiary }}>
    {options.map((opt, i) => {
      const scoreStr = Object.entries(opt.scores)
        .filter(([, v]) => typeof v === 'number' && v > 0)
        .map(([char, v]) => `${char[0]}:${v}`)
        .join(' ');
      return (
        <div key={i} style={{ marginBottom: '2px' }}>
          ├─ {opt.text} {scoreStr && <span style={{ color: colors.accent }}>({scoreStr})</span>}
        </div>
      );
    })}
  </div>
);

const ImageOptionsSummary: React.FC<{ options: ImageChoiceQuestion['options'] }> = ({
  options,
}) => (
  <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
    {options.map((opt, i) => (
      <div
        key={i}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: radius.sm,
          overflow: 'hidden',
          border: `1px solid ${colors.borderSecondary}40`,
        }}
      >
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

const AgreeDisagreeSummary: React.FC<{ scores: AgreeDisagreeQuestion['scores'] }> = ({
  scores,
}) => {
  const levels = ['stronglyDisagree', 'disagree', 'neutral', 'agree', 'stronglyAgree'] as const;
  return (
    <div style={{ fontSize: typography.fontSize['2xs'], color: colors.textTertiary }}>
      {levels.map((level) => {
        const scoreStr = Object.entries(scores[level])
          .filter(([, v]) => typeof v === 'number' && v > 0)
          .map(([char, v]) => `${char[0]}:${v}`)
          .join(' ');
        return (
          <span key={level} style={{ marginRight: spacing.sm }}>
            {level.slice(0, 2).toUpperCase()}: {scoreStr || '—'}
          </span>
        );
      })}
    </div>
  );
};

const XYAxisSummary: React.FC<{ question: XYAxisQuestion }> = ({ question }) => (
  <div style={{ fontSize: typography.presets.eyebrow.fontSize, color: colors.textTertiary }}>
    <div>
      X: {question.xAxis.leftLabel} ↔ {question.xAxis.rightLabel}
    </div>
    <div>
      Y: {question.yAxis.bottomLabel} ↔ {question.yAxis.topLabel}
    </div>
  </div>
);

export default QuestionsTab;
