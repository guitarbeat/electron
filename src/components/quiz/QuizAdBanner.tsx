import type { FC } from 'react';
import type { User } from '@/shared/types';
import './QuizAdBanner.css';

interface QuizAdBannerProps {
  currentUser: User | null;
  onOpen: () => void;
  onEdit: () => void;
  quizCompleted: boolean;
}

const QuizAdBanner: FC<QuizAdBannerProps> = ({
  currentUser,
  onOpen,
  onEdit,
  quizCompleted,
}) => {
  const headline = quizCompleted
    ? '★ YOU HAVE A TYPE! ★ ARE YOU SURE? RETAKE NOW!'
    : '★ WHICH TYPE OF MOVIE LOVER ARE YOU? ★';
  const sub = quizCompleted
    ? 'Retake for MAXIMUM ACCURACY!!!'
    : '100% FREE PERSONALITY QUIZ!!! DO NOT MISS!!!';
  const btnLabel = quizCompleted ? '>> RETAKE <<' : '>> TAKE THE QUIZ <<';
  const marqueeText =
    '❓ PERSONALITY QUIZ ❓ ✨ CRITIC OR ROMANTIC? ✨ 🧠 FIND YOUR MOVIE TYPE 🧠 ⭐ TAKE THE TEST NOW ⭐ ❓ PERSONALITY QUIZ ❓ ✨ CRITIC OR ROMANTIC? ✨ 🧠 FIND YOUR MOVIE TYPE 🧠 ⭐ TAKE THE TEST NOW ⭐ ';

  return (
    <div className="quiz-ad-banner" role="complementary" aria-label="Personality quiz shortcuts">
      <div className="quiz-ad-banner__rainbow-border">
        <div className="quiz-ad-banner__inner">
          <button
            type="button"
            className="quiz-ad-banner__primary"
            onClick={onOpen}
            aria-label={quizCompleted ? 'Retake the personality quiz' : 'Take the personality quiz'}
          >
            <div className="quiz-ad-banner__marquee-wrap" aria-hidden="true">
              <span className="quiz-ad-banner__marquee">{marqueeText}</span>
            </div>

            <div className="quiz-ad-banner__body">
              <div className="quiz-ad-banner__icon-wrap" aria-hidden="true">
                <span className="quiz-ad-banner__starburst">★</span>
                <span className="quiz-ad-banner__icon">🧠</span>
              </div>

              <div className="quiz-ad-banner__center">
                <p className="quiz-ad-banner__label">🎬 Personality Quiz</p>
                <p className="quiz-ad-banner__headline">{headline}</p>
                <p className="quiz-ad-banner__sub">{sub}</p>
              </div>

              <div className="quiz-ad-banner__right">
                <span className="quiz-ad-banner__cta">{btnLabel}</span>
              </div>
            </div>
          </button>

          {currentUser ? (
            <div className="quiz-ad-banner__utility">
              <p className="quiz-ad-banner__utility-copy">
                Signed in as <strong>{currentUser}</strong>. Jump straight into the editor without
                finishing the quiz first.
              </p>
              <button
                type="button"
                className="quiz-ad-banner__utility-btn"
                onClick={onEdit}
                aria-label="Edit the personality quiz"
              >
                ✏️ Edit Quiz
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default QuizAdBanner;
