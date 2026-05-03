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
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        background: 'var(--color-background, #0f0a14)',
        zIndex: 5000,
        padding: '1rem',
        color: 'var(--color-text, #f7f2ff)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Loading Electron…</div>
        <div style={{ marginTop: '0.5rem', opacity: 0.8 }}>If this stays here, the session request is hanging.</div>
      </div>
      <div
        className="loading-screen__tank"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          maxWidth: 'min(560px, 90vw)',
        }}
      >
        <FishTank />
      </div>
    </div>
  </>
);

export default LoadingScreen;
