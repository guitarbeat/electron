import { type CSSProperties, type ReactNode } from "react";
import LazyBoundary from "@/app/LazyBoundary";
import {
  MessageBoardPanel,
  QuizEditorPanel,
  SpinSwipeGamePanel,
  SpinWheelGamePanel,
} from "@/app/lazyFeaturePanels";

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
  showSpinWheel: boolean;
  showSpinWheelOnly: boolean;
  isSpinWheelLocked: boolean;
  setShowMessages: (open: boolean) => void;
  setShowQuizEditor: (open: boolean) => void;
  setShowSpinWheel: (open: boolean) => void;
  setShowSpinWheelOnly: (open: boolean) => void;
  setIsSpinWheelLocked: (locked: boolean) => void;
}

export function buildFeatureModals(
  params: BuildFeatureModalsParams,
): AppModalConfig[] {
  const {
    showMessages,
    showQuizEditor,
    showSpinWheel,
    showSpinWheelOnly,
    isSpinWheelLocked,
    setShowMessages,
    setShowQuizEditor,
    setShowSpinWheel,
    setShowSpinWheelOnly,
    setIsSpinWheelLocked,
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
    {
      key: "spin-match",
      isOpen: showSpinWheel,
      onClose: () => setShowSpinWheel(false),
      title: "Spin · Match Game",
      ariaLabel: "Choose a subset of movies, then spin the wheel",
      maxWidth: 520,
      maxHeight: 820,
      closeDisabled: isSpinWheelLocked,
      closeDisabledLabel: "Finish the current spin before closing.",
      content: renderSuspended(
        <SpinSwipeGamePanel onSpinningChange={setIsSpinWheelLocked} />,
        "Loading spin match",
      ),
      contentStyle: { flex: 1, overflowY: "auto" },
    },
    {
      key: "spin-wheel-only",
      isOpen: showSpinWheelOnly,
      onClose: () => setShowSpinWheelOnly(false),
      title: "Spin · Wheel Picker",
      ariaLabel: "Spin the wheel to pick a movie",
      maxWidth: 520,
      maxHeight: 700,
      content: renderSuspended(<SpinWheelGamePanel />, "Loading spin wheel"),
      contentStyle: { flex: 1, overflowY: "auto" },
    },
  ];
}
