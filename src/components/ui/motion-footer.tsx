"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/components/ui/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cf-wrapper {
  /* Map app CSS variables to shadcn-style tokens used below */
  --background:      var(--color-background, #190f18);
  --foreground:      var(--color-text-primary, #f7efdf);
  --primary:         var(--color-accent, #ff7da8);
  --secondary:       var(--color-secondary, #ffd9a0);
  --muted-foreground: var(--color-text-secondary, #e0d2b6);
  --border:          rgba(205, 171, 118, 0.2);
  --destructive:     var(--color-error, #f87171);

  --pill-bg-1:            color-mix(in oklch, var(--foreground) 3%, transparent);
  --pill-bg-2:            color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow:          color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight:       color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-inset-shadow:    color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border:          color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-1-hover:      color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-2-hover:      color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-border-hover:    color-mix(in oklch, var(--foreground) 20%, transparent);
  --pill-shadow-hover:    color-mix(in oklch, var(--background) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground) 20%, transparent);

  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ── Keyframes ── */
@keyframes cf-breathe {
  0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}
@keyframes cf-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes cf-heartbeat {
  0%, 100% { transform: scale(1);   filter: drop-shadow(0 0 5px  color-mix(in oklch, var(--destructive) 50%, transparent)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px color-mix(in oklch, var(--destructive) 80%, transparent)); }
  30%      { transform: scale(1); }
}

/* ── Layout primitives ── */
.cf-curtain {
  position: relative;
  width: 100%;
}

.cf-footer {
  position: relative;
  display: flex;
  min-height: 100vh;
  width: 100%;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  background: var(--background);
  color: var(--foreground);
}

/* ── Aurora + Grid background ── */
.cf-aurora {
  position: absolute;
  left: 50%;
  top: 50%;
  height: 60vh;
  width: 80vw;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
  animation: cf-breathe 8s ease-in-out infinite alternate;
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in oklch, var(--primary) 15%, transparent) 0%,
    color-mix(in oklch, var(--secondary) 15%, transparent) 40%,
    transparent 70%
  );
}

.cf-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right,  color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

/* ── Giant background text ── */
.cf-bg-text {
  position: absolute;
  bottom: -5vh;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  z-index: 0;
  pointer-events: none;
  user-select: none;
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 5%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 10%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* ── Marquee band ── */
.cf-marquee-band {
  position: absolute;
  top: 3rem;
  left: 0;
  width: 100%;
  overflow: hidden;
  border-top: 1px solid color-mix(in oklch, var(--border) 50%, transparent);
  border-bottom: 1px solid color-mix(in oklch, var(--border) 50%, transparent);
  background: color-mix(in oklch, var(--background) 60%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 1rem 0;
  z-index: 10;
  transform: rotate(-2deg) scale(1.1);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}

.cf-marquee-track {
  display: flex;
  width: max-content;
  animation: cf-marquee 40s linear infinite;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

.cf-marquee-item {
  display: flex;
  align-items: center;
  gap: 3rem;
  padding: 0 1.5rem;
}

.cf-marquee-dot-primary { color: color-mix(in oklch, var(--primary) 60%, transparent); }
.cf-marquee-dot-secondary { color: color-mix(in oklch, var(--secondary) 60%, transparent); }

/* ── Main center content ── */
.cf-center {
  position: relative;
  z-index: 10;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 1.5rem;
  margin-top: 5rem;
  width: 100%;
  max-width: 64rem;
  margin-left: auto;
  margin-right: auto;
}

.cf-heading {
  font-size: clamp(2.5rem, 8vw, 6rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  margin-bottom: 3rem;
  text-align: center;
  background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 40%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--foreground) 15%, transparent));
}

/* ── Pill links ── */
.cf-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.cf-pill-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  width: 100%;
}

.cf-pill-row--secondary {
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.cf-glass-pill {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow:
    0 10px 30px -10px var(--pill-shadow),
    inset 0 1px 1px var(--pill-highlight),
    inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 9999px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  color: var(--foreground);
  font-weight: 700;
}

.cf-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow:
    0 20px 40px -10px var(--pill-shadow-hover),
    inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--foreground);
}

.cf-glass-pill--lg {
  padding: 1.25rem 2.5rem;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.cf-glass-pill--sm {
  padding: 0.75rem 1.5rem;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  font-weight: 500;
}

.cf-glass-pill--sm:hover {
  color: var(--foreground);
}

.cf-pill-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--muted-foreground);
  flex-shrink: 0;
  transition: color 0.3s;
}

.cf-glass-pill:hover .cf-pill-icon {
  color: var(--foreground);
}

/* ── Bottom bar ── */
.cf-bottom-bar {
  position: relative;
  z-index: 20;
  width: 100%;
  padding: 0 1.5rem 2rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.cf-copyright {
  color: var(--muted-foreground);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  order: 2;
}

.cf-made-with {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: default;
  order: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklch, var(--border) 50%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.cf-made-with__label {
  color: var(--muted-foreground);
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.cf-made-with__heart {
  display: inline-block;
  font-size: 1rem;
  color: var(--destructive);
  animation: cf-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

.cf-made-with__name {
  color: var(--foreground);
  font-weight: 900;
  font-size: 0.85rem;
  margin-left: 0.25rem;
  letter-spacing: normal;
}

.cf-scroll-top {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  order: 3;
  border: none;
  background: none;
}

.cf-scroll-top-icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.3s;
}

.cf-scroll-top:hover .cf-scroll-top-icon {
  transform: translateY(-6px);
}

@media (min-width: 768px) {
  .cf-marquee-track { font-size: 0.875rem; }
  .cf-glass-pill--lg { font-size: 1rem; }
  .cf-glass-pill--sm { font-size: 0.875rem; }
  .cf-bottom-bar { flex-wrap: nowrap; padding: 0 3rem 2rem; }
  .cf-copyright { order: 1; font-size: 0.75rem; }
  .cf-made-with { order: 2; }
  .cf-made-with__label { font-size: 0.75rem; }
  .cf-made-with__heart { font-size: 1.125rem; }
  .cf-pill-row--secondary { gap: 1.5rem; }
}

@media (prefers-reduced-motion: reduce) {
  .cf-marquee-track { animation: none; }
  .cf-aurora { animation: none; }
  .cf-made-with__heart { animation: none; }
}
`;

export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(element, {
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as EventListener);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as EventListener);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn(className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

const MarqueeItem = () => (
  <div className="cf-marquee-item">
    <span>Plan Your Night</span>
    <span className="cf-marquee-dot-primary">✦</span>
    <span>Discover Together</span>
    <span className="cf-marquee-dot-secondary">✦</span>
    <span>Movie Magic</span>
    <span className="cf-marquee-dot-primary">✦</span>
    <span>Date Night Ready</span>
    <span className="cf-marquee-dot-secondary">✦</span>
    <span>Share &amp; Explore</span>
    <span className="cf-marquee-dot-primary">✦</span>
  </div>
);

export function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !wrapperRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: 40, scale: 0.85, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, ease: "power1.out", duration: 1.4, delay: 0.1 }
      );

      gsap.fromTo(
        headingRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, ease: "power3.out", duration: 1, delay: 0.3 }
      );

      gsap.fromTo(
        linksRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, ease: "power3.out", duration: 1, delay: 0.5 }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div
        ref={wrapperRef}
        className="cf-curtain cf-wrapper"
      >
        <footer className="cf-footer cf-wrapper">

          <div className="cf-aurora" />
          <div className="cf-grid" />

          <div ref={giantTextRef} className="cf-bg-text">
            ELECTRON
          </div>

          <div className="cf-marquee-band">
            <div className="cf-marquee-track">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          <div className="cf-center">
            <h2 ref={headingRef} className="cf-heading">
              Ready for tonight?
            </h2>

            <div ref={linksRef} className="cf-links">
              <div className="cf-pill-row">
                <MagneticButton
                  as="a"
                  href="#movies"
                  className="cf-glass-pill cf-glass-pill--lg"
                >
                  <svg className="cf-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                    <line x1="7" y1="2" x2="7" y2="22"/>
                    <line x1="17" y1="2" x2="17" y2="22"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <line x1="2" y1="7" x2="7" y2="7"/>
                    <line x1="2" y1="17" x2="7" y2="17"/>
                    <line x1="17" y1="17" x2="22" y2="17"/>
                    <line x1="17" y1="7" x2="22" y2="7"/>
                  </svg>
                  Browse Movies
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href="#places"
                  className="cf-glass-pill cf-glass-pill--lg"
                >
                  <svg className="cf-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Find Places
                </MagneticButton>
              </div>

              <div className="cf-pill-row cf-pill-row--secondary">
                <MagneticButton as="a" href="#spin" className="cf-glass-pill cf-glass-pill--sm">
                  Spin the Wheel
                </MagneticButton>
                <MagneticButton as="a" href="#quiz" className="cf-glass-pill cf-glass-pill--sm">
                  Take the Quiz
                </MagneticButton>
                <MagneticButton as="a" href="#memories" className="cf-glass-pill cf-glass-pill--sm">
                  Memories
                </MagneticButton>
              </div>
            </div>
          </div>

          <div className="cf-bottom-bar">
            <div className="cf-copyright">
              © 2026 Electron · Aaron &amp; Electra
            </div>

            <div className="cf-made-with cf-glass-pill">
              <span className="cf-made-with__label">Crafted with</span>
              <span className="cf-made-with__heart">❤</span>
              <span className="cf-made-with__label">for</span>
              <span className="cf-made-with__name">Aaron &amp; Electra</span>
            </div>

            <MagneticButton
              as="button"
              onClick={scrollToTop}
              className="cf-glass-pill cf-scroll-top"
              aria-label="Back to top"
            >
              <svg className="cf-scroll-top-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </MagneticButton>
          </div>

        </footer>
      </div>
    </>
  );
}
