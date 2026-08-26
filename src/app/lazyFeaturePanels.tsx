import React from "react";

export const MessageBoardPanel = React.lazy(
  () => import("@/components/messages/MessageBoard"),
);
export const SpinSwipeGamePanel = React.lazy(
  () => import("@/components/spin-match/SpinSwipeGame"),
);
export const SpinWheelGamePanel = React.lazy(
  () => import("@/components/spin-wheel/SpinWheelGame"),
);
export const QuizEditorPanel = React.lazy(
  () => import("@/components/quiz/QuizEditor"),
);
export const QuizExperiencePanel = React.lazy(
  () => import("@/components/quiz/QuizExperience"),
);
