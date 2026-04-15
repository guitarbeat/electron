import React, { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Movie, User } from '@/shared/types';
import './PosterCarouselInline.css';

gsap.registerPlugin(ScrollTrigger);

interface PosterCarouselInlineProps {
  movies: Movie[];
}

const USER_COLORS: Record<User, string> = {
  Aaron: '#60c5f5',
  Electra: '#ff7fc6',
};

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const FALLBACK_GRADIENTS = [
  'linear-gradient(145deg, #3d1a6e 0%, #7b3fc8 60%, #1a0035 100%)',
  'linear-gradient(145deg, #6e1a4a 0%, #c83f80 60%, #350014 100%)',
  'linear-gradient(145deg, #1a3a6e 0%, #3f7bc8 60%, #001435 100%)',
  'linear-gradient(145deg, #6e4a1a 0%, #c8803f 60%, #351400 100%)',
  'linear-gradient(145deg, #1a6e4a 0%, #3fc880 60%, #003520 100%)',
  'linear-gradient(145deg, #5a1a6e 0%, #a03fc8 60%, #1a0035 100%)',
];

function getFirstGenres(genre?: string, max = 2): string[] {
  if (!genre) return [];
  return genre.split(',').map(g => g.trim()).filter(Boolean).slice(0, max);
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

    const viewH = scroller.clientHeight;
    stage.style.height = `${viewH}px`;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
    const useSimpleAnim = isIOS || isSmallScreen;

    let tl: gsap.core.Timeline;

    if (useSimpleAnim) {
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
            {displayMovies.map((movie, idx) => {
              const genres = getFirstGenres(movie.genre ?? movie.category);
              const accentColor = USER_COLORS[movie.addedBy] ?? '#cc88ff';
              const fallbackGradient = FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length];
              const isWatchedByAaron = movie.watchedBy.includes('Aaron');
              const isWatchedByElectra = movie.watchedBy.includes('Electra');
              const bothWatched = isWatchedByAaron && isWatchedByElectra;

              return (
                <div
                  key={movie.id}
                  className={`pci-card${bothWatched ? ' pci-card--watched' : ''}`}
                  style={{ '--card-accent': accentColor } as React.CSSProperties}
                >
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="pci-card__img"
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="pci-card__fallback"
                      style={{ background: fallbackGradient }}
                    >
                      {getInitials(movie.title)}
                    </div>
                  )}

                  {movie.imdbRating && (
                    <div className="pci-card__rating">
                      <span className="pci-card__rating-star">★</span>
                      <span className="pci-card__rating-val">{movie.imdbRating}</span>
                    </div>
                  )}

                  <div className="pci-card__info">
                    <div className="pci-card__meta-row">
                      {movie.year && <span className="pci-card__year">{movie.year}</span>}
                      {movie.runtime && <span className="pci-card__runtime">{movie.runtime}</span>}
                    </div>

                    <p className="pci-card__title">{movie.title}</p>

                    {movie.director && (
                      <p className="pci-card__director">dir. {movie.director}</p>
                    )}

                    {genres.length > 0 && (
                      <div className="pci-card__genres">
                        {genres.map(g => (
                          <span key={g} className="pci-card__genre-chip">{g}</span>
                        ))}
                      </div>
                    )}

                    <div className="pci-card__watchers">
                      <span
                        className={`pci-card__watcher pci-card__watcher--aaron${isWatchedByAaron ? ' is-watched' : ''}`}
                        title={isWatchedByAaron ? 'Aaron watched' : 'Aaron hasn\'t watched'}
                      >
                        {isWatchedByAaron ? '✓' : '○'} Aaron
                      </span>
                      <span
                        className={`pci-card__watcher pci-card__watcher--electra${isWatchedByElectra ? ' is-watched' : ''}`}
                        title={isWatchedByElectra ? 'Electra watched' : 'Electra hasn\'t watched'}
                      >
                        {isWatchedByElectra ? '✓' : '○'} Electra
                      </span>
                    </div>
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
        <span className="pci-count__num">{displayMovies.length}</span>
        <span className="pci-count__label"> film{displayMovies.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

export default PosterCarouselInline;
