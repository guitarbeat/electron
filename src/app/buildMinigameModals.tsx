import { type CSSProperties, type ReactNode } from "react";
import LazyBoundary from "@/app/LazyBoundary";
import { MessageBoardPanel, QuizEditorPanel } from "@/app/lazyFeaturePanels";

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
  setShowMessages: (open: boolean) => void;
  setShowQuizEditor: (open: boolean) => void;
}

export function buildFeatureModals(
  params: BuildFeatureModalsParams,
): AppModalConfig[] {
  const {
    showMessages,
    showQuizEditor,
    setShowMessages,
    setShowQuizEditor,
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
      key: "quiz-editor",
      isOpen: showQuizEditor,
      onClose: () => setShowQuizEditor(false),
      title: "Quiz · Personality",
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
