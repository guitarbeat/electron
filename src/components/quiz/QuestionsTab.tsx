import React, { useState } from "react";
import type {
  AgreeDisagreeQuestion,
  ImageChoiceQuestion,
  MultipleChoiceQuestion,
  QuizQuestion,
  XYAxisQuestion,
} from "./lib/types";
import { questionTemplates, TemplateType } from "./lib/QuestionTemplates";
import QuestionPreview from "./QuestionPreview";
import QuestionEditorPanel, {
  AgreeDisagreeSummary,
  ImageOptionsSummary,
  OptionsSummary,
  XYAxisSummary,
} from "./QuestionEditorPanel";
import {
  getQuestionDetail,
  QUESTION_TYPE_LABELS,
} from "./lib/QuestionEditorMeta";
import Card from "@/ui/Card";
import Button from "@/ui/Button";
import ConfirmDialog from "@/ui/ConfirmDialog";
import { deepClone } from "@/utils";

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
}) => {
  const [questionToDeleteId, setQuestionToDeleteId] = useState<string | null>(
    null,
  );
  const [liveDraftQuestion, setLiveDraftQuestion] =
    useState<QuizQuestion | null>(null);

  const addNewQuestion = (templateId: TemplateType = "blank") => {
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
    if (editingQuestion?.id === id) {
      setEditingQuestion(null);
      setLiveDraftQuestion(null);
    }
    setQuestionToDeleteId(null);
  };

  const duplicateQuestion = (q: QuizQuestion) => {
    const idx = questions.findIndex((question) => question.id === q.id);
    const duplicate = {
      ...deepClone(q),
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
    onUpdateQuestions(
      questions.map((q) => (q.id === updated.id ? updated : q)),
    );
    setLiveDraftQuestion(null);
    setEditingQuestion(null);
  };

  const cancelEditing = () => {
    setLiveDraftQuestion(null);
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

  const activeQuestion =
    editingQuestion && liveDraftQuestion?.id === editingQuestion.id
      ? liveDraftQuestion
      : editingQuestion;

  if (activeQuestion) {
    return (
      <div
        className={`quiz-editor__composer-layout ${
          showPreview ? "quiz-editor__composer-layout--with-preview" : ""
        }`}
      >
        <QuestionEditorPanel
          key={activeQuestion.id}
          question={activeQuestion}
          onDraftChange={setLiveDraftQuestion}
          onSave={saveQuestion}
          onCancel={cancelEditing}
        />
        {showPreview && (
          <div className="quiz-editor__composer-preview">
            <QuestionPreview question={activeQuestion} />
          </div>
        )}
      </div>
    );
  }

  const questionToDelete = questionToDeleteId
    ? questions.find((question) => question.id === questionToDeleteId)
    : null;

  return (
    <div className="quiz-editor__questions-layout">
      <Card variant="elevated" className="quiz-editor__library">
        <div className="quiz-editor__library-shell">
          <div className="quiz-editor__library-header">
            <div className="quiz-editor__panel-intro">
              <p className="quiz-editor__section-eyebrow">Question Library</p>
              <h2 className="quiz-editor__section-title">
                Shape the quiz sequence.
              </h2>
              <p className="quiz-editor__section-copy">
                Add new moments from scratch or spin up a ready-made structure,
                then rearrange the flow until the pacing feels right.
              </p>
            </div>

            <div className="quiz-editor__library-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                {showTemplates ? "Hide Templates" : "Browse Templates"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => addNewQuestion("blank")}
              >
                New Question
              </Button>
            </div>
          </div>

          {showTemplates ? (
            <div className="quiz-editor__template-grid">
              {questionTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => addNewQuestion(template.id)}
                  className="quiz-editor__template-card"
                >
                  <div className="quiz-editor__template-icon">
                    {template.icon}
                  </div>
                  <p className="quiz-editor__template-name">{template.name}</p>
                  <p className="quiz-editor__template-description">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="quiz-editor__quick-create">
              <button
                type="button"
                className="quiz-editor__quick-button"
                onClick={() => addNewQuestion("blank")}
              >
                <div className="quiz-editor__template-icon">✍️</div>
                <p className="quiz-editor__template-name">Multiple Choice</p>
                <p className="quiz-editor__template-description">
                  Start with a blank prompt and two answer options.
                </p>
              </button>

              <button
                type="button"
                className="quiz-editor__quick-button"
                onClick={() => addNewQuestion("agree-disagree")}
              >
                <div className="quiz-editor__template-icon">⚖️</div>
                <p className="quiz-editor__template-name">Agree / Disagree</p>
                <p className="quiz-editor__template-description">
                  Use the five-step scale with pre-wired scoring slots.
                </p>
              </button>

              <button
                type="button"
                className="quiz-editor__quick-button"
                onClick={() => addNewQuestion("image-grid")}
              >
                <div className="quiz-editor__template-icon">🖼️</div>
                <p className="quiz-editor__template-name">Image Choice</p>
                <p className="quiz-editor__template-description">
                  Let the player choose the image that resonates most.
                </p>
              </button>

              <button
                type="button"
                className="quiz-editor__quick-button"
                onClick={() => addNewQuestion("xy-axis")}
              >
                <div className="quiz-editor__template-icon">🧭</div>
                <p className="quiz-editor__template-name">2D Spectrum</p>
                <p className="quiz-editor__template-description">
                  Capture nuance by placing a response on an X/Y grid.
                </p>
              </button>
            </div>
          )}
        </div>
      </Card>

      <div className="quiz-editor__list-toolbar">
        <p className="quiz-editor__list-toolbar-note">
          Drag cards to reorder the quiz, or use the quick controls when you
          want a precise move.
        </p>

        <div className="quiz-editor__library-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAll}
            disabled={questions.length === 0}
          >
            Expand All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            disabled={questions.length === 0}
          >
            Collapse All
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="quiz-editor__summary-block">
          <p className="quiz-editor__section-copy">
            No questions yet. Start with a blank question or open the template
            browser above.
          </p>
        </div>
      ) : (
        <div className="quiz-editor__question-list">
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
                className={`quiz-editor__question-card ${
                  isExpanded ? "quiz-editor__question-card--expanded" : ""
                } ${isDragOver ? "quiz-editor__question-card--drag-over" : ""}`}
                style={{
                  opacity: isDragging ? 0.55 : 1,
                }}
              >
                <div className="quiz-editor__question-card-header">
                  <div
                    className="quiz-editor__drag-handle"
                    title="Drag to reorder"
                  >
                    ⋮⋮
                  </div>

                  <div
                    className="quiz-editor__question-summary"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleExpand(q.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleExpand(q.id);
                      }
                    }}
                  >
                    <div className="quiz-editor__question-topline">
                      <span className="quiz-editor__question-index">
                        #{index + 1}
                      </span>
                      <span className="quiz-editor__type-badge">
                        {QUESTION_TYPE_LABELS[q.type]}
                      </span>
                    </div>

                    <p className="quiz-editor__question-text">{q.question}</p>

                    <div className="quiz-editor__question-meta">
                      <p className="quiz-editor__question-detail">
                        {getQuestionDetail(q)}
                      </p>
                      <p className="quiz-editor__question-detail">
                        {isExpanded
                          ? "Expanded details"
                          : "Tap to inspect summary"}
                      </p>
                    </div>
                  </div>

                  <div className="quiz-editor__question-actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateQuestion(q)}
                      title="Duplicate"
                    >
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        moveQuestion(index, Math.max(0, index - 1))
                      }
                      disabled={index === 0}
                      title="Move up"
                    >
                      Up
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        moveQuestion(
                          index,
                          Math.min(questions.length - 1, index + 1),
                        )
                      }
                      disabled={index === questions.length - 1}
                      title="Move down"
                    >
                      Down
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestion(q.id)}
                      title="Delete question"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="quiz-editor__question-body">
                    <div className="quiz-editor__panel-intro">
                      <p className="quiz-editor__section-eyebrow">
                        Question Summary
                      </p>
                      <p className="quiz-editor__section-copy">
                        Review the current structure before jumping back into
                        the full editor.
                      </p>
                    </div>

                    <div className="quiz-editor__summary-block">
                      {q.type === "multiple-choice" && (
                        <OptionsSummary
                          options={(q as MultipleChoiceQuestion).options}
                        />
                      )}
                      {q.type === "image-choice" && (
                        <ImageOptionsSummary
                          options={(q as ImageChoiceQuestion).options}
                        />
                      )}
                      {q.type === "agree-disagree" && (
                        <AgreeDisagreeSummary
                          scores={(q as AgreeDisagreeQuestion).scores}
                        />
                      )}
                      {q.type === "xy-axis" && (
                        <XYAxisSummary question={q as XYAxisQuestion} />
                      )}
                    </div>

                    <div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingQuestion(q)}
                      >
                        Edit Question
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!questionToDeleteId}
        title="Delete Question"
        message={`Delete "${questionToDelete?.question || "this question"}"?`}
        confirmText="Delete"
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setQuestionToDeleteId(null)}
      />
    </div>
  );
};

export default QuestionsTab;
