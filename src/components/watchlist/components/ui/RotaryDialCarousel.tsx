import React, { useState, useRef, useEffect } from 'react';
import { Movie, User } from '@/types';
import { colors, shadows, typography } from '@/design-system/tokens';
import ImageWithFallback from '@/common/ImageWithFallback';
import { ChevronLeftIcon, ChevronRightIcon, StarFilledIcon } from '@/common/icons';
import { userImageSources } from '@/config/imageConfig';
import './RotaryDialCarousel.css';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface RotaryDialCarouselProps {
  movies: Movie[];
  currentUser: User | null;
  onMovieClick?: (movie: Movie) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const RotaryDialCarousel: React.FC<RotaryDialCarouselProps> = ({
  movies,
  currentUser: _currentUser,
  onMovieClick,
  style,
  className,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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
    setIsDragging(true);
    lastX.current = clientX;
    lastTime.current = Date.now();
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const deltaX = clientX - lastX.current;

    const sensitivity = 0.5;
    setRotation((prev) => prev - deltaX * sensitivity);

    lastX.current = clientX;
    lastTime.current = Date.now();
  };

  const handleEnd = () => {
    setIsDragging(false);

    const snapAngle = Math.round(rotation / anglePerCard) * anglePerCard;
    setRotation(snapAngle);
  };

  const spin = (direction: number) => {
    setRotation((prev) => prev + direction * anglePerCard);
  };

  const handleCardClick = (movie: Movie, index: number) => {
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
          transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
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
                  <div className="rdc-no-poster">
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
                        <StarFilledIcon
                          className="rdc-icon"
                          style={{
                            width: isMobile ? '10px' : '12px',
                            height: isMobile ? '10px' : '12px',
                          }}
                        />
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
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {movie.watchedBy.map((user, idx) => (
                      <div
                        key={user}
                        style={{
                          marginLeft: idx === 0 ? 0 : -12,
                          position: 'relative',
                          width: isMobile ? 36 : 48,
                          height: isMobile ? 36 : 48,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
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
          <ChevronLeftIcon
            style={{
              width: isMobile ? '16px' : '20px',
              height: isMobile ? '16px' : '20px',
            }}
          />
        </button>
        <button
          type="button"
          onClick={() => onMovieClick?.(activeMovie)}
          style={{
            padding: isMobile ? '10px 20px' : '12px 32px',
            fontSize: isMobile ? '11px' : '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderRadius: 9999,
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})`,
            color: '#fff',
            boxShadow: shadows.glow,
            border: 'none',
            cursor: 'pointer',
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
          <ChevronRightIcon
            style={{
              width: isMobile ? '16px' : '20px',
              height: isMobile ? '16px' : '20px',
            }}
          />
        </button>
      </div>

      <div
        className="rdc-hint"
        style={{ color: colors.textTertiary, marginTop: isMobile ? '40px' : '16px' }}
      >
        <span className="rdc-hint-desktop">Scroll or drag to spin through your watchlist</span>
        <span className="rdc-hint-mobile">Swipe to spin through your watchlist</span>
      </div>
    </div>
  );
};
