/**
 * QuizEditor Component - Refactored Version
 *
 * Full editor UI with drag-drop, preview, templates, undo/redo, and import/export
 * Sub-components merged into quiz/QuizEditor scope.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuiz } from '@/hooks/useQuiz';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { useToast } from '@/app/useProviders';
import type { QuizData } from '@/hooks/useQuiz';
import { CHARACTERS, QuizQuestion } from './lib/types';
import QuestionsTab from './QuestionsTab';
import DescriptionsTab from './DescriptionsTab';
import SyncBanner from '@/components/ui/SyncBanner';
import Button from '@/ui/LegacyButton';
import { spacing, colors } from '@/theme/tokens';
import { ArrowLeftIcon, EyeIcon } from '@/common/Icons';
import { useFeatureFonts } from "@/hooks/useFeatureFonts";
import './retro-ad.css';
import './QuizEditor.css';

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
  reset: (initialState: T) => void;
}

const MAX_HISTORY_SIZE = 20;

const useUndoRedo = <T,>(initialState: T): UseUndoRedoReturn<T> => {
  const [state, setStateInternal] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const isUndoRedoRef = useRef(false);
  const stateRef = useRef<T>(initialState);

  // Keep stateRef in sync with the latest state value
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setState = useCallback((newState: T) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      setStateInternal(newState);
      return;
    }

    setStateInternal((prevState) => {
      setPast((prevPast) => {
        const newPast = [...prevPast, prevState];
        if (newPast.length > MAX_HISTORY_SIZE) {
          return newPast.slice(newPast.length - MAX_HISTORY_SIZE);
        }
        return newPast;
      });
      setFuture([]);
      return newState;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const newPast = [...prevPast];
      const previousState = newPast.pop()!;

      setFuture((prevFuture) => {
        setStateInternal(() => {
          isUndoRedoRef.current = true;
          return previousState;
        });
        return [stateRef.current, ...prevFuture];
      });

      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const [nextState, ...newFuture] = prevFuture;

      setPast((prevPast) => {
        setStateInternal(() => {
          isUndoRedoRef.current = true;
          return nextState;
        });
        return [...prevPast, stateRef.current];
      });

      return newFuture;
    });
  }, []);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  const reset = useCallback((newInitialState: T) => {
    setStateInternal(newInitialState);
    stateRef.current = newInitialState;
    setPast([]);
    setFuture([]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        if (event.shiftKey) {
          event.preventDefault();
          redo();
        } else {
          event.preventDefault();
          undo();
        }
      } else if ((event.ctrlKey || event.metaKey) && event.key === "y") {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clear,
    reset,
  };
};

interface QuizEditorProps {
  onClose: () => void;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ onClose }) => {
  const {
    quizData,
    isLoading,
    isSaving,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    saveAllData,
    refresh,
    retrySync,
  } = useQuiz();
  const { showToast } = useToast();
  const isMobile = useMediaQuery(mediaBreakpoints.md);

  useFeatureFonts();

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

  const [activeTab, setActiveTab] = useState<"questions" | "descriptions">(
    "questions",
  );
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(
    null,
  );
  const [showPreview, setShowPreview] = useState(!isMobile);
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );
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
    try {
      await saveAllData(localData);
      setHasChanges(false);
      refresh();
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to save quiz changes.",
        type: "error",
      });
    }
  };

  const updateLocalData = (updates: Partial<QuizData>) => {
    if (!localData) return;
    setLocalData({ ...localData, ...updates });
    setHasChanges(true);
  };

  // Export quiz data as JSON
  const handleExport = () => {
    if (!localData) return;
    const blob = new Blob([JSON.stringify(localData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-export-${new Date().toISOString().split("T")[0]}.json`;
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
          showToast({ message: "Invalid quiz data format.", type: "error" });
          return;
        }
        setLocalData(imported);
        setHasChanges(true);
      } catch {
        showToast({ message: "Failed to parse JSON file.", type: "error" });
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  if (isLoading || !localData) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: spacing["2xl"],
          color: colors.textSecondary,
        }}
      >
        Loading quiz data...
      </div>
    );
  }

  const completedDescriptions =
    CHARACTERS.filter(
      (character) =>
        localData.characterDescriptions[character].trim().length > 0,
    ).length + Number(localData.neitherDescription.trim().length > 0);
  const descriptionCoverage = Math.round(
    (completedDescriptions / (CHARACTERS.length + 1)) * 100,
  );
  const questionFormatCount = new Set(
    localData.questions.map((question) => question.type),
  ).size;

  return (
    <div className="quiz-editor-shell">
      <div className="quiz-retro-marquee-bar quiz-editor__marquee">
        <span className="quiz-retro-marquee-inner">
          ★★★ EDIT MODE ACTIVATED!!! REORDER QUESTIONS!!! TUNE SCORES!!! REWRITE
          RESULTS!!! ★★★
        </span>
      </div>

      <div className="quiz-retro-rainbow-border quiz-editor__frame-border">
        <div className="quiz-retro-header-bar">
          <span>★ PERSONALITY QUIZ STUDIO - WORKING COPY OPEN ★</span>
        </div>
      </div>

      <section className="quiz-editor__hero">
        <div className="quiz-editor__hero-content">
          <div className="quiz-editor__hero-top">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Back"
              className="quiz-editor__back-button"
            >
              <ArrowLeftIcon size={18} />
            </Button>

            <div className="quiz-editor__hero-copy">
              <p className="quiz-editor__eyebrow">Personality Quiz Studio</p>
              <div className="quiz-editor__hero-title-row">
                <h1 className="quiz-editor__hero-title">
                  Edit the quiz flow, scoring, and results.
                </h1>
                <span
                  className={`quiz-editor__status-pill ${
                    hasChanges
                      ? "quiz-editor__status-pill--dirty"
                      : "quiz-editor__status-pill--clean"
                  }`}
                >
                  {hasChanges ? "Unsaved changes" : "Working copy ready"}
                </span>
              </div>
              <p className="quiz-editor__hero-description">
                Manage question order, tune character weighting, and rewrite
                each result profile from one workspace.
              </p>
            </div>

            <div className="quiz-editor__hero-actions">
              <div className="quiz-editor__hero-action-row">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undo}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                  aria-label="Undo"
                >
                  Undo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={redo}
                  disabled={!canRedo}
                  title="Redo (Ctrl+Shift+Z)"
                  aria-label="Redo"
                >
                  Redo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  title="Export quiz as JSON"
                >
                  Export JSON
                </Button>
                <label
                  className="ui-button ui-button--ghost ui-button--sm quiz-editor__import-label"
                  aria-label="Import quiz from JSON"
                >
                  <span className="ui-button__content">Import JSON</span>
                  <input type="file" accept=".json" onChange={handleImport} />
                </label>
              </div>

              <div className="quiz-editor__hero-action-row quiz-editor__hero-action-row--save">
                {!isMobile && (
                  <Button
                    variant={showPreview ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    leftIcon={<EyeIcon size={16} />}
                  >
                    {showPreview ? "Hide preview" : "Show preview"}
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
            </div>
          </div>

          <div className="quiz-editor__hero-stats">
            <div className="quiz-editor__stat">
              <p className="quiz-editor__stat-value">
                {localData.questions.length}
              </p>
              <p className="quiz-editor__stat-label">Questions in flow</p>
              <p className="quiz-editor__stat-detail">
                {questionFormatCount} scoring formats in active use
              </p>
            </div>

            <div className="quiz-editor__stat">
              <p className="quiz-editor__stat-value">{descriptionCoverage}%</p>
              <p className="quiz-editor__stat-label">Results copy coverage</p>
              <p className="quiz-editor__stat-detail">
                {completedDescriptions} of {CHARACTERS.length + 1} endings
                currently filled
              </p>
            </div>

            <div className="quiz-editor__stat">
              <p className="quiz-editor__stat-value">
                {showPreview && !isMobile ? "On" : "Focus"}
              </p>
              <p className="quiz-editor__stat-label">Editing mode</p>
              <p className="quiz-editor__stat-detail">
                {showPreview && !isMobile
                  ? "Preview stays visible beside the composer"
                  : "Workspace is prioritizing editing space"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {isDegraded && (
        <div>
          <SyncBanner
            isBlocked={isSyncBlocked}
            onRetry={() => void retrySync()}
            label={
              isSyncBlocked
                ? "Quiz changes conflicted with a newer shared version. Refresh and retry."
                : syncWarning ||
                  "Quiz edits are being kept locally until shared sync recovers."
            }
          />
        </div>
      )}

      <div className="quiz-editor__tabs">
        <button
          onClick={() => setActiveTab("questions")}
          className={`quiz-editor__tab ${
            activeTab === "questions" ? "quiz-editor__tab--active" : ""
          }`}
        >
          <span className="quiz-editor__tab-label">Questions</span>
          <span className="quiz-editor__tab-meta">
            {localData.questions.length} items in sequence
          </span>
        </button>
        <button
          onClick={() => setActiveTab("descriptions")}
          className={`quiz-editor__tab ${
            activeTab === "descriptions" ? "quiz-editor__tab--active" : ""
          }`}
        >
          <span className="quiz-editor__tab-label">Results Copy</span>
          <span className="quiz-editor__tab-meta">
            {completedDescriptions} of {CHARACTERS.length + 1} result profiles
            ready
          </span>
        </button>
      </div>

      {activeTab === "questions" && (
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
        />
      )}

      {activeTab === "descriptions" && (
        <DescriptionsTab
          characterDescriptions={localData.characterDescriptions}
          neitherDescription={localData.neitherDescription}
          onUpdateDescriptions={(characterDescriptions) =>
            updateLocalData({ characterDescriptions })
          }
          onUpdateNeither={(neitherDescription) =>
            updateLocalData({ neitherDescription })
          }
        />
      )}

      <div className="quiz-retro-marquee-bar quiz-editor__marquee quiz-editor__marquee--bottom">
        <span
          className="quiz-retro-marquee-inner"
          style={{ animationDelay: "-7s" }}
        >
          ★★★ LIVE QUIZ STYLE SYNCHRONIZED!!! PREVIEW THE PLAYER EXPERIENCE
          BESIDE YOUR EDITS!!! ★★★
        </span>
      </div>
    </div>
  );
};

export default QuizEditor;
