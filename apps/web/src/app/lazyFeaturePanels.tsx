import { lazyWithRetry } from "@/utils/lazyWithRetry";

export { lazyWithRetry };

export const LibraryWorkspacePanel = lazyWithRetry(
  () => import("@/components/library/LibraryWorkspace"),
);

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
