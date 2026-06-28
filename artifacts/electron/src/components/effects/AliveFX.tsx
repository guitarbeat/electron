import { useEffect, useRef } from "react";

/**
 * AliveFX — ambient effects that make the page feel alive:
 *  • Mouse-reactive radial glow that smoothly follows the cursor
 *  • Drifting holographic orbs in the background
 */
const AliveFX: React.FC = () => {
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: -400, y: -400 });
  const currentRef = useRef({ x: -400, y: -400 });

  // Smooth mouse-tracking glow
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const tick = () => {
      const t = targetRef.current;
      const c = currentRef.current;
      // Lerp toward target
      c.x += (t.x - c.x) * 0.08;
      c.y += (t.y - c.y) * 0.08;
      if (glowRef.current) {
        glowRef.current.style.transform =
          `translate(${c.x - 300}px, ${c.y - 300}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Mouse glow */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,45,120,0.12) 0%, rgba(191,90,242,0.08) 35%, rgba(0,212,255,0.05) 60%, transparent 75%)",
          pointerEvents: "none",
          zIndex: 2,
          willChange: "transform",
          mixBlendMode: "screen",
        }}
      />

      {/* Drifting orbs */}
      <div className="alive-orbs" aria-hidden="true">
        <div className="alive-orb alive-orb--a" />
        <div className="alive-orb alive-orb--b" />
        <div className="alive-orb alive-orb--c" />
        <div className="alive-orb alive-orb--d" />
      </div>
    </>
  );
};

export default AliveFX;
