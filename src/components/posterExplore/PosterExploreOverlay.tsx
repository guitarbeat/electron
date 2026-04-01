import React, { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Movie } from '@/shared/types';
import './PosterExploreOverlay.css';

gsap.registerPlugin(ScrollTrigger);

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

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const PosterExploreOverlay: React.FC<PosterExploreOverlayProps> = ({
  isOpen,
  onClose,
  movies,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const displayMovies = useMemo(() => {
    const withPosters = movies.filter((m) => m.posterUrl);
    const withoutPosters = movies.filter((m) => !m.posterUrl);
    return [...withPosters, ...withoutPosters].slice(0, 10);
  }, [movies]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // GSAP ScrollTrigger animation
  useEffect(() => {
    if (!isOpen) return;

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Always lock body scroll; always restore on cleanup
    document.body.style.overflow = 'hidden';

    const scroller = scrollerRef.current;
    const carousel = carouselRef.current;
    const track = trackRef.current;
    const arrow = arrowRef.current;

    if (!scroller || !carousel || !track) {
      return () => {
        document.body.style.overflow = '';
      };
    }

    const cards = Array.from(
      carousel.querySelectorAll<HTMLElement>('.poster-explore-card')
    );

    if (cards.length === 0) {
      // No cards — still need to show the overlay, body scroll already locked
      return () => {
        document.body.style.overflow = '';
      };
    }

    scroller.scrollTop = 0;

    // Initial 3D card state — stacked in depth, centered by GSAP
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

    // Reveal the carousel immediately (opacity only, no progress autoplay)
    gsap.to(carousel, { duration: 0.6, opacity: 1, ease: 'power2.inOut' });

    // Main scroll-driven timeline (scroll starts at 0 → tl.progress = 0)
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

    // Tell ScrollTrigger how to interact with our custom scroller div
    ScrollTrigger.scrollerProxy(scroller, {
      scrollTop(value?: number) {
        if (value !== undefined) {
          scroller.scrollTop = value;
        }
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
      pinType: 'transform',
    });

    // Update ScrollTrigger whenever the custom scroller scrolls
    const onScrollerScroll = () => {
      ScrollTrigger.update();
      // Fade arrow on first scroll
      if (arrow) {
        const maxScroll = scroller.scrollHeight - scroller.clientHeight;
        const rawProgress = maxScroll > 0 ? scroller.scrollTop / maxScroll : 0;
        arrow.style.opacity = String(Math.max(0, 1 - rawProgress * 18));
      }
    };
    scroller.addEventListener('scroll', onScrollerScroll, { passive: true });

    // ScrollTrigger drives the timeline via scrub
    const st = ScrollTrigger.create({
      trigger: track,
      scroller,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      animation: tl,
      pin: carousel,
      pinType: 'transform',
    });

    cleanupRef.current = () => {
      st.kill();
      tl.kill();
      ScrollTrigger.clearScrollMemory();
      scroller.removeEventListener('scroll', onScrollerScroll);
      document.body.style.overflow = '';
    };

    return () => {
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
        {displayMovies.length > 0 && (
          <span className="poster-explore-header__count">
            {displayMovies.length} film{displayMovies.length !== 1 ? 's' : ''}
          </span>
        )}
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
        {displayMovies.length === 0 ? (
          <div className="poster-explore-empty">
            <span className="poster-explore-empty__icon">🎬</span>
            <p className="poster-explore-empty__text">
              No movies in the queue yet!
            </p>
          </div>
        ) : (
          <div ref={trackRef} className="poster-explore-track">
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
                        <span>{getInitials(movie.title)}</span>
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
        )}
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
