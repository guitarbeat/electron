import React, { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import type { Movie } from '@/shared/types';
import './PosterExploreOverlay.css';

interface PosterExploreOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
}

const CARD_COLORS = [
  'rgba(120, 60, 200, 0.82)',
  'rgba(200, 50, 110, 0.82)',
  'rgba(40, 150, 200, 0.82)',
  'rgba(200, 110, 30, 0.82)',
  'rgba(40, 190, 120, 0.82)',
  'rgba(160, 50, 210, 0.82)',
  'rgba(200, 70, 60, 0.82)',
  'rgba(60, 110, 200, 0.82)',
  'rgba(190, 170, 30, 0.82)',
  'rgba(80, 180, 170, 0.82)',
];

const PosterExploreOverlay: React.FC<PosterExploreOverlayProps> = ({
  isOpen,
  onClose,
  movies,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const displayMovies = useMemo(() => {
    const withPosters = movies.filter((m) => m.posterUrl);
    const withoutPosters = movies.filter((m) => !m.posterUrl);
    return [...withPosters, ...withoutPosters].slice(0, 10);
  }, [movies]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    document.body.style.overflow = 'hidden';

    const scroller = scrollerRef.current;
    const carousel = carouselRef.current;
    const arrow = arrowRef.current;
    if (!scroller || !carousel) return;

    const cards = Array.from(
      carousel.querySelectorAll<HTMLElement>('.poster-explore-card')
    );
    if (cards.length === 0) return;

    scroller.scrollTop = 0;
    scroller.style.overflowY = 'hidden';

    gsap.set(cards, {
      transformOrigin: '50% 999px -100px',
      x: '-50%',
      y: '-45%',
      z: -500,
      rotateX: 2,
      autoAlpha: 1,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    });

    const tl = gsap.timeline({ defaults: { duration: 2 }, paused: true })
      .to(cards, { z: 10, rotateX: -3, stagger: -1 }, 0)
      .to(cards, { yPercent: 100, stagger: -1, ease: 'back.in(2)' }, 0)
      .to(
        cards,
        {
          duration: 1,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          stagger: -1,
          ease: 'power3.in',
        },
        0
      )
      .to(
        cards,
        {
          duration: 1,
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)',
          stagger: -1,
          ease: 'sine.in',
        },
        1
      )
      .to(cards, { duration: 0.1, autoAlpha: 0, stagger: -1 }, 1.9);

    const revealTl = gsap.timeline()
      .to(carousel, { duration: 0.8, opacity: 1, ease: 'power2.inOut' })
      .fromTo(
        tl,
        { progress: 1 },
        {
          duration: 1.5,
          progress: 0.07,
          ease: 'expo',
          onComplete: () => {
            scroller.style.overflowY = 'scroll';

            const onScroll = () => {
              const maxScroll = scroller.scrollHeight - scroller.clientHeight;
              if (maxScroll <= 0) return;
              const rawProgress = scroller.scrollTop / maxScroll;
              tl.progress(0.07 + rawProgress * 0.93);
              if (arrow) {
                arrow.style.opacity = String(
                  Math.max(0, 1 - rawProgress * 18)
                );
              }
            };

            scroller.addEventListener('scroll', onScroll, { passive: true });

            cleanupRef.current = () => {
              scroller.removeEventListener('scroll', onScroll);
              tl.kill();
              revealTl.kill();
            };
          },
        },
        0
      );

    return () => {
      revealTl.kill();
      tl.kill();
      document.body.style.overflow = '';
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [isOpen, displayMovies]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="poster-explore-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Movie poster gallery"
    >
      <div className="poster-explore-header" aria-hidden="true">
        <span className="poster-explore-header__title">★ Poster Gallery ★</span>
        <span className="poster-explore-header__count">
          {displayMovies.length} film{displayMovies.length !== 1 ? 's' : ''}
        </span>
      </div>

      <button
        type="button"
        className="poster-explore-overlay__close"
        onClick={onClose}
        aria-label="Close poster gallery"
      >
        ×
      </button>

      <div ref={scrollerRef} className="poster-explore-scroller">
        <div className="poster-explore-track">
          <div ref={carouselRef} className="poster-explore-carousel">
            {displayMovies.map((movie, i) => {
              const color = CARD_COLORS[i % CARD_COLORS.length];
              const isLast = i === displayMovies.length - 1;
              return (
                <div
                  key={movie.id}
                  className="poster-explore-card"
                  style={{
                    backgroundColor: movie.posterUrl ? '#111' : color,
                    backgroundImage: movie.posterUrl
                      ? 'none'
                      : isLast
                      ? 'radial-gradient(ellipse at 330px 120px, rgba(0,0,0,0) 30%, #000 150%)'
                      : 'radial-gradient(ellipse at 2500px -400px, rgba(0,0,0,0) 0%, #000 60%)',
                  }}
                >
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="poster-explore-card__img"
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="poster-explore-card__fallback"
                      style={{ backgroundColor: color }}
                    >
                      <span>{movie.title.slice(0, 1).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="poster-explore-card__info">
                    <p className="poster-explore-card__title">{movie.title}</p>
                    {movie.year && (
                      <p className="poster-explore-card__year">{movie.year}</p>
                    )}
                    {movie.director && (
                      <p className="poster-explore-card__director">
                        dir. {movie.director}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        ref={arrowRef}
        className="poster-explore-arrow"
        aria-hidden="true"
      >
        <span className="poster-explore-arrow__text">scroll to explore</span>
        <span className="poster-explore-arrow__icon">↓</span>
      </div>
    </div>,
    document.body
  );
};

export default PosterExploreOverlay;
