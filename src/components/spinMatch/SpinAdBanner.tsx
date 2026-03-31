import type { FC } from 'react';
import './SpinAdBanner.css';

interface SpinAdBannerProps {
  onOpen: () => void;
}

const SpinAdBanner: FC<SpinAdBannerProps> = ({ onOpen }) => {
  return (
    <div className="spin-ad-banner" role="complementary" aria-label="Launch Spin & Match game">
      <div className="spin-ad-banner__rainbow-border">
        <button
          type="button"
          className="spin-ad-banner__inner"
          onClick={onOpen}
          aria-label="Open Spin & Match: spin the wheel to pick tonight's movie"
        >
          <div className="spin-ad-banner__marquee-wrap" aria-hidden="true">
            <span className="spin-ad-banner__marquee">
              {'🎰 SPIN THE WHEEL!!! 🎰 '}
              {'⚡ PICK TONIGHT\'S MOVIE IN SECONDS!!! ⚡ '}
              {'🎰 SPIN THE WHEEL!!! 🎰 '}
              {'⚡ PICK TONIGHT\'S MOVIE IN SECONDS!!! ⚡ '}
            </span>
          </div>

          <div className="spin-ad-banner__body">
            <div className="spin-ad-banner__left">
              <div className="spin-ad-banner__wheel-icon" aria-hidden="true">🎰</div>
            </div>

            <div className="spin-ad-banner__center">
              <p className="spin-ad-banner__headline">
                ★ CAN&apos;T DECIDE WHAT TO WATCH??? ★ LET THE WHEEL DECIDE!!!
              </p>
              <p className="spin-ad-banner__sub">
                SWIPE TO KEEP OR SKIP · THEN SPIN FOR YOUR FATE!!!
              </p>
            </div>

            <div className="spin-ad-banner__right">
              <span className="spin-ad-banner__cta">&gt;&gt; SPIN NOW &lt;&lt;</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SpinAdBanner;
