import React, { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Movie } from '@/shared/types';
import './PosterCarouselInline.css';

gsap.registerPlugin(ScrollTrigger);

interface PosterCarouselInlineProps {
  movies: Movie[];
}

const FALLBACK_COLORS = [
  '#7b3fc8',
  '#c83270',
  '#287896',
  '#c86e1e',
  '#28be78',
  '#a032d2',
  '#c84640',
  '#3c6ec8',
  '#beaa1e',
  '#50b4aa',
];

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
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

    gsap.set(cards, {
      transformOrigin: '50% 999px -100px',
      x: '-50%',
      y: '-45%',
      z: -500,
      rotateX: 2,
      autoAlpha: 1,
    });

    gsap.to(stage, { duration: 0.4, opacity: 1, ease: 'power2.inOut' });

    const tl = gsap
      .timeline({ defaults: { duration: 2 }, paused: true })
      .to(cards, { z: 10, rotateX: -3, stagger: -1 }, 0)
      .to(cards, { yPercent: 100, stagger: -1, ease: 'back.in(2)' }, 0)
      .to(cards, { duration: 0.1, autoAlpha: 0, stagger: -1 }, 1.9);

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
            {displayMovies.map((movie, i) => {
              const color = FALLBACK_COLORS[i % FALLBACK_COLORS.length];
              return (
                <div
                  key={movie.id}
                  className="pci-card"
                  style={{ '--card-color': color } as React.CSSProperties}
                >
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="pci-card__img"
                      draggable={false}
                    />
                  ) : (
                    <div className="pci-card__fallback">
                      <span>{getInitials(movie.title)}</span>
                    </div>
                  )}
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
