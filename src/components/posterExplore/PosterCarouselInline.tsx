import React, { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Movie } from '@/shared/types';
import './PosterCarouselInline.css';

gsap.registerPlugin(ScrollTrigger);

interface PosterCarouselInlineProps {
  movies: Movie[];
}

function getCatUrl(movieId: string, title: string): string {
  const seed = encodeURIComponent(movieId || title || 'cat');
  return `https://cataas.com/cat?width=300&height=450&_id=${seed}`;
}

const PosterCarouselInline: React.FC<PosterCarouselInlineProps> = ({ movies }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const displayMovies = useMemo(() => {
    const withPosters = movies.filter((m) => m.posterUrl);
    const withoutPosters = movies.filter((m) => !m.posterUrl);
    return [...withPosters, ...withoutPosters];
  }, [movies]);

  useEffect(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const scroller = scrollerRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    const arrow = arrowRef.current;
    if (!scroller || !stage || !track) return;

    const cards = Array.from(stage.querySelectorAll<HTMLElement>('.pci-card'));
    if (cards.length === 0) return;

    scroller.scrollTop = 0;

    // Stage must be exactly as tall as the scroller's visible area — NOT the
    // full track height — so the cards are centred in the visible viewport.
    const viewH = scroller.clientHeight;
    stage.style.height = `${viewH}px`;

    // Detect mobile / iOS: the combination of deep z-axis GSAP transforms,
    // perspective, and backdrop-filter crashes Safari on iPhone.
    // On those devices we use a flat 2-D fade+slide instead.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
    const useSimpleAnim = isIOS || isSmallScreen;

    let tl: gsap.core.Timeline;

    if (useSimpleAnim) {
      // Simple 2-D animation: no z-axis, no rotateX, no 3-D transform-origin
      gsap.set(cards, { x: '-50%', y: '-50%', autoAlpha: 0 });

      tl = gsap.timeline({ paused: true });
      const staggerOffset = 1;
      const cardDuration = 2;

      cards.forEach((card, i) => {
        const start = (cards.length - 1 - i) * staggerOffset;
        tl.fromTo(
          card,
          { autoAlpha: 0, yPercent: 8 },
          { autoAlpha: 1, yPercent: 0, duration: 0.25, ease: 'power2.out' },
          start
        ).to(
          card,
          { autoAlpha: 0, yPercent: -8, duration: 0.25, ease: 'power2.in' },
          start + cardDuration - 0.25
        );
      });
    } else {
      // Desktop: full 3-D carousel
      gsap.set(cards, {
        transformOrigin: '50% 999px -100px',
        x: '-50%',
        y: '-45%',
        z: -500,
        rotateX: 2,
        autoAlpha: 1,
      });

      tl = gsap
        .timeline({ defaults: { duration: 2 }, paused: true })
        .to(cards, { z: 10, rotateX: -3, stagger: -1 }, 0)
        .to(cards, { yPercent: 100, stagger: -1, ease: 'back.in(2)' }, 0)
        .to(cards, { duration: 0.1, autoAlpha: 0, stagger: -1 }, 1.9);
    }

    gsap.to(stage, { duration: 0.4, opacity: 1, ease: 'power2.inOut' });

    ScrollTrigger.scrollerProxy(scroller, {
      scrollTop(value?: number) {
        if (value !== undefined) scroller.scrollTop = value;
        return scroller.scrollTop;
      },
      getBoundingClientRect() {
        const r = scroller.getBoundingClientRect();
        return { top: r.top, left: r.left, width: r.width, height: r.height };
      },
      pinType: 'transform',
    });

    const onScroll = () => {
      ScrollTrigger.update();
      if (arrow) {
        const max = scroller.scrollHeight - scroller.clientHeight;
        const p = max > 0 ? scroller.scrollTop / max : 0;
        arrow.style.opacity = String(Math.max(0, 1 - p * 18));
      }
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });

    const st = ScrollTrigger.create({
      trigger: track,
      scroller,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      animation: tl,
      pin: stage,
      pinType: 'transform',
    });

    cleanupRef.current = () => {
      st.kill();
      tl.kill();
      try { ScrollTrigger.scrollerProxy(scroller, undefined as never); } catch { /* best-effort */ }
      ScrollTrigger.clearScrollMemory();
      scroller.removeEventListener('scroll', onScroll);
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [displayMovies]);

  if (displayMovies.length === 0) {
    return (
      <div className="pci-empty">
        <span className="pci-empty__icon">🎬</span>
        <p className="pci-empty__text">Add movies to see posters here!</p>
      </div>
    );
  }

  const trackHeight = Math.max(600, displayMovies.length * 100);

  return (
    <div className="pci-root">
      <div ref={scrollerRef} className="pci-scroller">
        <div
          ref={trackRef}
          className="pci-track"
          style={{ height: `${trackHeight}vh` }}
        >
          <div ref={stageRef} className="pci-stage">
            {displayMovies.map((movie) => {
              const imgSrc = movie.posterUrl || getCatUrl(movie.id, movie.title);
              return (
                <div
                  key={movie.id}
                  className="pci-card"
                >
                  <img
                    src={imgSrc}
                    alt={movie.title}
                    className="pci-card__img"
                    draggable={false}
                  />
                  <div className="pci-card__info">
                    <p className="pci-card__title">{movie.title}</p>
                    {movie.year && <p className="pci-card__year">{movie.year}</p>}
                    {movie.director && (
                      <p className="pci-card__director">dir. {movie.director}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={arrowRef} className="pci-arrow" aria-hidden="true">
        <span className="pci-arrow__text">scroll to explore</span>
        <span className="pci-arrow__icon">↓</span>
      </div>

      <div className="pci-count" aria-hidden="true">
        {displayMovies.length} film{displayMovies.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default PosterCarouselInline;
