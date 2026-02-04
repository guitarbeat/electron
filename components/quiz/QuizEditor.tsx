/**
 * QuizEditor Component - Enhanced Version
 *
 * Full editor UI with drag-drop, preview, templates, undo/redo, and import/export
 */

import React, { useState, useEffect, useRef } from 'react';
import { useQuiz } from '../../hooks/useQuiz';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { QuizData } from '../../services/quizService';
import {
  QuizQuestion,
  QuizCharacter,
  MultipleChoiceQuestion,
  AgreeDisagreeQuestion,
  ImageChoiceQuestion,
  XYAxisQuestion,
} from './types';
import XYAxisEditor from './XYAxisEditor';
import { questionTemplates, TemplateType } from './QuestionTemplates';
import ScoreSlider from './ScoreSlider';
import QuestionPreview from './QuestionPreview';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { spacing, colors, typography, radius, shadows } from '../../design-system/tokens';
import { ArrowLeftIcon } from '../icons';

interface QuizEditorProps {
  onClose: () => void;
}

const CHARACTERS: QuizCharacter[] = ['Aaron', 'Electra', 'Madeleine', 'Nosferatu/Smeemo'];

const QuizEditor: React.FC<QuizEditorProps> = ({ onClose }) => {
  const { quizData, isLoading, isSaving, saveAllData, refresh } = useQuiz();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Use undo/redo for local state
  const {
    state: localData,
    setState: setLocalData,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useUndoRedo<QuizData | null>(null);

  const [activeTab, setActiveTab] = useState<'questions' | 'descriptions'>('questions');
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showPreview, setShowPreview] = useState(!isMobile);
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (quizData && !localData) {
      resetHistory(quizData);
    }
  }, [quizData, localData, resetHistory]);

  const handleSave = async () => {
    if (!localData) return;
    await saveAllData(localData);
    setHasChanges(false);
    refresh();
  };

  const updateLocalData = (updates: Partial<QuizData>) => {
    if (!localData) return;
    setLocalData({ ...localData, ...updates });
    setHasChanges(true);
  };

  // Export quiz data as JSON
  const handleExport = () => {
    if (!localData) return;
    const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import quiz data from JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as QuizData;
        // Basic validation
        if (!imported.questions || !Array.isArray(imported.questions)) {
          alert('Invalid quiz data format');
          return;
        }
        setLocalData(imported);
        setHasChanges(true);
      } catch {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  if (isLoading || !localData) {
    return (
      <div style={{ textAlign: 'center', padding: spacing['2xl'], color: colors.textSecondary }}>
        Loading quiz data...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: spacing.md }}>
      {/* Header */}
      <Card variant="elevated" style={{ marginBottom: spacing.lg, padding: spacing.md }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Back">
            <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </Button>
          <h1
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.heading.join(', '),
              margin: 0,
              flex: 1,
              minWidth: '120px',
            }}
          >
            Quiz Editor
          </h1>

          {/* Undo/Redo buttons */}
          <div style={{ display: 'flex', gap: spacing.xs }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
              style={{ opacity: canUndo ? 1 : 0.4 }}
            >
              ↩
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
              style={{ opacity: canRedo ? 1 : 0.4 }}
            >
              ↪
            </Button>
          </div>

          {/* Import/Export */}
          <div style={{ display: 'flex', gap: spacing.xs }}>
            <Button variant="ghost" size="sm" onClick={handleExport} title="Export quiz as JSON">
              📤
            </Button>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <Button
                variant="ghost"
                size="sm"
                as="span"
                title="Import quiz from JSON"
                style={{ pointerEvents: 'none' }}
              >
                📥
              </Button>
            </label>
          </div>

          {/* Preview toggle (desktop only) */}
          {!isMobile && (
            <Button
              variant={showPreview ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? '👁️ Preview On' : '👁️ Preview'}
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            isLoading={isSaving}
            loadingText="Saving..."
          >
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Tabs - Modern Segmented Control */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: radius.lg,
          marginBottom: spacing.xl,
          border: `1px solid ${colors.borderSecondary}10`,
        }}
      >
        <button
          onClick={() => setActiveTab('questions')}
          style={{
            flex: 1,
            padding: `${spacing.sm} ${spacing.md}`,
            border: 'none',
            borderRadius: radius.md,
            backgroundColor: activeTab === 'questions' ? colors.accent : 'transparent',
            color: activeTab === 'questions' ? '#000' : colors.textSecondary,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.bold,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: activeTab === 'questions' ? `0 4px 12px ${colors.accent}40` : 'none',
          }}
        >
          Questions ({localData.questions.length})
        </button>
        <button
          onClick={() => setActiveTab('descriptions')}
          style={{
            flex: 1,
            padding: `${spacing.sm} ${spacing.md}`,
            border: 'none',
            borderRadius: radius.md,
            backgroundColor: activeTab === 'descriptions' ? colors.accent : 'transparent',
            color: activeTab === 'descriptions' ? '#000' : colors.textSecondary,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.bold,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: activeTab === 'descriptions' ? `0 4px 12px ${colors.accent}40` : 'none',
          }}
        >
          Characters
        </button>
      </div>

      {activeTab === 'questions' && (
        <QuestionsTab
          questions={localData.questions}
          editingQuestion={editingQuestion}
          setEditingQuestion={setEditingQuestion}
          onUpdateQuestions={(questions) => updateLocalData({ questions })}
          showPreview={showPreview && !isMobile}
          showTemplates={showTemplates}
          setShowTemplates={setShowTemplates}
          expandedQuestions={expandedQuestions}
          setExpandedQuestions={setExpandedQuestions}
          draggedIndex={draggedIndex}
          setDraggedIndex={setDraggedIndex}
          dragOverIndex={dragOverIndex}
          setDragOverIndex={setDragOverIndex}
          isMobile={isMobile}
        />
      )}

      {activeTab === 'descriptions' && (
        <DescriptionsTab
          characterDescriptions={localData.characterDescriptions}
          neitherDescription={localData.neitherDescription}
          onUpdateDescriptions={(characterDescriptions) =>
            updateLocalData({ characterDescriptions })
          }
          onUpdateNeither={(neitherDescription) => updateLocalData({ neitherDescription })}
        />
      )}
    </div>
  );
};

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

// Question Editor Component
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

// Multiple Choice Editor
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

// Agree/Disagree Editor
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

// Image Choice Editor
interface ImageChoiceEditorProps {
  question: ImageChoiceQuestion;
  onChange: (q: ImageChoiceQuestion) => void;
}

const ImageChoiceEditor: React.FC<ImageChoiceEditorProps> = ({ question, onChange }) => {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateOption = (index: number, field: 'imageUrl' | 'alt', value: string) => {
    const newOptions = [...question.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange({ ...question, options: newOptions });
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 500 * 1024) {
      alert('Image too large. Please use an image under 500KB for Gist storage.');
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
          {/* Image Preview & Upload */}
          <div
            style={{
              display: 'flex',
              gap: spacing.md,
              marginBottom: spacing.md,
              alignItems: 'flex-start',
            }}
          >
            {/* Preview */}
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

            {/* Upload & URL inputs */}
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

          {/* Alt text */}
          <div style={{ marginBottom: spacing.sm }}>
            <Input
              label="Alt Text (description)"
              value={option.alt}
              onChange={(e) => updateOption(idx, 'alt', e.target.value)}
              placeholder="Description of the image"
              style={{ textAlign: 'left' }}
            />
          </div>

          {/* Scores */}
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

// Descriptions Tab Component
interface DescriptionsTabProps {
  characterDescriptions: Record<QuizCharacter, string>;
  neitherDescription: string;
  onUpdateDescriptions: (descriptions: Record<QuizCharacter, string>) => void;
  onUpdateNeither: (description: string) => void;
}

const DescriptionsTab: React.FC<DescriptionsTabProps> = ({
  characterDescriptions,
  neitherDescription,
  onUpdateDescriptions,
  onUpdateNeither,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {CHARACTERS.map((char) => (
        <Card key={char} variant="default">
          <div style={{ padding: spacing.lg }}>
            <h3
              style={{
                fontSize: typography.fontSize.lg,
                marginBottom: spacing.md,
                fontFamily: typography.fontFamily.heading.join(', '),
                color: colors.accent,
              }}
            >
              {char}
            </h3>
            <Textarea
              value={characterDescriptions[char]}
              onChange={(e) =>
                onUpdateDescriptions({ ...characterDescriptions, [char]: e.target.value })
              }
              rows={3}
              style={{ textAlign: 'left' }}
            />
          </div>
        </Card>
      ))}

      <Card variant="default">
        <div style={{ padding: spacing.lg }}>
          <h3
            style={{
              fontSize: typography.fontSize.lg,
              marginBottom: spacing.md,
              fontFamily: typography.fontFamily.heading.join(', '),
              color: colors.textSecondary,
            }}
          >
            "Neither" Result
          </h3>
          <Textarea
            value={neitherDescription}
            onChange={(e) => onUpdateNeither(e.target.value)}
            rows={3}
            style={{ textAlign: 'left' }}
          />
        </div>
      </Card>
    </div>
  );
};

export default QuizEditor;
