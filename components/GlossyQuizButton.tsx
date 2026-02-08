import React, { useState } from 'react';

interface GlossyQuizButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const GlossyQuizButton: React.FC<GlossyQuizButtonProps> = ({ onClick, children }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      aria-label="Take the personality quiz"
      className="glossy-quiz-button"
      style={{
        position: 'relative',
        fontFamily: "'Papyrus', fantasy",
        fontSize: 'clamp(1rem, 4vw, 1.25rem)',
        fontWeight: 600,
        letterSpacing: '0.05em',
        color: '#fff',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        padding: 'clamp(14px, 3vw, 18px) clamp(28px, 6vw, 48px)',
        border: '4px outset rgba(255,255,255,0.5)',
        borderRadius: '16px',
        cursor: 'pointer',
        // Multi-layer plastic gradient
        background: `
          linear-gradient(180deg, 
            rgba(255,255,255,0.3) 0%, 
            rgba(255,255,255,0.1) 40%,
            transparent 60%,
            rgba(0,0,0,0.2) 100%),
          linear-gradient(135deg, #ff69b4 0%, #ff8bb3 50%, #ff69b4 100%)
        `,
        // 3D box shadow with glow
        boxShadow: isPressed
          ? `
            0 2px 0 rgba(180, 50, 120, 1),
            0 4px 10px rgba(0,0,0,0.5),
            0 0 20px rgba(255, 105, 180, 0.4),
            inset 0 2px 0 rgba(255,255,255,0.4)
          `
          : `
            0 6px 0 rgba(180, 50, 120, 1),
            0 8px 20px rgba(0,0,0,0.5),
            0 0 ${isHovered ? '40px' : '30px'} rgba(255, 105, 180, ${isHovered ? '0.7' : '0.5'}),
            inset 0 2px 0 rgba(255,255,255,0.4)
          `,
        transform: isPressed
          ? 'translateY(4px) scale(0.98)'
          : isHovered
            ? 'translateY(-2px) scale(1.02)'
            : 'translateY(0) scale(1)',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer effect overlay */}
      <div
        className="shimmer-plastic"
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </button>
  );
};

export default GlossyQuizButton;
