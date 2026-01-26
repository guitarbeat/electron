/**
 * QuizEditor Component
 *
 * Full editor UI for managing quiz questions and character descriptions
 */

import React, { useState, useEffect } from 'react';
import { useQuiz } from '../../hooks/useQuiz';
import { QuizData } from '../../services/quizService';
import {
  QuizQuestion,
  QuizCharacter,
  MultipleChoiceQuestion,
  AgreeDisagreeQuestion,
  ImageChoiceQuestion,
} from './types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { spacing, colors, typography, radius } from '../../design-system/tokens';
import { ArrowLeftIcon } from '../icons';

interface QuizEditorProps {
  onClose: () => void;
}

const CHARACTERS: QuizCharacter[] = ['Aaron', 'Electra', 'Madeleine', 'Nosferatu/Smeemo'];

const QuizEditor: React.FC<QuizEditorProps> = ({ onClose }) => {
  const { quizData, isLoading, isSaving, saveAllData, refresh } = useQuiz();
  const [localData, setLocalData] = useState<QuizData | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'descriptions'>('questions');
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (quizData && !localData) {
      setLocalData(quizData);
    }
  }, [quizData, localData]);

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

  if (isLoading || !localData) {
    return (
      <div style={{ textAlign: 'center', padding: spacing['2xl'], color: colors.textSecondary }}>
        Loading quiz data...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: spacing.md }}>
      {/* Header */}
      <Card variant="elevated" style={{ marginBottom: spacing.lg, padding: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
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
            }}
          >
            Quiz Editor
          </h1>
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
}

const QuestionsTab: React.FC<QuestionsTabProps> = ({
  questions,
  editingQuestion,
  setEditingQuestion,
  onUpdateQuestions,
}) => {
  const addNewQuestion = (type: QuizQuestion['type']) => {
    const newId = `q_${Date.now()}`;
    let newQuestion: QuizQuestion;

    if (type === 'multiple-choice') {
      newQuestion = {
        id: newId,
        type: 'multiple-choice',
        question: 'New question?',
        options: [
          { text: 'Option 1', scores: {} },
          { text: 'Option 2', scores: {} },
        ],
      };
    } else if (type === 'agree-disagree') {
      newQuestion = {
        id: newId,
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
    } else {
      newQuestion = {
        id: newId,
        type: 'image-choice',
        question: 'Choose an image:',
        options: [
          { imageUrl: '/quiz-photos/quiz-img-1.png', alt: 'Image 1', scores: {} },
          { imageUrl: '/quiz-photos/quiz-img-2.png', alt: 'Image 2', scores: {} },
        ],
      };
    }

    onUpdateQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion);
  };

  const deleteQuestion = (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    onUpdateQuestions(questions.filter((q) => q.id !== id));
    if (editingQuestion?.id === id) setEditingQuestion(null);
  };

  const saveQuestion = (updated: QuizQuestion) => {
    onUpdateQuestions(questions.map((q) => (q.id === updated.id ? updated : q)));
    setEditingQuestion(null);
  };

  if (editingQuestion) {
    return (
      <QuestionEditor
        question={editingQuestion}
        onSave={saveQuestion}
        onCancel={() => setEditingQuestion(null)}
      />
    );
  }

  return (
    <div>
      {/* Add Question Buttons */}
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' }}>
        <Button variant="secondary" size="sm" onClick={() => addNewQuestion('multiple-choice')}>
          + Multiple Choice
        </Button>
        <Button variant="secondary" size="sm" onClick={() => addNewQuestion('agree-disagree')}>
          + Agree/Disagree
        </Button>
        <Button variant="secondary" size="sm" onClick={() => addNewQuestion('image-choice')}>
          + Image Choice
        </Button>
      </div>

      {/* Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {questions.map((q, index) => (
          <Card
            key={q.id}
            variant="default"
            style={{
              padding: spacing.md,
              backgroundColor: colors.surfaceElevated,
              border: `1px solid ${colors.borderSecondary}10`,
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
            onClick={() => setEditingQuestion(q)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = `${colors.accent}40`;
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = `${colors.borderSecondary}10`;
              e.currentTarget.style.backgroundColor = colors.surfaceElevated;
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.md,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    marginBottom: spacing.xs,
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
                      padding: `2px 6px`,
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
                    letterSpacing: '-0.01em',
                  }}
                >
                  {q.question}
                </p>
              </div>
              <div style={{ display: 'flex', gap: spacing.sm, flexShrink: 0 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteQuestion(q.id);
                  }}
                  style={{
                    color: colors.error,
                    opacity: 0.6,
                    padding: spacing.xs,
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

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

  const updateScore = (optionIndex: number, character: QuizCharacter, score: number) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      scores: { ...newOptions[optionIndex].scores, [character]: score },
    };
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
          <ScoreEditor
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
          <ScoreEditor
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
  const fileInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const updateOption = (index: number, field: 'imageUrl' | 'alt', value: string) => {
    const newOptions = [...question.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange({ ...question, options: newOptions });
  };

  const handleImageUpload = async (index: number, file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 500KB for Gist storage)
    if (file.size > 500 * 1024) {
      alert('Image too large. Please use an image under 500KB for Gist storage.');
      return;
    }

    // Convert to base64
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
              {/* Hidden file input */}
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

              {/* Upload button */}
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

              {/* URL input */}
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

            {/* Delete button */}
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
          <ScoreEditor
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

// Shared Score Editor Component
interface ScoreEditorProps {
  scores: Partial<Record<QuizCharacter, number>>;
  onChange: (scores: Partial<Record<QuizCharacter, number>>) => void;
}

const ScoreEditor: React.FC<ScoreEditorProps> = ({ scores, onChange }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: spacing.md,
        marginTop: spacing.sm,
      }}
    >
      {CHARACTERS.map((char) => (
        <div
          key={char}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs,
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: spacing.sm,
            borderRadius: radius.md,
            border: `1px solid ${colors.borderSecondary}10`,
          }}
        >
          <label
            style={{
              fontSize: '10px',
              color: colors.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: typography.fontWeight.bold,
            }}
          >
            {char}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <input
              type="number"
              min="0"
              max="5"
              value={scores[char] ?? 0}
              onChange={(e) => onChange({ ...scores, [char]: parseInt(e.target.value) || 0 })}
              style={{
                flex: 1,
                padding: spacing.md,
                backgroundColor: colors.background,
                border: `1px solid ${colors.borderSecondary}20`,
                borderRadius: radius.md,
                color: colors.textPrimary,
                fontSize: '16px', // Prevent iOS zoom
                textAlign: 'center',
                fontWeight: typography.fontWeight.bold,
              }}
            />
          </div>
        </div>
      ))}
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
