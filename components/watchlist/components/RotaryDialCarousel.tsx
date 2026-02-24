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
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    const lastX = useRef(0);
    const lastTime = useRef(Date.now());
    const animationRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Responsive configuration
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const radius = isMobile ? Math.min(windowWidth * 0.35, 260) : 350;
    const cardSize = isMobile ? { w: 120, h: 180 } : { w: 160, h: 240 };
    const containerHeight = isMobile ? 600 : 800;

    const totalCards = movies.length;
    const anglePerCard = totalCards > 0 ? 360 / totalCards : 0;

    // Calculate which card is focused
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const activeIndex = totalCards > 0 ? Math.round(normalizedRotation / anglePerCard) % totalCards : 0;
    const activeMovie = movies[activeIndex];

    // Momentum physics
    useEffect(() => {
        let currentVelocity = velocity;

        if (!isDragging && Math.abs(currentVelocity) > 0.05) {
            const animate = () => {
                currentVelocity = currentVelocity * 0.95; // Balanced friction for control
                setRotation(r => r + currentVelocity);
                setVelocity(currentVelocity);

                if (Math.abs(currentVelocity) > 0.05) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    // Snap to nearest card when momentum stops
                    const targetRotation = Math.round((rotation + currentVelocity) / anglePerCard) * anglePerCard;
                    setRotation(targetRotation);
                    setVelocity(0);
                }
            };
            animationRef.current = requestAnimationFrame(animate);
        } else if (!isDragging && Math.abs(velocity) <= 0.05 && totalCards > 0) {
            // Instant snap if no velocity
            const targetRotation = Math.round(rotation / anglePerCard) * anglePerCard;
            if (Math.abs(rotation - targetRotation) > 0.1) {
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

        // Higher sensitivity for mobile
        const sensitivity = isMobile ? 0.6 : 0.4;
        const rotationDelta = deltaX * sensitivity;
        setRotation(r => r + rotationDelta);

        if (deltaTime > 0) {
            const newVelocity = rotationDelta / Math.max(deltaTime / 16, 1);
            // Cap velocity to prevent extreme spinning
            const maxVelocity = 15;
            setVelocity(Math.sign(newVelocity) * Math.min(Math.abs(newVelocity), maxVelocity));
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
        // Don't prevent default if we're not actively scrolling horizontally
        // But for this component, we want the spin effect
        setRotation(r => r + e.deltaY * 0.15);
        setVelocity(e.deltaY * 0.08);
    };

    // Navigate with arrows/buttons
    const spin = (direction: number) => {
        if (totalCards === 0) return;
        const targetRotation = Math.round(rotation / anglePerCard) * anglePerCard + (direction * anglePerCard);
        setRotation(targetRotation);
        setVelocity(0);
    };

    // Card position and circular transformation
    const getCardStyle = (index: number) => {
        if (totalCards === 0) return {};

        const isActive = isActiveCard(index);

        // Find relative distance from "active" position for scaling/opacity
        const cardAngle = index * anglePerCard - rotation;
        const normalizedAngle = ((cardAngle % 360) + 360) % 360;
        let offsetAngle = normalizedAngle > 180 ? normalizedAngle - 360 : normalizedAngle;
        const absDiffIndex = Math.abs(offsetAngle / anglePerCard);

        let x = 0;
        let y = 0;
        let scale = 1;
        let zIndex = 110;
        let opacity = 1;

        if (isActive) {
            // Position at center
            x = 0;
            y = 0;
            scale = isMobile ? 1.4 : 1.6;
            zIndex = 200;
            opacity = 1;
        } else {
            // Polar coordinates on the circle
            const rad = (cardAngle - 90) * Math.PI / 180;
            x = radius * Math.cos(rad);
            y = radius * Math.sin(rad);

            // Sub-scaling and fading for background cards
            scale = Math.max(0.3, 0.75 - (absDiffIndex / (totalCards * 0.4)));
            zIndex = 100 - Math.floor(absDiffIndex * 10);
            opacity = Math.max(0.1, 0.85 - (absDiffIndex / (totalCards * 0.35)));
        }

        return {
            transform: `
                translate(-50%, -50%) 
                translateX(${x}px) 
                translateY(${y}px) 
                scale(${scale})
            `,
            opacity,
            zIndex,
            transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        };
    };

    // Check if card is the active one
    const isActiveCard = (index: number) => {
        return index === activeIndex;
    };

    if (totalCards === 0) {
        return null;
    }

    return (
        <div className="rotary-dial-container" style={{ margin: `${spacing.xl} 0`, height: `${containerHeight + 100}px` }}>
            {/* 2D Wheel Track Background */}
            <div className="rdc-wheel-track" style={{
                top: '55%',
                width: `${radius * 2}px`,
                height: `${radius * 2}px`,
                opacity: isMobile ? 0.03 : 0.05
            }} />

            {/* Selection Highlight (Center Glow) */}
            <div style={{
                position: 'absolute',
                top: '55%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: `${cardSize.w * 2}px`,
                height: `${cardSize.h * 1.5}px`,
                background: `radial-gradient(circle, ${colors.accent}20 0%, transparent 70%)`,
                borderRadius: '50%',
                zIndex: 50,
                pointerEvents: 'none'
            }} />

            {/* Wheel Container */}
            <div
                ref={containerRef}
                className="relative cursor-grab active:cursor-grabbing"
                style={{
                    perspective: '1200px',
                    perspectiveOrigin: 'center center',
                    width: '100%',
                    height: `${containerHeight}px`,
                    overflow: 'visible',
                    marginTop: '25px'
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
                        top: '55%',
                        width: '0px',
                        height: '0px',
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
                                    width: `${cardSize.w}px`,
                                    height: `${cardSize.h}px`,
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
                                <div className="rdc-content" style={{ padding: isMobile ? '10px' : '16px' }}>
                                    <div className="rdc-header">
                                        <span className="rdc-index" style={{ width: isMobile ? '18px' : '22px', height: isMobile ? '18px' : '22px', fontSize: isMobile ? '8px' : '10px' }}>
                                            {index + 1}
                                        </span>
                                        {movie.genre && (
                                            <span className="rdc-pill" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', fontSize: isMobile ? '8px' : '10px' }}>
                                                {movie.genre.split(',')[0]}
                                            </span>
                                        )}
                                    </div>

                                    <div className="rdc-body">
                                        <div className="rdc-meta" style={{ fontSize: isMobile ? '9px' : '11px' }}>
                                            <span>{movie.year}</span>
                                            {movie.imdbRating && (
                                                <span className="rdc-rating" style={{ color: colors.warning }}>
                                                    <svg className="rdc-icon" fill="currentColor" viewBox="0 0 20 20" style={{ width: isMobile ? '10px' : '12px', height: isMobile ? '10px' : '12px' }}>
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    {movie.imdbRating}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rdc-footer">
                                        <h3 className="rdc-title" style={{
                                            fontFamily: typography.fontFamily.heading.join(', '),
                                            fontSize: isMobile ? '12px' : '15px'
                                        }}>
                                            {movie.title}
                                        </h3>
                                    </div>
                                </div>

                                {/* Status Indicators (Avatars) */}
                                <div className="rdc-status-container" style={{ top: isMobile ? '-20px' : '-30px' }}>
                                    {movie.watchedBy.length > 0 ? (
                                        <div className="flex -space-x-3">
                                            {movie.watchedBy.map(user => (
                                                <div key={user} className="relative rounded-full flex items-center justify-center transform hover:-translate-y-1 transition-transform duration-300" style={{
                                                    width: isMobile ? '36px' : '48px',
                                                    height: isMobile ? '36px' : '48px',
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
                                            padding: isMobile ? '2px 8px' : '4px 12px',
                                            borderRadius: isMobile ? '8px' : '12px',
                                            background: `linear-gradient(135deg, ${colors.accent}CC, ${colors.secondary}CC)`,
                                            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
                                            backdropFilter: 'blur(4px)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)'
                                        }}>
                                            <span style={{ fontSize: isMobile ? '8px' : '10px', fontWeight: '800', letterSpacing: '0.1em', color: '#fff' }}>
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
            <div className="rdc-controls" style={{ bottom: isMobile ? '20px' : '0px' }}>
                <button
                    onClick={() => spin(-1)}
                    className="rdc-btn-spin"
                    style={{
                        width: isMobile ? '40px' : '48px',
                        height: isMobile ? '40px' : '48px',
                        backgroundColor: colors.surfaceElevated,
                        borderColor: `${colors.borderSecondary}40`,
                        color: colors.textPrimary
                    }}
                >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: isMobile ? '16px' : '20px', height: isMobile ? '16px' : '20px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={() => onMovieClick(activeMovie)}
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
                    onClick={() => spin(1)}
                    className="rdc-btn-spin"
                    style={{
                        width: isMobile ? '40px' : '48px',
                        height: isMobile ? '40px' : '48px',
                        backgroundColor: colors.surfaceElevated,
                        borderColor: `${colors.borderSecondary}40`,
                        color: colors.textPrimary
                    }}
                >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: isMobile ? '16px' : '20px', height: isMobile ? '16px' : '20px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Spin hint */}
            <div className="rdc-hint" style={{ color: colors.textTertiary, marginTop: isMobile ? '40px' : '16px' }}>
                <span className="rdc-hint-desktop">Scroll or drag to spin through your watchlist</span>
                <span className="rdc-hint-mobile">Swipe to spin through your watchlist</span>
            </div>
        </div>
    );
};
