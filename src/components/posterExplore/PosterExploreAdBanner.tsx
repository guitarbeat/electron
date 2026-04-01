import type { FC } from 'react';
import './PosterExploreAdBanner.css';

interface PosterExploreAdBannerProps {
  onOpen: () => void;
}

const PosterExploreAdBanner: FC<PosterExploreAdBannerProps> = ({ onOpen }) => {
  const marqueeText =
    '🎬 EXPLORE THE POSTER GALLERY!!! 🎬 ✨ ALL YOUR MOVIES IN 3D!!! ✨ 🌟 SCROLL THROUGH THE COLLECTION!!! 🌟 🎬 EXPLORE THE POSTER GALLERY!!! 🎬 ✨ ALL YOUR MOVIES IN 3D!!! ✨ 🌟 SCROLL THROUGH THE COLLECTION!!! 🌟 ';

  return (
    <div
      className="poster-ad-banner"
      role="complementary"
      aria-label="Explore the movie poster gallery"
    >
      <div className="poster-ad-banner__rainbow-border">
        <button
          type="button"
          className="poster-ad-banner__inner"
          onClick={onOpen}
          aria-label="Open the 3D movie poster gallery"
        >
          <div
            className="poster-ad-banner__marquee-wrap"
            aria-hidden="true"
          >
            <span className="poster-ad-banner__marquee">{marqueeText}</span>
          </div>

          <div className="poster-ad-banner__body">
            <div
              className="poster-ad-banner__icon-wrap"
              aria-hidden="true"
            >
              <span className="poster-ad-banner__ring">◉</span>
              <span className="poster-ad-banner__icon">🎬</span>
            </div>

            <div className="poster-ad-banner__center">
              <p className="poster-ad-banner__label">🌟 Poster Explorer</p>
              <p className="poster-ad-banner__headline">
                ★ BROWSE THE FULL COLLECTION IN 3D!!! ★
              </p>
              <p className="poster-ad-banner__sub">
                SCROLL THROUGH ALL YOUR MOVIES · STUNNING GALLERY VIEW!!!
              </p>
            </div>

            <div className="poster-ad-banner__right">
              <span className="poster-ad-banner__cta">
                &gt;&gt; EXPLORE &lt;&lt;
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default PosterExploreAdBanner;
