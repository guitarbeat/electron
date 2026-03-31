import type { FC } from 'react';
import './QuizAdBanner.css';

interface QuizAdBannerProps {
  onOpen: () => void;
  quizCompleted: boolean;
}

const QuizAdBanner: FC<QuizAdBannerProps> = ({ onOpen, quizCompleted }) => {
  const headline = quizCompleted
    ? '★ YOU HAVE A MOVIE PERSONALITY! ★ RETAKE NOW!!!'
    : '★ FIND YOUR MOVIE PERSONALITY! ★ CLICK NOW!!!';
  const sub = quizCompleted
    ? 'Results may vary. Retake for MAXIMUM ACCURACY!!!'
    : '100% FREE!!! LIMITED TIME OFFER!!! DO NOT MISS!!!';
  const btnLabel = quizCompleted ? '>> RETAKE QUIZ <<' : '>> CLICK HERE <<';

  return (
    <div className="quiz-ad-banner" role="complementary" aria-label="Take the personality quiz">
      <div className="quiz-ad-banner__rainbow-border">
        <button
          type="button"
          className="quiz-ad-banner__inner"
          onClick={onOpen}
          aria-label={quizCompleted ? 'Retake the personality quiz' : 'Take the personality quiz'}
        >
          <div className="quiz-ad-banner__marquee-wrap" aria-hidden="true">
            <span className="quiz-ad-banner__marquee">
              {'🎬 MOVIE NIGHT QUIZ 🎬 '}
              {'★ ARE YOU THE CRITIC OR THE ROMANTIC? ★ '}
              {'⚡ FIND OUT NOW ⚡ '}
              {'🎬 MOVIE NIGHT QUIZ 🎬 '}
              {'★ ARE YOU THE CRITIC OR THE ROMANTIC? ★ '}
              {'⚡ FIND OUT NOW ⚡ '}
            </span>
          </div>

          <div className="quiz-ad-banner__body">
            <div className="quiz-ad-banner__left">
              <div className="quiz-ad-banner__starburst" aria-hidden="true">
                <span className="quiz-ad-banner__starburst-text">FREE!</span>
              </div>
            </div>

            <div className="quiz-ad-banner__center">
              <p className="quiz-ad-banner__headline">{headline}</p>
              <p className="quiz-ad-banner__sub">{sub}</p>
            </div>

            <div className="quiz-ad-banner__right">
              <span className="quiz-ad-banner__cta">{btnLabel}</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuizAdBanner;
