/**
 * QuizEditor Component - Refactored Version
 *
 * Full editor UI with drag-drop, preview, templates, undo/redo, and import/export
 * Sub-components extracted to ./editor/
 */

import React, { useState, useEffect } from 'react';
import { useQuiz } from '@/hooks/useQuiz';
import { useUndoRedo } from '@/hooks';
import { useMediaQuery } from '@/hooks';
import { useToast } from '@/context';
import type { QuizData } from '@/hooks/useQuiz';
import { QuizQuestion } from './types';
import QuestionsTab from './editor/QuestionsTab';
import DescriptionsTab from './editor/DescriptionsTab';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import { spacing, colors, typography, radius } from '@/design-system/tokens';
import { ArrowLeftIcon } from '@/common/icons';

interface QuizEditorProps {
  onClose: () => void;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ onClose }) => {
  const { quizData, isLoading, isSaving, saveAllData, refresh } = useQuiz();
  const { showToast } = useToast();
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
          showToast({ message: 'Invalid quiz data format.', type: 'error' });
          return;
        }
        setLocalData(imported);
        setHasChanges(true);
      } catch {
        showToast({ message: 'Failed to parse JSON file.', type: 'error' });
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
              <span
                title="Import quiz from JSON"
                style={{
                  pointerEvents: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 12px',
                  cursor: 'pointer',
                }}
              >
                📥
              </span>
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

export default QuizEditor;
