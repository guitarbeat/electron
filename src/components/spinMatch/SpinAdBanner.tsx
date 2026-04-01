import type { FC } from 'react';
import './SpinAdBanner.css';

interface SpinAdBannerProps {
  onOpen: () => void;
}

const SpinAdBanner: FC<SpinAdBannerProps> = ({ onOpen }) => {
  const marqueeText = '🎡 SPIN THE WHEEL!!! 🎡 ⚡ PICK TONIGHT\'S MOVIE IN SECONDS!!! ⚡ 🎯 SWIPE · SPIN · DECIDE!!! 🎯 🎡 SPIN THE WHEEL!!! 🎡 ⚡ PICK TONIGHT\'S MOVIE IN SECONDS!!! ⚡ 🎯 SWIPE · SPIN · DECIDE!!! 🎯 ';

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
            <span className="spin-ad-banner__marquee">{marqueeText}</span>
          </div>

          <div className="spin-ad-banner__body">
            <div className="spin-ad-banner__left" aria-hidden="true">
              <div className="spin-ad-banner__wheel-wrap">
                <div className="spin-ad-banner__wheel-pointer" />
                <div className="spin-ad-banner__wheel" />
              </div>
            </div>

            <div className="spin-ad-banner__center">
              <p className="spin-ad-banner__label">🎮 Movie Picker Game</p>
              <p className="spin-ad-banner__headline">
                ★ SPIN TO PICK TONIGHT&apos;S MOVIE!!! ★
              </p>
              <p className="spin-ad-banner__sub">
                SWIPE TO KEEP OR SKIP · THEN SPIN FOR YOUR FATE!!!
              </p>
            </div>

            <div className="spin-ad-banner__right">
              <span className="spin-ad-banner__cta">&gt;&gt; PLAY NOW &lt;&lt;</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SpinAdBanner;
