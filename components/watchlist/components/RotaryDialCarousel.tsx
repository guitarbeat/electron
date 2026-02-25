import React, { useState, useRef, useEffect } from 'react';
import { Movie, User } from '../../../types';
import { colors, shadows, typography } from '../../../design-system/tokens';
import ImageWithFallback from '../../ImageWithFallback';
import { userImageSources } from '../../../config/imageConfig';
import './RotaryDialCarousel.css';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface RotaryDialCarouselProps {
  movies: Movie[];
  currentUser: User | null;
  onMovieClick?: (movie: Movie) => void;
  mode?: 'browse' | 'spin';
  onSpinComplete?: (movie: Movie) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const RotaryDialCarousel: React.FC<RotaryDialCarouselProps> = ({
  movies,
  currentUser: _currentUser,
  onMovieClick,
  mode = 'browse',
  onSpinComplete,
  style,
  className,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  const lastX = useRef(0);
  const lastTime = useRef(Date.now());
  const animationRef = useRef<number | null>(null);

  // Responsive configuration
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const radiusVal = isMobile ? Math.min(windowWidth * 0.35, 260) : 350;
  const cardSize = isMobile ? { w: 120, h: 180 } : { w: 160, h: 240 };

  const totalCards = movies.length;
  const anglePerCard = totalCards > 0 ? 360 / totalCards : 0;

  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const activeIndex = Math.round(normalizedRotation / anglePerCard) % totalCards;
  const activeMovie = movies[activeIndex] || movies[0];

  const handleStart = (clientX: number) => {
    if (mode === 'spin' || isSpinning) return;
    setIsDragging(true);
    lastX.current = clientX;
    lastTime.current = Date.now();
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || mode === 'spin' || isSpinning) return;
    const deltaX = clientX - lastX.current;

    const sensitivity = 0.5;
    setRotation((prev) => prev - deltaX * sensitivity);

    lastX.current = clientX;
    lastTime.current = Date.now();
  };

  const handleEnd = () => {
    if (mode === 'spin' || isSpinning) return;
    setIsDragging(false);

    const snapAngle = Math.round(rotation / anglePerCard) * anglePerCard;
    setRotation(snapAngle);
  };

  const spin = (direction: number) => {
    if (mode === 'spin' || isSpinning) return;
    setRotation((prev) => prev + direction * anglePerCard);
  };

  const handleRandomSpin = () => {
    if (isSpinning || totalCards === 0) return;
    setIsSpinning(true);

    const winnerIndex = Math.floor(Math.random() * totalCards);
    const winnerMovie = movies[winnerIndex];

    const currentRot = rotation;
    const targetAngleLocal = winnerIndex * anglePerCard;

    const currentMod = ((currentRot % 360) + 360) % 360;
    let diff = targetAngleLocal - currentMod;

    if (diff <= 0) diff += 360;

    const extraSpins = 360 * (5 + Math.floor(Math.random() * 3));
    const finalRotation = currentRot + diff + extraSpins;

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      if (onSpinComplete) {
        onSpinComplete(winnerMovie);
      }
    }, 4000);
  };

  const handleCardClick = (movie: Movie, index: number) => {
    if (mode === 'spin' || isSpinning) return;
    const isActive = index === activeIndex;
    if (isActive) {
      onMovieClick?.(movie);
    } else {
      const currentAngle = normalizedRotation;
      const targetAngle = index * anglePerCard;
      let diff = targetAngle - currentAngle;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      setRotation(rotation + diff);
    }
  };

  return (
    <div
      className={cn('rotary-dial-container', className)}
      style={style}
      onMouseDown={(e) => handleStart(e.clientX)}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchEnd={handleEnd}
    >
      <div
        className="rdc-wheel-track"
        style={{
          transform: `translate(-50%, -50%) rotateY(${-rotation}deg)`,
          transition: isDragging
            ? 'none'
            : isSpinning
              ? 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)'
              : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {movies.map((movie, index) => {
          const isActive = index === activeIndex;
          const itemAngle = index * anglePerCard;

          return (
            <div
              key={movie.id}
              role="button"
              tabIndex={0}
              className={cn('rdc-card', isActive && 'rdc-card-active')}
              style={{
                transform: `rotateY(${itemAngle}deg) translateZ(${radiusVal}px)`,
                width: `${cardSize.w}px`,
                height: `${cardSize.h}px`,
              }}
              onClick={() => handleCardClick(movie, index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardClick(movie, index);
                }
              }}
            >
              <div className="rdc-poster">
                {movie.posterUrl ? (
                  <ImageWithFallback
                    sources={[movie.posterUrl]}
                    alt={movie.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                    <span>No Poster</span>
                  </div>
                )}
              </div>

              <div
                className="rdc-overlay"
                style={{
                  background: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)`,
                }}
              />
              {isActive && (
                <div
                  className="rdc-overlay"
                  style={{
                    boxShadow: `inset 0 0 0 2px ${colors.accent}40`,
                    background: `radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.2) 100%)`,
                  }}
                />
              )}

              <div className="rdc-content" style={{ padding: isMobile ? '10px' : '16px' }}>
                <div className="rdc-header">
                  <span
                    className="rdc-index"
                    style={{
                      width: isMobile ? '18px' : '22px',
                      height: isMobile ? '18px' : '22px',
                      fontSize: isMobile ? '8px' : '10px',
                    }}
                  >
                    {index + 1}
                  </span>
                  {movie.genre && (
                    <span
                      className="rdc-pill"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        fontSize: isMobile ? '8px' : '10px',
                      }}
                    >
                      {movie.genre.split(',')[0]}
                    </span>
                  )}
                </div>

                <div className="rdc-body">
                  <div className="rdc-meta" style={{ fontSize: isMobile ? '9px' : '11px' }}>
                    <span>{movie.year}</span>
                    {movie.imdbRating && (
                      <span className="rdc-rating" style={{ color: colors.warning }}>
                        <svg
                          className="rdc-icon"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          style={{
                            width: isMobile ? '10px' : '12px',
                            height: isMobile ? '10px' : '12px',
                          }}
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {movie.imdbRating}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rdc-footer">
                  <h3
                    className="rdc-title"
                    style={{
                      fontFamily: typography.fontFamily.heading.join(', '),
                      fontSize: isMobile ? '12px' : '15px',
                    }}
                  >
                    {movie.title}
                  </h3>
                </div>
              </div>

              {/* Status Indicators (Avatars) */}
              <div className="rdc-status-container" style={{ top: isMobile ? '-20px' : '-30px' }}>
                {movie.watchedBy.length > 0 ? (
                  <div className="flex -space-x-3">
                    {movie.watchedBy.map((user) => (
                      <div
                        key={user}
                        className="relative rounded-full flex items-center justify-center transform hover:-translate-y-1 transition-transform duration-300"
                        style={{
                          width: isMobile ? '36px' : '48px',
                          height: isMobile ? '36px' : '48px',
                          background: `linear-gradient(135deg, rgba(147, 112, 219, 0.8) 0%, rgba(100, 80, 160, 0.8) 100%)`,
                          boxShadow: `0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px ${colors.accent}40`,
                          border: '2px solid rgba(255, 255, 255, 0.8)',
                          overflow: 'hidden',
                        }}
                      >
                        <ImageWithFallback
                          sources={userImageSources[user]}
                          alt={user}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: isMobile ? '2px 8px' : '4px 12px',
                      borderRadius: isMobile ? '8px' : '12px',
                      background: `linear-gradient(135deg, ${colors.accent}CC, ${colors.secondary}CC)`,
                      boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: isMobile ? '8px' : '10px',
                        fontWeight: '800',
                        letterSpacing: '0.1em',
                        color: '#fff',
                      }}
                    >
                      QUEUE
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {mode === 'browse' && !isSpinning && (
        <>
          <div className="rdc-controls" style={{ bottom: isMobile ? '20px' : '0px' }}>
            <button
              type="button"
              onClick={() => spin(-1)}
              className="rdc-btn-spin"
              aria-label="Previous movie"
              style={{
                width: isMobile ? '40px' : '48px',
                height: isMobile ? '40px' : '48px',
                backgroundColor: colors.surfaceElevated,
                borderColor: `${colors.borderSecondary}40`,
                color: colors.textPrimary,
              }}
            >
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  width: isMobile ? '16px' : '20px',
                  height: isMobile ? '16px' : '20px',
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onMovieClick?.(activeMovie)}
              className="rounded-full font-bold uppercase tracking-wide transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                padding: isMobile ? '10px 20px' : '12px 32px',
                fontSize: isMobile ? '11px' : '13px',
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})`,
                color: '#fff',
                boxShadow: shadows.glow,
                border: 'none',
              }}
            >
              Select {activeMovie?.title}
            </button>
            <button
              type="button"
              onClick={() => spin(1)}
              className="rdc-btn-spin"
              aria-label="Next movie"
              style={{
                width: isMobile ? '40px' : '48px',
                height: isMobile ? '40px' : '48px',
                backgroundColor: colors.surfaceElevated,
                borderColor: `${colors.borderSecondary}40`,
                color: colors.textPrimary,
              }}
            >
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  width: isMobile ? '16px' : '20px',
                  height: isMobile ? '16px' : '20px',
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div
            className="rdc-hint"
            style={{ color: colors.textTertiary, marginTop: isMobile ? '40px' : '16px' }}
          >
            <span className="rdc-hint-desktop">Scroll or drag to spin through your watchlist</span>
            <span className="rdc-hint-mobile">Swipe to spin through your watchlist</span>
          </div>
        </>
      )}

      {mode === 'spin' && !isSpinning && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-auto">
          <button
            type="button"
            onClick={handleRandomSpin}
            className="transition-transform hover:scale-110 active:scale-95"
            style={{
              padding: '16px 48px',
              fontSize: '24px',
              fontWeight: 'bold',
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})`,
              color: 'white',
              borderRadius: '9999px',
              boxShadow: shadows.glowStrong,
              border: `2px solid rgba(255,255,255,0.2)`,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            SPIN!
          </button>
        </div>
      )}

      {isSpinning && (
        <div className="absolute bottom-20 left-0 right-0 text-center z-50 pointer-events-none">
          <h2
            className="animate-pulse"
            style={{
              color: colors.accent,
              textShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 10px #ff69b4',
              fontSize: '2rem',
              fontFamily: typography.fontFamily.heading.join(','),
              margin: 0,
            }}
          >
            Spinning...
          </h2>
        </div>
      )}
    </div>
  );
};
