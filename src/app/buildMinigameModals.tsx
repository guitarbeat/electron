import { type CSSProperties, type ReactNode } from "react";
import LazyBoundary from "@/app/LazyBoundary";
import {
  MessageBoardPanel,
  QuizEditorPanel,
  QuizExperiencePanel,
} from "@/app/lazyFeaturePanels";
import type { User } from "@/shared/types";

export interface AppModalConfig {
  key: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  ariaLabel: string;
  maxWidth: number;
  maxHeight: number;
  closeDisabled?: boolean;
  closeDisabledLabel?: string;
  content: ReactNode;
  contentStyle?: CSSProperties;
}

const scrollContentStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
};

const renderSuspended = (content: ReactNode, label: string) => (
  <LazyBoundary label={label}>{content}</LazyBoundary>
);

export interface BuildFeatureModalsParams {
  showMessages: boolean;
  showQuizEditor: boolean;
  showQuizExperience: boolean;
  quizCompleted: boolean;
  currentUser: User | null;
  setShowMessages: (open: boolean) => void;
  setShowQuizEditor: (open: boolean) => void;
  setShowQuizExperience: (open: boolean) => void;
  onQuizComplete: () => void;
  onQuizRetake: () => void;
  onQuizEdit: () => void;
}

export function buildFeatureModals(
  params: BuildFeatureModalsParams,
): AppModalConfig[] {
  const {
    showMessages,
    showQuizEditor,
    showQuizExperience,
    quizCompleted,
    currentUser,
    setShowMessages,
    setShowQuizEditor,
    setShowQuizExperience,
    onQuizComplete,
    onQuizRetake,
    onQuizEdit,
  } = params;

  return [
    {
      key: "messages",
      title: "Messages · Conversation",
      isOpen: showMessages,
      onClose: () => setShowMessages(false),
      ariaLabel: "Shared messages",
      maxWidth: 820,
      maxHeight: 920,
      contentStyle: scrollContentStyle,
      content: renderSuspended(<MessageBoardPanel />, "Loading messages"),
    },
    {
      key: "quiz-experience",
      isOpen: showQuizExperience,
      onClose: () => setShowQuizExperience(false),
      title: "Quiz · Personality",
      ariaLabel: "Personality quiz",
      maxWidth: 720,
      maxHeight: 900,
      contentStyle: scrollContentStyle,
      content: renderSuspended(
        <QuizExperiencePanel
          currentUser={currentUser}
          quizCompleted={quizCompleted}
          onComplete={onQuizComplete}
          onRetake={onQuizRetake}
          onEdit={currentUser ? onQuizEdit : undefined}
        />,
        "Loading personality quiz",
      ),
    },
    {
      key: "quiz-editor",
      isOpen: showQuizEditor,
      onClose: () => setShowQuizEditor(false),
      title: "Quiz · Editor",
      ariaLabel: "Personality quiz editor",
      maxWidth: 1200,
      maxHeight: 900,
      content: renderSuspended(
        <QuizEditorPanel onClose={() => setShowQuizEditor(false)} />,
        "Loading quiz editor",
      ),
    },
  ];
}
