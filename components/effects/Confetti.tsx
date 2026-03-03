import React, { useEffect, useState } from 'react';
import { colors } from '../../design-system/tokens';

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
  isRounded: boolean;
}

const CONFETTI_COLORS = [
  colors.accent, // Pink
  colors.secondary, // Blue
  colors.tertiary, // Purple
  colors.yellow, // Yellow
  colors.success, // Green
  '#fff', // White
];

/**
 * CSS-only confetti burst animation for celebrations.
 */
const Confetti: React.FC<ConfettiProps> = ({
  isActive,
  duration = 2000,
  particleCount = 50,
  onComplete,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Generate particles
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // Random horizontal position (%)
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.5, // Stagger start
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        isRounded: Math.random() > 0.5,
      }));

      const startTimer = setTimeout(() => {
        setParticles(newParticles);
        setIsVisible(true);
      }, 0);

      // Cleanup after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(timer);
      };
    }
  }, [isActive, duration, particleCount, onComplete]);

  if (!isVisible || particles.length === 0) return null;

  return (
    <div>
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes confetti-sway {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(15px); }
          75% { transform: translateX(-15px); }
        }
        
        .confetti-particle {
          position: fixed;
          top: 0;
          width: 10px;
          height: 10px;
          pointer-events: none;
          z-index: 9999;
        }
        
        .confetti-inner {
          width: 100%;
          height: 100%;
          animation: confetti-fall 2s ease-in forwards, confetti-sway 0.5s ease-in-out infinite;
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="confetti-particle"
            style={{
              left: `${particle.x}%`,
              animationDelay: `${particle.delay}s`,
            }}
          >
            <div
              className="confetti-inner"
              style={{
                backgroundColor: particle.color,
                borderRadius: particle.isRounded ? '50%' : '2px',
                transform: `scale(${particle.scale}) rotate(${particle.rotation}deg)`,
                animationDelay: `${particle.delay}s`,
                boxShadow: `0 0 6px ${particle.color}`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Confetti;
