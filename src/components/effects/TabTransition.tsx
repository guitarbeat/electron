import React, { useEffect, useState } from 'react';
import { colors, zIndex, typography } from '@/design-system';

interface TabTransitionProps {
  activeTab: string;
}

const TabTransition: React.FC<TabTransitionProps> = ({ activeTab }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevTab, setPrevTab] = useState(activeTab);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (activeTab !== prevTab) {
      setIsTransitioning(true);
      setProgress(0);
      
      const duration = 1200;
      const interval = 20;
      const steps = duration / interval;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        setProgress(Math.min((currentStep / steps) * 100, 100));
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setTimeout(() => {
            setIsTransitioning(false);
            setPrevTab(activeTab);
          }, 300);
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [activeTab, prevTab]);

  if (!isTransitioning) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.98)',
        zIndex: zIndex.modal + 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'all',
        backdropFilter: 'blur(12px)',
        animation: 'fade-in 0.3s ease-out forwards',
      }}
    >
      {/* Scanlines Effect */}
      <div className="crt-scanlines" style={{ pointerEvents: 'none' }} />
      
      <div
        style={{
          textAlign: 'center',
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          animation: 'scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        <h2
          style={{
            fontFamily: typography.fontFamily.mono.join(', '),
            color: colors.accent,
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            textShadow: '0 0 10px rgba(255, 127, 198, 0.5)',
          }}
        >
          <span className="terminal-cursor">Syncing Mainframe...</span>
        </h2>
        
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: colors.accent,
              boxShadow: `0 0 10px ${colors.accent}`,
              transition: 'width 0.1s linear',
            }}
          />
        </div>
        
        <div
          style={{
            marginTop: '1rem',
            fontFamily: typography.fontFamily.mono.join(', '),
            color: colors.textSecondary,
            fontSize: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            opacity: 0.8,
          }}
        >
          <span>{progress.toFixed(0)}%</span>
          <span>EST. TIME: {((100 - progress) * 0.012).toFixed(2)}s</span>
        </div>

        <div
          style={{
            marginTop: '2rem',
            textAlign: 'left',
            fontFamily: typography.fontFamily.mono.join(', '),
            fontSize: '0.65rem',
            color: colors.secondary,
            opacity: 0.6,
            lineHeight: 1.5,
          }}
        >
          <div>{'>'} ACCESSING SECTOR_{activeTab.toUpperCase()}</div>
          <div>{'>'} INITIALIZING RETRO INTERFACE...</div>
          <div>{'>'} DECRYPTING CLOUD BUFFER...</div>
          {progress > 50 && <div>{'>'} CACHING LOCAL ASSETS...</div>}
          {progress > 85 && <div>{'>'} OPTIMIZING CRT OVERLAY...</div>}
        </div>
      </div>
    </div>
  );
};

export default TabTransition;
