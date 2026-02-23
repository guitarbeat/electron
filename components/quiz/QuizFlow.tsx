import React, { useState } from 'react';
import {
  QuizQuestion,
  QuizAnswer,
  CharacterScores,
  QuizResult,
  QuizCharacter,
  XYAxisQuestion as XYAxisQuestionType,
} from './types';
import { QuizData } from '../../services/quizService';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import AgreeDisagreeQuestion from './AgreeDisagreeQuestion';
import ImageChoiceQuestion from './ImageChoiceQuestion';
import XYAxisQuestion from './XYAxisQuestion';
import ResultsScreen from './ResultsScreen';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { spacing, colors, typography, shadows, radius } from '../../design-system/tokens';

interface QuizFlowProps {
  onComplete: () => void;
  quizData: QuizData;
}

const QuizFlow: React.FC<QuizFlowProps> = ({ onComplete, quizData }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const questions = quizData.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  // Handle case where questions are missing or index is invalid
  if (!currentQuestion) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: spacing['2xl'],
          color: colors.textSecondary,
        }}
      >
        <p style={{ marginBottom: spacing.md }}>No quiz questions available.</p>
        <Button onClick={onComplete} variant="primary" size="md">
          Continue
        </Button>
      </div>
    );
  }

  // Get current answer for this question
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

    // Update or add answer
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== currentQuestion.id);
      return [...filtered, newAnswer];
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Calculate results
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const calculateResults = () => {
    const scores: CharacterScores = {
      Electra: 0,
      Aaron: 0,
      Madeleine: 0,
      'Nosferatu/Smeemo': 0,
    };

    // Calculate scores from answers
    answers.forEach((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) return;

      if (question.type === 'multiple-choice' && answer.answerIndex !== undefined) {
        const option = question.options[answer.answerIndex];
        Object.entries(option.scores).forEach(([char, score]) => {
          scores[char as QuizCharacter] += score as number;
        });
      } else if (question.type === 'agree-disagree' && answer.scaleValue) {
        const scaleScores = question.scores[answer.scaleValue];
        Object.entries(scaleScores).forEach(([char, score]) => {
          scores[char as QuizCharacter] += score as number;
        });
      } else if (question.type === 'image-choice' && answer.answerIndex !== undefined) {
        const option = question.options[answer.answerIndex];
        Object.entries(option.scores).forEach(([char, score]) => {
          scores[char as QuizCharacter] += score as number;
        });
      } else if (question.type === 'xy-axis' && answer.xyPosition) {
        // Calculate quadrant weights based on position
        const { x, y } = answer.xyPosition;
        const { quadrantScores } = question;

        // Weight calculation: how much each quadrant contributes
        // topLeft: x < 0, y > 0
        // topRight: x > 0, y > 0
        // bottomLeft: x < 0, y < 0
        // bottomRight: x > 0, y < 0
        const tlWeight = Math.max(0, -x) * Math.max(0, y);
        const trWeight = Math.max(0, x) * Math.max(0, y);
        const blWeight = Math.max(0, -x) * Math.max(0, -y);
        const brWeight = Math.max(0, x) * Math.max(0, -y);

        const totalWeight = tlWeight + trWeight + blWeight + brWeight || 1;

        // Apply weighted scores from each quadrant
        const applyQuadrant = (qScores: Partial<Record<QuizCharacter, number>>, weight: number) => {
          Object.entries(qScores).forEach(([char, score]) => {
            scores[char as QuizCharacter] += ((score as number) * weight) / totalWeight;
          });
        };

        applyQuadrant(quadrantScores.topLeft, tlWeight);
        applyQuadrant(quadrantScores.topRight, trWeight);
        applyQuadrant(quadrantScores.bottomLeft, blWeight);
        applyQuadrant(quadrantScores.bottomRight, brWeight);
      }
    });

    // Find highest scoring character
    const sortedCharacters = (Object.keys(scores) as QuizCharacter[]).sort(
      (a, b) => scores[b] - scores[a]
    );
    const topCharacter = sortedCharacters[0];

    // Calculate percentages
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const percentages: Record<QuizCharacter, number> = {
      Electra: Math.round((scores.Electra / totalScore) * 100) || 0,
      Aaron: Math.round((scores.Aaron / totalScore) * 100) || 0,
      Madeleine: Math.round((scores.Madeleine / totalScore) * 100) || 0,
      'Nosferatu/Smeemo': Math.round((scores['Nosferatu/Smeemo'] / totalScore) * 100) || 0,
    };

    // Determine if result is "Neither"
    // If the top character has less than 35% of the total score, it's a weak match
    const topScore = scores[topCharacter];
    const isNeither = totalScore > 0 && topScore / totalScore < 0.35;

    const result: QuizResult = {
      character: isNeither ? 'Neither' : topCharacter,
      scores,
      percentages,
    };

    setQuizResult(result);
    setShowResults(true);
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResults(false);
    setQuizResult(null);
  };

  if (showResults && quizResult) {
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

  const canProceed =
    currentAnswer !== undefined &&
    (currentAnswer.answerIndex !== undefined ||
      currentAnswer.scaleValue !== undefined ||
      currentAnswer.xyPosition !== undefined);

  return (
    <div
      style={
        isFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2100,
              backgroundColor: colors.background,
              padding: spacing.xl,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }
          : {
              maxWidth: '48rem',
              margin: '0 auto',
            }
      }
    >
      <div
        style={{
          width: '100%',
          maxWidth: '48rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: spacing.md,
          }}
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              border: `1px solid ${colors.accent}80`,
              borderRadius: radius.full,
              padding: '6px 14px',
              fontWeight: '600',
              boxShadow: shadows.glow,
              backgroundColor: `${colors.accent}15`,
              color: colors.accent,
            }}
          >
            {isFullscreen ? 'Exit Full' : '⛶ Fullscreen'}
          </Button>
        </div>

        {/* Progress bar */}
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
              borderRadius: '4px',
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
              {/* Animated shimmer effect */}
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

        {/* Question card */}
        <Card variant="elevated" className="animate-fade-in" key={currentQuestion.id}>
          <div style={{ padding: spacing['2xl'] }}>
            {currentQuestion.type === 'multiple-choice' && (
              <MultipleChoiceQuestion
                key={currentQuestion.id}
                question={currentQuestion}
                selectedIndex={currentAnswer?.answerIndex ?? null}
                onSelect={(index) => handleAnswer(index)}
              />
            )}
            {currentQuestion.type === 'agree-disagree' && (
              <AgreeDisagreeQuestion
                key={currentQuestion.id}
                question={currentQuestion}
                selectedValue={currentAnswer?.scaleValue ?? null}
                onSelect={(value) => handleAnswer(undefined, value)}
              />
            )}
            {currentQuestion.type === 'image-choice' && (
              <ImageChoiceQuestion
                key={currentQuestion.id}
                question={currentQuestion}
                selectedIndex={currentAnswer?.answerIndex ?? null}
                onSelect={(index) => handleAnswer(index)}
              />
            )}
            {currentQuestion.type === 'xy-axis' && (
              <XYAxisQuestion
                key={currentQuestion.id}
                question={currentQuestion as XYAxisQuestionType}
                selectedPosition={currentAnswer?.xyPosition ?? null}
                onSelect={(pos) => handleAnswer(undefined, undefined, pos)}
              />
            )}
          </div>
        </Card>

        {/* Navigation buttons */}
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
            ← Previous
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
            aria-label={
              currentQuestionIndex === totalQuestions - 1 ? 'See results' : 'Next question'
            }
          >
            {currentQuestionIndex === totalQuestions - 1 ? 'See Results ✨' : 'Next →'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizFlow;
