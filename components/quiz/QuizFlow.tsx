import React, { useState } from 'react';
import { QuizQuestion, QuizAnswer, CharacterScores, QuizResult, QuizCharacter } from './types';
import { quizQuestions } from './data';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import AgreeDisagreeQuestion from './AgreeDisagreeQuestion';
import ImageChoiceQuestion from './ImageChoiceQuestion';
import ResultsScreen from './ResultsScreen';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { spacing, colors, typography, shadows } from '../../design-system/tokens';

interface QuizFlowProps {
  onComplete: () => void;
}

const QuizFlow: React.FC<QuizFlowProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const totalQuestions = quizQuestions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Get current answer for this question
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

  const handleAnswer = (answerIndex?: number, scaleValue?: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree') => {
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      answerIndex,
      scaleValue,
    };

    // Update or add answer
    setAnswers(prev => {
      const filtered = prev.filter(a => a.questionId !== currentQuestion.id);
      return [...filtered, newAnswer];
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate results
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    const scores: CharacterScores = {
      'Electra': 0,
      'Aaron': 0,
      'Madeleine': 0,
      'Nosferatu/Smeemo': 0,
    };

    // Calculate scores from answers
    answers.forEach(answer => {
      const question = quizQuestions.find(q => q.id === answer.questionId);
      if (!question) return;

      if (question.type === 'multiple-choice' && answer.answerIndex !== undefined) {
        const option = question.options[answer.answerIndex];
        Object.entries(option.scores).forEach(([char, score]) => {
          scores[char as QuizCharacter] += (score as number);
        });
      } else if (question.type === 'agree-disagree' && answer.scaleValue) {
        const scaleScores = question.scores[answer.scaleValue];
        Object.entries(scaleScores).forEach(([char, score]) => {
          scores[char as QuizCharacter] += (score as number);
        });
      } else if (question.type === 'image-choice' && answer.answerIndex !== undefined) {
        const option = question.options[answer.answerIndex];
        Object.entries(option.scores).forEach(([char, score]) => {
          scores[char as QuizCharacter] += (score as number);
        });
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
      'Electra': Math.round((scores['Electra'] / totalScore) * 100) || 0,
      'Aaron': Math.round((scores['Aaron'] / totalScore) * 100) || 0,
      'Madeleine': Math.round((scores['Madeleine'] / totalScore) * 100) || 0,
      'Nosferatu/Smeemo': Math.round((scores['Nosferatu/Smeemo'] / totalScore) * 100) || 0,
    };

    // Determine if result is "Neither"
    // If the top character has less than 35% of the total score, it's a weak match
    const topScore = scores[topCharacter];
    const isNeither = totalScore > 0 && (topScore / totalScore) < 0.35;

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
    return <ResultsScreen result={quizResult} onContinue={onComplete} onRetake={handleRetake} />;
  }

  const canProceed = currentAnswer !== undefined;

  return (
    <div
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          marginBottom: spacing.xl,
        }}
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
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: colors.accent,
              transition: 'width 0.3s ease-out',
              boxShadow: shadows.glow,
            }}
          />
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
          aria-label={currentQuestionIndex === totalQuestions - 1 ? 'See results' : 'Next question'}
        >
          {currentQuestionIndex === totalQuestions - 1 ? 'See Results ✨' : 'Next →'}
        </Button>
      </div>
    </div>
  );
};

export default QuizFlow;
