import React, { useEffect, useState, useRef } from "react";
import { useMediaQuery, mediaBreakpoints } from "@/hooks/useMediaQuery";

interface RetroEffectsProps {
  cursorTrailEnabled: boolean;
}

const RetroEffects: React.FC<RetroEffectsProps> = ({ cursorTrailEnabled }) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const [trailParticles, setTrailParticles] = useState<
    { id: number; x: number; y: number; opacity: number; scale: number }[]
  >([]);
  const nextIdRef = useRef(0);

  // Cursor Trail logic
  useEffect(() => {
    if (!cursorTrailEnabled || isMobile) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const newParticle = {
        id: nextIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        opacity: 1,
        scale: 0.5 + Math.random(),
      };

      setTrailParticles((prev) => [...prev.slice(-15), newParticle]);

      setTimeout(() => {
        setTrailParticles((prev) =>
          prev.filter((particle) => particle.id !== newParticle.id),
        );
      }, 800);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cursorTrailEnabled, isMobile]);

  return (
    <>
      {cursorTrailEnabled && !isMobile && (
        <div className="cursor-trail-container" aria-hidden="true">
          {trailParticles.map((particle) => (
            <div
              key={particle.id}
              className="cursor-trail-particle"
              style={{
                left: particle.x,
                top: particle.y,
                transform: `translate(-50%, -50%) scale(${particle.scale})`,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default RetroEffects;
