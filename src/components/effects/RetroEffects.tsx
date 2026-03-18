import React, { useEffect, useState, useRef } from 'react';
import { useMediaQuery, mediaBreakpoints } from '@/hooks/useMediaQuery';

interface RetroEffectsProps {
  crtEnabled: boolean;
  cursorTrailEnabled: boolean;
}

// CRT Overlay
const CrtOverlay = () => (
  <div className="crt-overlay" aria-hidden="true">
    <div className="crt-scanlines" />
    <div className="crt-flicker" />
    <div className="crt-vignette" />
  </div>
);

const RetroEffects: React.FC<RetroEffectsProps> = ({ crtEnabled, cursorTrailEnabled }) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const [stars, setStars] = useState<{ id: number; x: number; y: number; opacity: number; scale: number }[]>([]);
  const nextIdRef = useRef(0);

  // Cursor Trail logic
  useEffect(() => {
    if (!cursorTrailEnabled || isMobile) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const newStar = {
        id: nextIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        opacity: 1,
        scale: 0.5 + Math.random(),
      };

      setStars((prev) => [...prev.slice(-15), newStar]);

      setTimeout(() => {
        setStars((prev) => prev.filter((s) => s.id !== newStar.id));
      }, 800);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorTrailEnabled, isMobile]);

  return (
    <>
      {crtEnabled && <CrtOverlay />}
      {cursorTrailEnabled && !isMobile && (
        <div className="cursor-trail-container" aria-hidden="true">
          {stars.filter(() => cursorTrailEnabled && !isMobile).map((star) => (
            <div
              key={star.id}
              className="cursor-trail-star"
              style={{
                left: star.x,
                top: star.y,
                transform: `translate(-50%, -50%) scale(${star.scale})`,
              }}
            >
              ✦
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default RetroEffects;
