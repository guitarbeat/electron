import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Movie, User } from '../../../types';
import { colors, radius, shadows, spacing, typography } from '../../../design-system/tokens';
import ImageWithFallback from '../../ImageWithFallback';
import { userImageSources } from '../../../config/imageConfig';
import './RotaryDialCarousel.css';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

interface RotaryDialCarouselProps {
    movies: Movie[];
    currentUser: User | null;
    onMovieClick: (movie: Movie) => void;
}

export const RotaryDialCarousel: React.FC<RotaryDialCarouselProps> = ({
    movies,
    currentUser,
    onMovieClick,
}) => {
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [velocity, setVelocity] = useState(0);
    const lastX = useRef(0);
    const lastTime = useRef(Date.now());
    const animationRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const totalCards = movies.length;
    const anglePerCard = totalCards > 0 ? 360 / totalCards : 0;

    // Calculate which card is at the front (highlighted)
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const activeIndex = totalCards > 0 ? Math.round(normalizedRotation / anglePerCard) % totalCards : 0;
    const activeMovie = movies[activeIndex];

    // Momentum physics
    useEffect(() => {
        let currentVelocity = velocity;

        if (!isDragging && Math.abs(currentVelocity) > 0.1) {
            const animate = () => {
                currentVelocity = currentVelocity * 0.95; // Friction
                setRotation(r => r + currentVelocity);
                setVelocity(currentVelocity);

                if (Math.abs(currentVelocity) > 0.1) {
                    animationRef.current = requestAnimationFrame(animate);
                }
            };
            animationRef.current = requestAnimationFrame(animate);
        } else if (!isDragging && Math.abs(velocity) <= 0.1 && totalCards > 0) {
            // Snap to nearest card
            const targetRotation = Math.round(rotation / anglePerCard) * anglePerCard;
            if (Math.abs(rotation - targetRotation) > 0.5) {
                setRotation(targetRotation);
            }
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isDragging, velocity, rotation, anglePerCard, totalCards]);

    // Mouse/Touch handlers for spinning
    const handleStart = (clientX: number) => {
        if (totalCards === 0) return;
        setIsDragging(true);
        setVelocity(0);
        lastX.current = clientX;
        lastTime.current = Date.now();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const handleMove = (clientX: number) => {
        if (!isDragging || totalCards === 0) return;

        const deltaX = clientX - lastX.current;
        const deltaTime = Date.now() - lastTime.current;

        const rotationDelta = deltaX * 0.3;
        setRotation(r => r + rotationDelta);

        if (deltaTime > 0) {
            setVelocity(rotationDelta / Math.max(deltaTime / 16, 1));
        }

        lastX.current = clientX;
        lastTime.current = Date.now();
    };

    const handleEnd = () => {
        setIsDragging(false);
    };

    // Scroll wheel handler
    const handleWheel = (e: React.WheelEvent) => {
        if (totalCards === 0) return;
        e.preventDefault();
        setRotation(r => r + e.deltaY * 0.2);
        setVelocity(e.deltaY * 0.1);
    };

    // Navigate with arrows/buttons
    const spin = (direction: number) => {
        if (totalCards === 0) return;
        const targetRotation = rotation + (direction * anglePerCard);
        setRotation(targetRotation);
    };

    // Card position and 3D transformation
    const getCardStyle = (index: number) => {
        if (totalCards === 0) return {};

        // Find relative distance from center in terms of cards
        const cardAngle = index * anglePerCard - rotation;
        const normalizedAngle = ((cardAngle % 360) + 360) % 360;
        let offsetAngle = normalizedAngle > 180 ? normalizedAngle - 360 : normalizedAngle;

        // How many "cards away" from center
        const diffIndex = offsetAngle / anglePerCard;
        const absDiffIndex = Math.abs(diffIndex);

        // X translation: Center card is 0. Side cards are spaced out.
        let x = 0;
        if (absDiffIndex > 0) {
            const sign = diffIndex > 0 ? 1 : -1;
            // Base shift ensures the immediate neighbor clears the flat center card
            const baseShift = 100 * Math.min(1, absDiffIndex);
            // Extra shift spaces out the tilted side cards nicely
            const extraShift = Math.max(0, absDiffIndex - 1) * 60;
            x = sign * (baseShift + extraShift);
        }

        // Z translation: center is 0, sides are pushed back
        let z = 0;
        if (absDiffIndex > 0) {
            z = -Math.min(1, absDiffIndex) * 120 - Math.max(0, absDiffIndex - 1) * 60;
        }

        // Y rotation: side cards face inward
        let rotateY = 0;
        if (absDiffIndex > 0) {
            const sign = diffIndex > 0 ? -1 : 1;
            // Reduced max rotation from 60 to 40 to avoid distortion
            rotateY = sign * 40 * Math.min(1, absDiffIndex);
        }

        // Scale and Z-index
        const isActive = isActiveCard(index);
        const scale = isActive ? 1.1 : 0.95;
        const zIndex = 100 - Math.floor(absDiffIndex * 10);
        const opacity = Math.max(0, 1 - (absDiffIndex / 4.5));

        return {
            transform: `
        translate(-50%, -50%) 
        translateX(${x}px) 
        translateZ(${z}px) 
        rotateY(${rotateY}deg)
        scale(${scale})
      `,
            opacity,
            zIndex,
            transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        };
    };

    // Check if card is the active (front) one
    const isActiveCard = (index: number) => {
        return index === activeIndex;
    };

    if (totalCards === 0) {
        return null;
    }

    return (
        <div className="rotary-dial-container" style={{ margin: `${spacing.xl} 0` }}>
            {/* 3D Wheel Container */}
            <div
                ref={containerRef}
                className="relative cursor-grab active:cursor-grabbing"
                style={{
                    perspective: '1500px',
                    perspectiveOrigin: 'center center',
                    width: '100%',
                    height: '500px',
                    overflow: 'visible',
                }}
                onMouseDown={(e) => handleStart(e.clientX)}
                onMouseMove={(e) => handleMove(e.clientX)}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={(e) => handleStart(e.touches[0].clientX)}
                onTouchMove={(e) => handleMove(e.touches[0].clientX)}
                onTouchEnd={handleEnd}
                onWheel={handleWheel}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '0px',
                        height: '0px',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {movies.map((movie, index) => {
                        const isActive = isActiveCard(index);
                        const isWatchedByBoth = movie.watchedBy.length >= 2;

                        return (
                            <div
                                key={movie.id}
                                className={cn(
                                    "rdc-card",
                                    isActive ? "rdc-card-active" : "",
                                    isWatchedByBoth && !isActive ? "rdc-watched-both" : ""
                                )}
                                style={{
                                    ...getCardStyle(index),
                                    borderColor: isActive ? colors.accent : 'rgba(255, 255, 255, 0.1)',
                                    width: '180px',
                                    height: '270px',
                                }}
                                onClick={() => {
                                    if (isActive) {
                                        onMovieClick(movie);
                                    } else {
                                        // Spin to this card
                                        const currentAngle = normalizedRotation;
                                        const targetAngle = index * anglePerCard;
                                        let diff = targetAngle - currentAngle;
                                        if (diff > 180) diff -= 360;
                                        if (diff < -180) diff += 360;
                                        setRotation(rotation + diff);
                                    }
                                }}
                            >
                                {/* Poster Layer */}
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

                                {/* Gradient Overlays */}
                                <div className="rdc-overlay" style={{
                                    background: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)`
                                }} />
                                {isActive && (
                                    <div className="rdc-overlay" style={{
                                        boxShadow: `inset 0 0 0 2px ${colors.accent}40`,
                                        background: `radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.2) 100%)`
                                    }} />
                                )}

                                {/* Content Layer */}
                                <div className="rdc-content">
                                    <div className="rdc-header">
                                        <span className="rdc-index">{index + 1}</span>
                                        {movie.genre && (
                                            <span className="rdc-pill" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                                                {movie.genre.split(',')[0]}
                                            </span>
                                        )}
                                    </div>

                                    <div className="rdc-body">
                                        <div className="rdc-meta">
                                            <span>{movie.year}</span>
                                            {movie.imdbRating && (
                                                <span className="rdc-rating" style={{ color: colors.warning }}>
                                                    <svg className="rdc-icon" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    {movie.imdbRating}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rdc-footer">
                                        <h3 className="rdc-title" style={{ fontFamily: typography.fontFamily.heading.join(', ') }}>
                                            {movie.title}
                                        </h3>
                                    </div>
                                </div>

                                {/* Status Indicators (Avatars) */}
                                <div className="rdc-status-container">
                                    {movie.watchedBy.length > 0 ? (
                                        <div className="flex -space-x-3">
                                            {movie.watchedBy.map(user => (
                                                <div key={user} className="relative rounded-full flex items-center justify-center transform hover:-translate-y-1 transition-transform duration-300" style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    background: `linear-gradient(135deg, rgba(147, 112, 219, 0.8) 0%, rgba(100, 80, 160, 0.8) 100%)`,
                                                    boxShadow: `0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px ${colors.accent}40`,
                                                    border: '2px solid rgba(255, 255, 255, 0.8)',
                                                    overflow: 'hidden'
                                                }}>
                                                    <ImageWithFallback sources={userImageSources[user]} alt={user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            background: `linear-gradient(135deg, ${colors.accent}CC, ${colors.secondary}CC)`,
                                            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
                                            backdropFilter: 'blur(4px)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)'
                                        }}>
                                            <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.1em', color: '#fff' }}>
                                                QUEUE
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="rdc-controls" style={{ marginTop: spacing.lg }}>
                <button
                    onClick={() => spin(-1)}
                    className="rdc-btn-spin"
                    style={{
                        backgroundColor: colors.surfaceElevated,
                        borderColor: `${colors.borderSecondary}40`,
                        color: colors.textPrimary
                    }}
                >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={() => onMovieClick(activeMovie)}
                    className="px-8 py-3 rounded-full font-bold uppercase tracking-wide transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    style={{
                        background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})`,
                        color: '#fff',
                        boxShadow: shadows.glow,
                        border: 'none',
                    }}
                >
                    Select {activeMovie?.title}
                </button>
                <button
                    onClick={() => spin(1)}
                    className="rdc-btn-spin"
                    style={{
                        backgroundColor: colors.surfaceElevated,
                        borderColor: `${colors.borderSecondary}40`,
                        color: colors.textPrimary
                    }}
                >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Spin hint */}
            <div className="rdc-hint" style={{ color: colors.textTertiary }}>
                <span className="rdc-hint-desktop">Scroll or drag to spin through your watchlist</span>
                <span className="rdc-hint-mobile">Swipe to spin through your watchlist</span>
            </div>
        </div>
    );
};
