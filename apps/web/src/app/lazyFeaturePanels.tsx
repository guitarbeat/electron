/* eslint-disable react-refresh/only-export-components */
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import LibraryWorkspace from "@/components/library/LibraryWorkspace";

export { lazyWithRetry };

export const LibraryWorkspacePanel = LibraryWorkspace;

export const MessageBoardPanel = lazyWithRetry(() =>
  import("@/components/messages").then((m) => ({ default: m.MessageBoard })),
);
export const SpinSwipeGamePanel = lazyWithRetry(
  () => import("@/components/spin-match/SpinSwipeGame"),
);
export const SpinWheelGamePanel = lazyWithRetry(
  () => import("@/components/spin-wheel/SpinWheelGame"),
);
export const QuizEditorPanel = lazyWithRetry(() =>
  import("@/components/quiz").then((m) => ({ default: m.QuizEditor })),
);
export const QuizExperiencePanel = lazyWithRetry(() =>
  import("@/components/quiz").then((m) => ({ default: m.QuizExperience })),
);
