import React from 'react';
import {
  QuizQuestion,
  MultipleChoiceQuestion,
  AgreeDisagreeQuestion,
  ImageChoiceQuestion,
  XYAxisQuestion,
} from '../types';
import QuestionEditor from './QuestionEditor';
import { questionTemplates, TemplateType } from '../QuestionTemplates';
import QuestionPreview from '../QuestionPreview';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { spacing, colors, typography, radius } from '../../../design-system/tokens';

// Questions Tab Component
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
  const addNewQuestion = (templateId: TemplateType = 'blank') => {
    const template = questionTemplates.find((t) => t.id === templateId);
    if (!template) return;

    const newQuestion = template.create();
    onUpdateQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion);
    setShowTemplates(false);
  };

  const deleteQuestion = (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    onUpdateQuestions(questions.filter((q) => q.id !== id));
    if (editingQuestion?.id === id) setEditingQuestion(null);
  };

  const duplicateQuestion = (q: QuizQuestion) => {
    const idx = questions.findIndex((question) => question.id === q.id);
    const duplicate = {
      ...JSON.parse(JSON.stringify(q)),
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

  // Drag handlers
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

  return (
    <div>
      {/* Add Question Buttons / Templates */}
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
                <div style={{ fontSize: '10px', color: colors.textTertiary }}>
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

      {/* Expand/Collapse controls */}
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

      {/* Questions List */}
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
              {/* Question header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                {/* Drag handle */}
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

                {/* Question info */}
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
                        fontSize: '10px',
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
                        fontSize: '9px',
                        color: colors.textTertiary,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        padding: '2px 6px',
                        borderRadius: radius.full,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
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

                {/* Action buttons */}
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

              {/* Expanded content - option preview */}
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
    </div>
  );
};

// Options summary for collapsed view
const OptionsSummary: React.FC<{ options: MultipleChoiceQuestion['options'] }> = ({ options }) => (
  <div style={{ fontSize: '11px', color: colors.textTertiary }}>
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
    <div style={{ fontSize: '10px', color: colors.textTertiary }}>
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
  <div style={{ fontSize: '11px', color: colors.textTertiary }}>
    <div>
      X: {question.xAxis.leftLabel} ↔ {question.xAxis.rightLabel}
    </div>
    <div>
      Y: {question.yAxis.bottomLabel} ↔ {question.yAxis.topLabel}
    </div>
  </div>
);

export default QuestionsTab;
