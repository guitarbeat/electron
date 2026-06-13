import React from 'react';
import FishTank from '@/components/effects/FishTank';

/**
 * Full-screen loading state shown while the session is bootstrapping.
 * Repurposes the FishTank effect (previously a decorative overlay) so the
 * idle moments before the app is ready feel intentional instead of empty.
 */
const LoadingScreen: React.FC = () => (
  <>
    <style>{`
      .loading-screen__tank .fish-tank-wrapper {
        position: relative;
        inset: auto;
      }

      .loading-screen__tank .fish-tank-wrapper .container {
        margin: 0 auto;
      }

      @media (max-width: 768px) {
        .loading-screen__tank .fish-tank-wrapper {
          transform: scale(0.7);
          transform-origin: center center;
        }
      }

      @media (max-width: 480px) {
        .loading-screen__tank .fish-tank-wrapper {
          transform: scale(0.5);
          transform-origin: center center;
        }
      }
    `}</style>
    <div className="session-loading-screen" role="status" aria-live="polite" aria-label="Loading">
      <div className="session-loading-screen__panel">
        <p className="session-loading-screen__eyebrow">Collab</p>
        <h1 className="session-loading-screen__title">Loading your watchlist</h1>
        <p className="session-loading-screen__subtitle">
          Preparing the app and restoring your session.
        </p>
        <div className="session-loading-screen__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="loading-screen__tank" style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: 'min(560px, 90vw)' }}>
        <FishTank />
      </div>
    </div>
  </>
);

export default LoadingScreen;
