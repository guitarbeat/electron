import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Movie, User } from '../../../types';
import { colors, radius, shadows, spacing, typography } from '../../../design-system/tokens';
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
    const lastY = useRef(0);
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
    const handleStart = (clientY: number) => {
        if (totalCards === 0) return;
        setIsDragging(true);
        setVelocity(0);
        lastY.current = clientY;
        lastTime.current = Date.now();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const handleMove = (clientY: number) => {
        if (!isDragging || totalCards === 0) return;

        const deltaY = clientY - lastY.current;
        const deltaTime = Date.now() - lastTime.current;

        const rotationDelta = deltaY * 0.3;
        setRotation(r => r + rotationDelta);

        if (deltaTime > 0) {
            setVelocity(rotationDelta / Math.max(deltaTime / 16, 1));
        }

        lastY.current = clientY;
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

    // Card position on 3D wheel
    const getCardStyle = (index: number) => {
        if (totalCards === 0) return {};
        const cardAngle = index * anglePerCard - rotation;
        const normalizedAngle = ((cardAngle % 360) + 360) % 360;

        // Calculate 3D position on wheel
        const radiusDist = 280; // Distance from center
        const angleRad = (normalizedAngle * Math.PI) / 180;

        const z = Math.cos(angleRad) * radiusDist;
        const y = Math.sin(angleRad) * radiusDist;

        // Cards in front are larger/visible, behind are hidden
        const scale = Math.max(0.5, (z + radiusDist) / (radiusDist * 2));
        const opacity = z > -100 ? 1 : Math.max(0, (z + radiusDist) / (radiusDist * 0.8));
        const zIndex = Math.round(z + radiusDist);

        // Tilt cards based on position
        const tiltX = normalizedAngle > 180 ? -(360 - normalizedAngle) * 0.3 : normalizedAngle * 0.3;

        return {
            transform: `
        translateY(${y}px) 
        translateZ(${z}px) 
        rotateX(${-tiltX}deg)
        scale(${scale})
      `,
            opacity,
            zIndex,
            transition: isDragging ? 'none' : 'all 0.15s ease-out',
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
                    perspective: '1000px',
                    perspectiveOrigin: 'center center',
                    width: '100%',
                    height: '500px',
                }}
                onMouseDown={(e) => handleStart(e.clientY)}
                onMouseMove={(e) => handleMove(e.clientY)}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={(e) => handleStart(e.touches[0].clientY)}
                onTouchMove={(e) => handleMove(e.touches[0].clientY)}
                onTouchEnd={handleEnd}
                onWheel={handleWheel}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        transformStyle: 'preserve-3d',
                        width: '160px',
                        height: '240px',
                    }}
                >
                    {movies.map((movie, index) => {
                        const isActive = isActiveCard(index);
                        const isWatchedByMe = currentUser && movie.watchedBy.includes(currentUser);
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
                                    borderColor: isActive ? colors.accent : 'rgba(255, 255, 255, 0.2)',
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
                                <div
                                    className="rdc-poster"
                                    style={{ backgroundImage: `url(${movie.posterUrl})` }}
                                />
                                <div className={cn(
                                    "rdc-gradient",
                                    isActive ? "rdc-gradient-active" : ""
                                )} />
                                {isActive && (
                                    <div className="rdc-ring" style={{ boxShadow: `inset 0 0 0 2px ${colors.accent}80` }} />
                                )}
                                <div className="rdc-footer">
                                    <h3 className="rdc-title" style={{ fontFamily: typography.fontFamily.heading.join(', ') }}>{movie.title}</h3>
                                </div>
                                {/* Status Indicators */}
                                <div className="rdc-status">
                                    {isWatchedByMe ? (
                                        <div className="rdc-status-watched" style={{ backgroundColor: colors.success }}>
                                            <svg className="rdc-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="rdc-status-queue" style={{ color: colors.accent }}>
                                            QUEUE
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="rdc-controls" style={{ marginTop: spacing.md }}>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </button>
                <button
                    onClick={() => onMovieClick(activeMovie)}
                    className="px-8 py-3 rounded-full font-bold uppercase tracking-wide transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    style={{
                        background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})`,
                        color: '#fff',
                        boxShadow: shadows.glow,
                        padding: '12px 32px',
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Spin hint */}
            <div className="rdc-hint" style={{ color: colors.textTertiary }}>
                <span className="rdc-hint-desktop">Scroll or drag to spin</span>
                <span className="rdc-hint-mobile">Swipe up/down to spin</span>
            </div>
        </div>
    );
};
