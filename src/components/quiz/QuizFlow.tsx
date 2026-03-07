import React, { useState } from 'react';
import { QuizAnswer, QuizResult, XYAxisQuestion as XYAxisQuestionType } from './types';
import { User } from '@/types';
import { QuizData } from '@/services/quizService';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import AgreeDisagreeQuestion from './AgreeDisagreeQuestion';
import ImageChoiceQuestion from './ImageChoiceQuestion';
import XYAxisQuestion from './XYAxisQuestion';
import ResultsScreen from './ResultsScreen';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import { spacing, colors, typography, shadows, radius } from '@/design-system/tokens';
import { calculateQuizResults } from './quizScoring';

interface QuizFlowProps {
  onComplete: () => void;
  quizData: QuizData;
  currentUser?: User | null;
  onEdit?: () => void;
  isCompleted?: boolean;
}

const QuizFlow: React.FC<QuizFlowProps> = ({
  onComplete,
  quizData,
  currentUser,
  onEdit,
  isCompleted,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showResults, setShowResults] = useState(isCompleted || false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const questions = quizData.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  if (!currentQuestion && !showResults) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: spacing['2xl'],
          color: colors.textSecondary,
        }}
      >
        <p style={{ marginBottom: spacing.md }}>No quiz questions available.</p>
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
          <Button onClick={onComplete} variant="primary" size="md">
            Continue
          </Button>
          {onEdit && (
            <Button onClick={onEdit} variant="secondary" size="md">
              Edit Quiz
            </Button>
          )}
        </div>
      </div>
    );
  }

  const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

  const handleAnswer = (
    answerIndex?: number,
    scaleValue?: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree',
    xyPosition?: { x: number; y: number }
  ) => {
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      answerIndex,
      scaleValue,
      xyPosition,
    };

    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== currentQuestion.id);
      return [...filtered, newAnswer];
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    const result = calculateQuizResults(answers, questions);
    setQuizResult(result);
    setShowResults(true);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResults(false);
    setQuizResult(null);
  };

  if (showResults) {
    // If we're already completed, we might not have quizResult yet if we just loaded
    // Need a way to handle 'viewing previous results' if needed, but for now:
    if (!quizResult && isCompleted) {
      return (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>
          <h3>Quiz Completed!</h3>
          <Button onClick={handleRetake} variant="primary" style={{ marginTop: spacing.md }}>
            Retake Quiz
          </Button>
        </div>
      )
    }

    if (quizResult) {
      return (
        <ResultsScreen
          result={quizResult}
          onContinue={onComplete}
          onRetake={handleRetake}
          characterDescriptions={quizData.characterDescriptions}
          neitherDescription={quizData.neitherDescription}
        />
      );
    }
  }

  const canProceed =
    currentAnswer !== undefined &&
    (currentAnswer.answerIndex !== undefined ||
      currentAnswer.scaleValue !== undefined ||
      currentAnswer.xyPosition !== undefined);

  const renderCurrentQuestion = () => {
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <MultipleChoiceQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            selectedIndex={currentAnswer?.answerIndex ?? null}
            onSelect={(index) => handleAnswer(index)}
          />
        );
      case 'agree-disagree':
        return (
          <AgreeDisagreeQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            selectedValue={currentAnswer?.scaleValue ?? null}
            onSelect={(value) => handleAnswer(undefined, value)}
          />
        );
      case 'image-choice':
        return (
          <ImageChoiceQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            selectedIndex={currentAnswer?.answerIndex ?? null}
            onSelect={(index) => handleAnswer(index)}
          />
        );
      case 'xy-axis':
        return (
          <XYAxisQuestion
            key={currentQuestion.id}
            question={currentQuestion as XYAxisQuestionType}
            selectedPosition={currentAnswer?.xyPosition ?? null}
            onSelect={(pos) => handleAnswer(undefined, undefined, pos)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
      }}
    >
      {currentUser && (
        <p
          style={{
            color: colors.textTertiary,
            fontSize: typography.fontSize.xs,
            marginBottom: spacing.sm,
          }}
        >
          Taking quiz as {currentUser}
        </p>
      )}
      <div
        style={{
          marginBottom: spacing.xl,
        }}
        role="progressbar"
        aria-valuenow={currentQuestionIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalQuestions}
        aria-label={`Question ${currentQuestionIndex + 1} of ${totalQuestions}`}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
          }}
        >
          <span
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.accent,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>
        <div
          style={{
            height: '8px',
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            overflow: 'hidden',
            border: `2px solid ${colors.borderSecondary}`,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: colors.accent,
              transition: 'width 0.3s ease-out',
              boxShadow: shadows.glow,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>
        </div>
      </div>

      <Card variant="elevated" className="animate-fade-in" key={currentQuestion.id}>
        <div style={{ padding: spacing['2xl'] }}>{renderCurrentQuestion()}</div>
      </Card>

      <div
        style={{
          display: 'flex',
          gap: spacing.md,
          marginTop: spacing.xl,
          justifyContent: 'space-between',
        }}
      >
        <Button
          variant="secondary"
          size="md"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          style={{
            fontSize: typography.fontSize.base,
            opacity: currentQuestionIndex === 0 ? 0.5 : 1,
            cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
          }}
          aria-label="Previous question"
        >
          {'<- Previous'}
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={handleNext}
          disabled={!canProceed}
          style={{
            fontSize: typography.fontSize.base,
            opacity: !canProceed ? 0.5 : 1,
            cursor: !canProceed ? 'not-allowed' : 'pointer',
          }}
          aria-label={currentQuestionIndex === totalQuestions - 1 ? 'See results' : 'Next question'}
        >
          {currentQuestionIndex === totalQuestions - 1 ? 'See Results' : 'Next ->'}
        </Button>
      </div>
    </div>
  );
};

export default QuizFlow;
