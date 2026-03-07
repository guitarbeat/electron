import React from 'react';
import { useQuiz } from '../../hooks/useQuiz';
import QuizBubble from '../quiz/QuizBubble';
import MatchmakerBubble from '../matchmaker/MatchmakerBubble';
import MinecraftBubble from '../common/MinecraftBubble';
import FoodDropBubble from '../food-drop/FoodDropBubble';
import SnakeBubble from '../snake/SnakeBubble';
import MemoriesBubble from '../memories/MemoriesBubble';
import SpinWheelBubble from '../extras/spin-wheel/SpinWheelBubble';

interface FloatingBubblesProps {
  quizCompleted: boolean;
  currentUser: any;
  onQuizComplete: () => void;
  onOpenQuizEditor: () => void;
}

const FloatingBubbles: React.FC<FloatingBubblesProps> = ({
  quizCompleted,
  currentUser,
  onQuizComplete,
  onOpenQuizEditor,
}) => {
  const { quizData } = useQuiz();

  return (
    <div className="floating-bubbles">
      {/* Quiz Bubble */}
      <QuizBubble
        quizData={quizData}
        quizCompleted={quizCompleted}
        currentUser={currentUser}
        onQuizComplete={onQuizComplete}
        onOpenQuizEditor={onOpenQuizEditor}
      />

      {/* Matchmaker Bubble */}
      <MatchmakerBubble currentUser={currentUser} />

      {/* Minecraft Bubble */}
      <MinecraftBubble />

      {/* Food Drop Bubble */}
      <FoodDropBubble currentUser={currentUser} />

      {/* Snake Bubble */}
      <SnakeBubble currentUser={currentUser} />

      {/* Memories Bubble */}
      <MemoriesBubble currentUser={currentUser} />

      {/* Spin Wheel Bubble */}
      <SpinWheelBubble currentUser={currentUser} />

      {/* Add more bubbles as needed */}
    </div>
  );
};

export default FloatingBubbles;
