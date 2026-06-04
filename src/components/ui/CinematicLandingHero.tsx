import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
/* ─── Scroller (fixed full-screen custom scroll container) ─── */
.cl-scroller {
  position: fixed;
  inset: 0;
  z-index: 9100;
  overflow-y: auto;
  overflow-x: hidden;
  background: #08050303;
  scrollbar-width: none;
}
.cl-scroller::-webkit-scrollbar { display: none; }

.cl-scroll-spacer {
  height: 600vh;
  pointer-events: none;
  flex-shrink: 0;
}

/* ─── Sticky hero stage ─── */
.cl-hero {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1500px;
  background: #0d0b09;
  font-family: 'Papyrus', serif;
}

/* ─── Film grain overlay ─── */
.cl-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 60;
  opacity: 0.045;
  mix-blend-mode: overlay;
  background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%25" height="100%25" filter="url(%23n)"/></svg>');
}

/* ─── Grid background ─── */
.cl-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.45;
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, rgba(247,239,223,0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(247,239,223,0.06) 1px, transparent 1px);
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 68%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 68%);
}

/* ─── Ambient aurora glow ─── */
.cl-aurora {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 80% 60% at 50% 50%,
      rgba(200,141,89,0.08) 0%,
      rgba(255,125,168,0.05) 40%,
      transparent 70%);
  animation: cl-aurora-pulse 12s ease-in-out infinite alternate;
}
@keyframes cl-aurora-pulse {
  0%   { opacity: 0.6; transform: scale(1); }
  100% { opacity: 1;   transform: scale(1.08); }
}

/* ─── Hero tagline text ─── */
.cl-hero-text {
  position: absolute;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  padding: 0 1.5rem;
  will-change: transform, filter, opacity;
  pointer-events: none;
}

.cl-tagline-1 {
  font-family: 'Papyrus', serif;
  font-size: clamp(2.2rem, 7vw, 5.5rem);
  font-weight: bold;
  letter-spacing: 0.02em;
  margin: 0 0 0.3rem;
  color: var(--color-text-primary, #f7efdf);
  text-shadow:
    0 12px 36px rgba(247,239,223,0.22),
    0 4px 10px rgba(247,239,223,0.12),
    0 1px 2px rgba(247,239,223,0.06);
}

.cl-tagline-2 {
  font-family: 'Papyrus', serif;
  font-size: clamp(2.4rem, 8vw, 6.5rem);
  font-weight: 900;
  letter-spacing: -0.01em;
  margin: 0;
  background: linear-gradient(
    165deg,
    var(--color-accent, #c88d59) 0%,
    var(--color-text-primary, #f7efdf) 45%,
    var(--color-accent, #c88d59) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transform: translateZ(0);
  filter:
    drop-shadow(0 10px 28px rgba(200,141,89,0.42))
    drop-shadow(0 2px 6px rgba(200,141,89,0.2));
}

/* ─── CTA overlay ─── */
.cl-cta {
  position: absolute;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  padding: 0 1.5rem;
  pointer-events: auto;
  will-change: transform, filter, opacity;
}

.cl-cta-heading {
  font-family: 'Papyrus', serif;
  font-size: clamp(2rem, 6vw, 5rem);
  font-weight: 900;
  letter-spacing: -0.01em;
  margin: 0 0 1rem;
  background: linear-gradient(165deg, var(--color-accent, #c88d59) 0%, var(--color-text-primary, #f7efdf) 60%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transform: translateZ(0);
  filter: drop-shadow(0 6px 18px rgba(200,141,89,0.3));
}

.cl-cta-desc {
  font-family: 'Papyrus', serif;
  color: var(--color-text-secondary, #e0d2b6);
  font-size: clamp(0.85rem, 2vw, 1.1rem);
  margin: 0 0 2.5rem;
  max-width: 480px;
  line-height: 1.75;
  font-weight: 400;
  opacity: 0.85;
}

.cl-cta-btn {
  font-family: 'Papyrus', serif;
  background: linear-gradient(180deg, #b87e45 0%, #7a4c24 100%);
  color: #fdf8f0;
  border: none;
  border-radius: 3rem;
  padding: 0.95rem 2.5rem;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08),
    0 2px 4px rgba(0,0,0,0.5),
    0 14px 28px -4px rgba(0,0,0,0.72),
    0 28px 50px -8px rgba(0,0,0,0.6),
    inset 0 1px 1px rgba(255,255,255,0.24),
    inset 0 -3px 7px rgba(0,0,0,0.65);
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.cl-cta-btn:hover {
  transform: translateY(-3px);
  background: linear-gradient(180deg, #c48e52 0%, #8a5c2e 100%);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.14),
    0 8px 18px -2px rgba(0,0,0,0.65),
    0 24px 48px -6px rgba(0,0,0,0.88),
    inset 0 1px 1px rgba(255,255,255,0.3),
    inset 0 -3px 7px rgba(0,0,0,0.65);
}
.cl-cta-btn:active {
  transform: translateY(1px);
  background: #7a4c24;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.05),
    inset 0 3px 8px rgba(0,0,0,0.8),
    inset 0 0 0 1px rgba(0,0,0,0.4);
}

/* ─── Card outer wrapper ─── */
.cl-card-outer {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* ─── Deep physical card ─── */
.cl-card {
  position: relative;
  width: 92vw;
  height: 92vh;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: auto;
  background: linear-gradient(145deg, #1c0f06 0%, #0a0503 100%);
  box-shadow:
    0 60px 140px -20px rgba(0,0,0,0.98),
    0 30px 60px -20px rgba(0,0,0,0.88),
    inset 0 1px 2px rgba(255,255,255,0.14),
    inset 0 -2px 6px rgba(0,0,0,0.9);
  border: 1px solid rgba(255,255,255,0.04);
  will-change: transform, width, height, border-radius;
}
@media (min-width: 768px) {
  .cl-card { width: 85vw; height: 85vh; border-radius: 36px; }
}

/* card sheen (mouse follow) */
.cl-sheen {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 50;
  background: radial-gradient(900px circle at var(--cl-mx, 50%) var(--cl-my, 50%), rgba(200,141,89,0.08) 0%, transparent 38%);
  mix-blend-mode: screen;
  transition: opacity 0.4s ease;
}

/* card inner grain */
.cl-card-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 49;
  opacity: 0.03;
  mix-blend-mode: overlay;
  background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%25" height="100%25" filter="url(%23n)"/></svg>');
}

/* ─── Card interior grid layout ─── */
.cl-card-grid {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  z-index: 10;
}
@media (min-width: 1024px) {
  .cl-card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
    gap: 2rem;
    padding: 0 3.5rem;
  }
}

/* ─── Card right: brand name ─── */
.cl-card-right {
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
  width: 100%;
  order: 1;
}
@media (min-width: 1024px) {
  .cl-card-right { justify-content: flex-end; order: 3; }
}

.cl-brand-name {
  font-family: 'Papyrus', serif;
  font-size: clamp(3rem, 9vw, 8rem);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: linear-gradient(170deg, #ffffff 0%, #e8d5b8 30%, #c8b89a 55%, #8a6a48 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transform: translateZ(0);
  filter:
    drop-shadow(0 18px 36px rgba(0,0,0,0.92))
    drop-shadow(0 6px 14px rgba(0,0,0,0.75))
    drop-shadow(0 2px 4px rgba(0,0,0,0.6));
  margin: 0;
  text-align: center;
}

/* ─── Card center: mockup ─── */
.cl-mockup-wrap {
  position: relative;
  width: 100%;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  order: 2;
  will-change: transform;
}
@media (min-width: 1024px) { .cl-mockup-wrap { height: 560px; order: 2; } }

.cl-mockup-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(0.72);
  transform-origin: center;
}
@media (min-width: 640px)  { .cl-mockup-inner { transform: scale(0.88); } }
@media (min-width: 1024px) { .cl-mockup-inner { transform: scale(1); } }

/* Movie-card-style frame */
.cl-mockup-frame {
  position: relative;
  width: 280px;
  height: 420px;
  border-radius: 1.75rem;
  background: #100804;
  box-shadow:
    inset 0 0 0 2px rgba(200,141,89,0.4),
    inset 0 0 0 8px rgba(0,0,0,0.8),
    inset 0 1px 2px rgba(255,255,255,0.04),
    0 52px 100px -15px rgba(0,0,0,0.98),
    0 22px 36px -8px rgba(0,0,0,0.75);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-style: preserve-3d;
}

.cl-poster {
  width: 100%;
  height: 58%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(155deg, #2c1c0a 0%, #180e04 55%, #0c0604 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cl-poster-emoji {
  font-size: 4rem;
  opacity: 0.55;
  filter: drop-shadow(0 4px 14px rgba(200,141,89,0.6));
  position: relative;
  z-index: 2;
}

.cl-poster-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 60%, rgba(200,141,89,0.18) 0%, transparent 70%);
}

.cl-poster-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65%;
  background: linear-gradient(to top, #100804 0%, transparent 100%);
}

/* accent stripe */
.cl-poster-stripe {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent, #c88d59), rgba(255,125,168,0.7), transparent);
}

.cl-movie-info {
  padding: 1rem 1.1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.cl-movie-title {
  font-family: 'Papyrus', serif;
  color: #f5e8cc;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin: 0;
  text-transform: uppercase;
}

.cl-movie-meta {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-wrap: wrap;
}

.cl-movie-tag {
  background: rgba(200,141,89,0.14);
  border: 1px solid rgba(200,141,89,0.28);
  color: #c88d59;
  font-family: 'Papyrus', serif;
  font-size: 0.58rem;
  font-weight: 700;
  padding: 0.18rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.cl-widget {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.01) 100%);
  box-shadow:
    0 10px 22px rgba(0,0,0,0.42),
    inset 0 1px 1px rgba(255,255,255,0.07),
    inset 0 -1px 2px rgba(0,0,0,0.65);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 0.75rem;
  padding: 0.55rem 0.7rem;
}

.cl-widget-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.06);
}

.cl-widget-lines { display: flex; flex-direction: column; gap: 0.28rem; flex: 1; }
.cl-wline {
  height: 0.42rem;
  border-radius: 3px;
  background: rgba(200,141,89,0.28);
}
.cl-wline--short { width: 45%; background: rgba(255,255,255,0.1); }
.cl-wline--wide  { width: 72%; }

/* screen glare */
.cl-screen-glare {
  position: absolute;
  inset: 0;
  background: linear-gradient(112deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 22%, rgba(255,255,255,0) 48%);
  pointer-events: none;
  z-index: 40;
  border-radius: inherit;
}

/* ─── Floating glass badges ─── */
.cl-badge {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 100%);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.1),
    0 28px 56px -12px rgba(0,0,0,0.9),
    inset 0 1px 1px rgba(255,255,255,0.22),
    inset 0 -1px 2px rgba(0,0,0,0.6);
  border-radius: 1rem;
  padding: 0.75rem 1.1rem;
  z-index: 30;
  white-space: nowrap;
}

.cl-badge--tl { top: 2rem;  left: -0.75rem; }
.cl-badge--br { bottom: 3.5rem; right: -0.75rem; }
@media (min-width: 1024px) {
  .cl-badge--tl { left: -4.5rem; }
  .cl-badge--br { right: -4.5rem; }
}

.cl-badge-icon {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  background: rgba(200,141,89,0.12);
  border: 1px solid rgba(200,141,89,0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.cl-badge-body { display: flex; flex-direction: column; gap: 0.1rem; }
.cl-badge-title {
  font-family: 'Papyrus', serif;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  margin: 0;
}
.cl-badge-sub {
  font-family: 'Papyrus', serif;
  color: rgba(200,141,89,0.6);
  font-size: 0.62rem;
  font-weight: 500;
  margin: 0;
}

/* ─── Card left: description ─── */
.cl-card-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  z-index: 20;
  width: 100%;
  order: 3;
  padding: 0 0.75rem;
}
@media (min-width: 1024px) {
  .cl-card-left { text-align: left; order: 1; padding: 0; }
}

.cl-card-heading {
  font-family: 'Papyrus', serif;
  color: #fff;
  font-size: clamp(1.25rem, 2.8vw, 2.1rem);
  font-weight: 700;
  letter-spacing: 0.01em;
  margin: 0 0 0.65rem;
  text-shadow: 0 4px 12px rgba(0,0,0,0.7);
}

.cl-card-desc {
  font-family: 'Papyrus', serif;
  color: rgba(200,141,89,0.68);
  font-size: clamp(0.78rem, 1.4vw, 0.95rem);
  line-height: 1.75;
  font-weight: 400;
  margin: 0;
  display: none;
}
@media (min-width: 768px) { .cl-card-desc { display: block; } }

/* ─── Skip / enter button (always visible) ─── */
.cl-skip {
  position: fixed;
  bottom: 1.75rem;
  right: 1.75rem;
  z-index: 9200;
  background: rgba(200,141,89,0.08);
  border: 1px solid rgba(200,141,89,0.22);
  color: rgba(200,141,89,0.65);
  font-family: 'Papyrus', serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.55rem 1.2rem;
  border-radius: 2rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}
.cl-skip:hover {
  background: rgba(200,141,89,0.15);
  color: rgba(200,141,89,0.9);
  border-color: rgba(200,141,89,0.38);
  transform: translateY(-2px);
}

/* ─── Scroll indicator ─── */
.cl-scroll-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  pointer-events: none;
}
.cl-scroll-hint-text {
  font-family: 'Papyrus', serif;
  font-size: 0.62rem;
  color: rgba(200,141,89,0.45);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.cl-scroll-hint-arrow {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, rgba(200,141,89,0.4), transparent);
  animation: cl-arrow-pulse 2s ease-in-out infinite;
}
@keyframes cl-arrow-pulse {
  0%, 100% { opacity: 0.4; transform: scaleY(1); }
  50%       { opacity: 0.9; transform: scaleY(1.2); }
}

/* ─── Ghost watermark brand text (behind CTA) ─── */
.cl-cta-ghost {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Papyrus', serif;
  font-size: clamp(14vw, 22vw, 28vw);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 0.8;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  z-index: 0;
  color: transparent;
  -webkit-text-stroke: 1px rgba(200,141,89,0.07);
  background: linear-gradient(180deg, rgba(200,141,89,0.11) 0%, transparent 65%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* ─── Heartbeat animation ─── */
@keyframes cl-heartbeat {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 4px rgba(255,90,120,0.45));
  }
  15%, 45% {
    transform: scale(1.28);
    filter: drop-shadow(0 0 10px rgba(255,90,120,0.88));
  }
  30% { transform: scale(1.08); }
}
.cl-badge-heartbeat {
  display: inline-block;
  animation: cl-heartbeat 2.2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
  font-style: normal;
}

/* ─── Reduced motion ─── */
@media (prefers-reduced-motion: reduce) {
  .cl-aurora { animation: none; }
  .cl-scroll-hint-arrow { animation: none; }
  .cl-badge-heartbeat { animation: none; }
}
`;

interface Props {
  onEnter: () => void;
}

export function CinematicLandingHero({ onEnter }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const mockupInnerRef = useRef<HTMLDivElement>(null);
  const ctaBtnRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number>(0);
  const [hintVisible, setHintVisible] = useState(true);

  // ── Mouse parallax on card + sheen ──────────────────────────────────────
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        cardRef.current.style.setProperty(
          "--cl-mx",
          `${e.clientX - rect.left}px`,
        );
        cardRef.current.style.setProperty(
          "--cl-my",
          `${e.clientY - rect.top}px`,
        );

        if (mockupInnerRef.current) {
          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(mockupInnerRef.current, {
            rotationY: xVal * 10,
            rotationX: -yVal * 10,
            ease: "power3.out",
            duration: 1.2,
          });
        }
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Magnetic CTA button ──────────────────────────────────────────────────
  useEffect(() => {
    const btn = ctaBtnRef.current;
    if (!btn) return;
    const ctx = gsap.context(() => {
      const onMove = (e: MouseEvent) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, {
          x: x * 0.38,
          y: y * 0.38,
          rotationY: x * 0.12,
          rotationX: -y * 0.12,
          scale: 1.06,
          ease: "power2.out",
          duration: 0.4,
        });
      };
      const onLeave = () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          ease: "elastic.out(1, 0.35)",
          duration: 1.1,
        });
      };
      btn.addEventListener("mousemove", onMove);
      btn.addEventListener("mouseleave", onLeave);
      return () => {
        btn.removeEventListener("mousemove", onMove);
        btn.removeEventListener("mouseleave", onLeave);
      };
    }, btn);
    return () => ctx.revert();
  }, []);

  // ── Hide scroll hint once user scrolls ──────────────────────────────────
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop > 40) setHintVisible(false);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // ── GSAP scroll-driven cinematic timeline ────────────────────────────────
  useEffect(() => {
    const scroller = scrollerRef.current;
    const hero = heroRef.current;
    if (!scroller || !hero) return;

    // Register custom scroll proxy (GSAP needs this to read a non-window scroller)
    ScrollTrigger.scrollerProxy(scroller, {
      scrollTop(v?: number) {
        if (v !== undefined) scroller.scrollTop = v;
        return scroller.scrollTop;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      // ── Initial states ─────────────────────────────────────────────────
      gsap.set(".cl-tagline-1", {
        autoAlpha: 0,
        y: 70,
        scale: 0.88,
        filter: "blur(22px)",
        rotationX: -22,
      });
      gsap.set(".cl-tagline-2", {
        autoAlpha: 1,
        clipPath: "inset(0 100% 0 0)",
      });
      gsap.set(".cl-card", { y: window.innerHeight + 260, autoAlpha: 1 });
      gsap.set(
        [".cl-card-left", ".cl-card-right", ".cl-mockup-wrap", ".cl-badge"],
        { autoAlpha: 0 },
      );
      gsap.set(".cl-widget", { autoAlpha: 0 });
      gsap.set(".cl-cta", { autoAlpha: 0, scale: 0.82, filter: "blur(32px)" });

      // ── Intro (time-based, plays on mount) ─────────────────────────────
      gsap
        .timeline({ delay: 0.4 })
        .to(".cl-tagline-1", {
          duration: 1.9,
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          rotationX: 0,
          ease: "expo.out",
        })
        .to(
          ".cl-tagline-2",
          {
            duration: 1.5,
            clipPath: "inset(0 0% 0 0)",
            ease: "power4.inOut",
          },
          "-=1.1",
        );

      // ── Scroll timeline ────────────────────────────────────────────────
      // Hero is `position:sticky` so CSS pins it; we only need scrub-driven anim
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          scroller,
          start: "top top",
          end: "+=5200",
          scrub: 1.2,
          anticipatePin: 1,
        },
      });

      tl
        // Phase 1 (0–2): hero text blurs away + card rises
        .to(
          [".cl-hero-text", ".cl-grid", ".cl-aurora"],
          {
            scale: 1.14,
            filter: "blur(22px)",
            opacity: 0.15,
            ease: "power2.inOut",
            duration: 2,
          },
          0,
        )
        .to(".cl-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)

        // Phase 2 (2–3.5): card expands full-bleed
        .to(".cl-card", {
          width: "100%",
          height: "100%",
          borderRadius: "0px",
          ease: "power3.inOut",
          duration: 1.5,
        })

        // Phase 3 (3.5–6): mockup flies in
        .fromTo(
          ".cl-mockup-wrap",
          {
            y: 280,
            z: -480,
            rotationX: 48,
            rotationY: -28,
            autoAlpha: 0,
            scale: 0.62,
          },
          {
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            autoAlpha: 1,
            scale: 1,
            ease: "expo.out",
            duration: 2.5,
          },
          "-=0.8",
        )
        .fromTo(
          ".cl-widget",
          { y: 38, autoAlpha: 0, scale: 0.94 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            stagger: 0.14,
            ease: "back.out(1.2)",
            duration: 1.5,
          },
          "-=1.6",
        )
        .fromTo(
          ".cl-badge",
          { y: 90, autoAlpha: 0, scale: 0.72, rotationZ: -10 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            rotationZ: 0,
            ease: "back.out(1.5)",
            duration: 1.5,
            stagger: 0.18,
          },
          "-=2.0",
        )
        .fromTo(
          ".cl-card-left",
          { x: -55, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 },
          "-=1.6",
        )
        .fromTo(
          ".cl-card-right",
          { x: 55, autoAlpha: 0, scale: 0.82 },
          { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 },
          "<",
        )

        // Phase 4 (hold)
        .to({}, { duration: 2.5 })

        // Phase 5: fade hero text, bring in CTA
        .set(".cl-hero-text", { autoAlpha: 0 })
        .set(".cl-cta", { autoAlpha: 1 })
        .to({}, { duration: 1.2 })

        // Phase 6: card contents exit, pullback
        .to(
          [".cl-mockup-wrap", ".cl-badge", ".cl-card-left", ".cl-card-right"],
          {
            scale: 0.88,
            y: -44,
            z: -180,
            autoAlpha: 0,
            ease: "power3.in",
            duration: 1.2,
            stagger: 0.04,
          },
        )
        .to(
          ".cl-card",
          {
            width: isMobile ? "92vw" : "85vw",
            height: isMobile ? "92vh" : "85vh",
            borderRadius: isMobile ? "28px" : "36px",
            ease: "expo.inOut",
            duration: 1.8,
          },
          "pullback",
        )
        .to(
          ".cl-cta",
          {
            scale: 1,
            filter: "blur(0px)",
            ease: "expo.inOut",
            duration: 1.8,
          },
          "pullback",
        )

        // Phase 7: card shoots up → reveal
        .to(".cl-card", {
          y: -(window.innerHeight + 350),
          ease: "power3.in",
          duration: 1.5,
          onComplete: onEnter,
        });
    }, hero);

    ScrollTrigger.addEventListener("refresh", () => ScrollTrigger.update());
    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [onEnter]);

  return (
    <div ref={scrollerRef} className="cl-scroller">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Skip button — always accessible */}
      <button className="cl-skip" onClick={onEnter} aria-label="Skip intro">
        Skip intro ›
      </button>

      {/* ── Sticky hero stage ── */}
      <div ref={heroRef} className="cl-hero">
        <div className="cl-grain" aria-hidden="true" />
        <div className="cl-aurora" aria-hidden="true" />
        <div className="cl-grid" aria-hidden="true" />

        {/* Taglines */}
        <div className="cl-hero-text" aria-live="polite">
          <h1 className="cl-tagline-1">Plan the night,</h1>
          <h1 className="cl-tagline-2">together.</h1>
        </div>

        {/* CTA */}
        <div className="cl-cta">
          <div className="cl-cta-ghost" aria-hidden="true">
            ELECTRON
          </div>
          <h2 className="cl-cta-heading">Your movie awaits.</h2>
          <p className="cl-cta-desc">
            Discover films, build a shared watchlist, and find the perfect place
            — every date night, crafted just for the two of you.
          </p>
          <button ref={ctaBtnRef} className="cl-cta-btn" onClick={onEnter}>
            Start planning
          </button>
        </div>

        {/* Deep card */}
        <div className="cl-card-outer">
          <div ref={cardRef} className="cl-card">
            <div className="cl-sheen" aria-hidden="true" />
            <div className="cl-card-grain" aria-hidden="true" />

            <div className="cl-card-grid">
              {/* Right — brand name */}
              <div className="cl-card-right">
                <h2 className="cl-brand-name">Electron</h2>
              </div>

              {/* Center — movie mockup */}
              <div className="cl-mockup-wrap" style={{ perspective: "1000px" }}>
                <div
                  ref={mockupInnerRef}
                  className="cl-mockup-inner"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="cl-mockup-frame">
                    <div className="cl-screen-glare" aria-hidden="true" />
                    <div className="cl-poster-stripe" aria-hidden="true" />

                    {/* Poster */}
                    <div className="cl-poster">
                      <div className="cl-poster-glow" aria-hidden="true" />
                      <span className="cl-poster-emoji" aria-hidden="true">
                        🎬
                      </span>
                      <div className="cl-poster-gradient" aria-hidden="true" />
                    </div>

                    {/* Movie info */}
                    <div className="cl-movie-info">
                      <p className="cl-movie-title">Now Watching</p>
                      <div className="cl-movie-meta">
                        <span className="cl-movie-tag">Drama</span>
                        <span className="cl-movie-tag">★ 8.4</span>
                      </div>

                      <div className="cl-widget">
                        <div
                          className="cl-widget-icon"
                          style={{
                            background: "rgba(200,141,89,0.14)",
                            border: "1px solid rgba(200,141,89,0.25)",
                          }}
                        >
                          ⭐
                        </div>
                        <div className="cl-widget-lines">
                          <div className="cl-wline cl-wline--wide" />
                          <div className="cl-wline cl-wline--short" />
                        </div>
                      </div>

                      <div className="cl-widget">
                        <div
                          className="cl-widget-icon"
                          style={{
                            background: "rgba(100,210,140,0.12)",
                            border: "1px solid rgba(100,210,140,0.22)",
                          }}
                        >
                          ✓
                        </div>
                        <div className="cl-widget-lines">
                          <div
                            className="cl-wline cl-wline--wide"
                            style={{ background: "rgba(100,210,140,0.28)" }}
                          />
                          <div className="cl-wline cl-wline--short" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="cl-badge cl-badge--tl">
                  <div className="cl-badge-icon">🎬</div>
                  <div className="cl-badge-body">
                    <p className="cl-badge-title">Added to Queue</p>
                    <p className="cl-badge-sub">Electra&apos;s pick ✨</p>
                  </div>
                </div>

                <div className="cl-badge cl-badge--br">
                  <div className="cl-badge-icon">
                    <span className="cl-badge-heartbeat">❤</span>
                  </div>
                  <div className="cl-badge-body">
                    <p className="cl-badge-title">Perfect Match</p>
                    <p className="cl-badge-sub">Both love it</p>
                  </div>
                </div>
              </div>

              {/* Left — description */}
              <div className="cl-card-left">
                <h3 className="cl-card-heading">Movie nights, reinvented.</h3>
                <p className="cl-card-desc">
                  A shared watchlist built for two. Discover together, decide
                  together, and remember every film you&apos;ve seen.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        {hintVisible && (
          <div className="cl-scroll-hint" aria-hidden="true">
            <span className="cl-scroll-hint-text">scroll</span>
            <div className="cl-scroll-hint-arrow" />
          </div>
        )}
      </div>

      {/* Spacer — provides scroll distance for the timeline */}
      <div className="cl-scroll-spacer" aria-hidden="true" />
    </div>
  );
}
