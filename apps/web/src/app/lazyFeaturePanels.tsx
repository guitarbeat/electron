import React from "react";

const lazyWithRetry = <T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
) =>
  React.lazy(async () => {
    try {
      return await importFn();
    } catch (err) {
      console.warn("Dynamic import failed, retrying chunk load...", err);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return await importFn();
    }
  });

export const MessageBoardPanel = lazyWithRetry(
  () => import("@/components/messages").then(m => ({ default: m.MessageBoard })),
);
export const SpinSwipeGamePanel = lazyWithRetry(
  () => import("@/components/spin-match/SpinSwipeGame"),
);
export const SpinWheelGamePanel = lazyWithRetry(
  () => import("@/components/spin-wheel/SpinWheelGame"),
);
export const QuizEditorPanel = lazyWithRetry(
  () => import("@/components/quiz").then(m => ({ default: m.QuizEditor })),
);
export const QuizExperiencePanel = lazyWithRetry(
  () => import("@/components/quiz").then(m => ({ default: m.QuizExperience })),
);
