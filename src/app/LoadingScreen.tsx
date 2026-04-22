import React from 'react';
import FishTank from '@/components/effects/FishTank';

/**
 * Full-screen loading state shown while the session is bootstrapping.
 * Repurposes the FishTank effect (previously a decorative overlay) so the
 * idle moments before the app is ready feel intentional instead of empty.
 */
const LoadingScreen: React.FC<{ label?: string }> = ({
  label = 'Warming up the tank…',
}) => (
  <div
    role="status"
    aria-live="polite"
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
    }}
  >
    <div style={{ width: 'min(560px, 90vw)' }}>
      <FishTank />
    </div>
    <p
      style={{
        fontFamily: 'Papyrus, serif',
        fontSize: '0.95rem',
        letterSpacing: '0.08em',
        color: 'rgba(255, 255, 255, 0.7)',
        margin: 0,
      }}
    >
      {label}
    </p>
  </div>
);

export default LoadingScreen;
