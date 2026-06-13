import React, { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { colors } from '@/theme/tokens';

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
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined;
    }

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
    return undefined;
  }, [isActive, duration, particleCount, onComplete, prefersReducedMotion]);

  if (prefersReducedMotion || !isVisible || particles.length === 0) return null;

  return (
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
  );
};

export default Confetti;
