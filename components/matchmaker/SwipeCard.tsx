import React, { useState, useRef } from 'react';
import { Movie } from '../../types';
import { colors, spacing, radius, shadows, typography, borders, motion as motionTokens } from '../../design-system/tokens';

interface SwipeCardProps {
    movie: Movie;
    onSwipe: (direction: 'left' | 'right') => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ movie, onSwipe }) => {
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);

    const handleStart = (clientX: number) => {
        startX.current = clientX;
        setIsDragging(true);
    };

    const handleMove = (clientX: number) => {
        if (!isDragging) return;
        setOffsetX(clientX - startX.current);
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (offsetX > 150) {
            onSwipe('right');
        } else if (offsetX < -150) {
            onSwipe('left');
        }
        setOffsetX(0);
    };

    const rotation = offsetX / 10;
    const opacity = Math.max(0, 1 - (Math.abs(offsetX) > 250 ? (Math.abs(offsetX) - 250) / 100 : 0));
    const likeOpacity = Math.min(1, Math.max(0, (offsetX - 50) / 100));
    const nopeOpacity = Math.min(1, Math.max(0, (-offsetX - 50) / 100));

    return (
        <div
            onMouseDown={(e) => handleStart(e.clientX)}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
            onTouchEnd={handleEnd}
            style={{
                position: 'absolute',
                width: '100%',
                maxWidth: '350px',
                height: '500px',
                cursor: isDragging ? 'grabbing' : 'grab',
                transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
                opacity: opacity,
                transition: isDragging ? 'none' : `transform ${motionTokens.duration.normal} ${motionTokens.easing.easeOut}, opacity ${motionTokens.duration.normal} ${motionTokens.easing.easeOut}`,
                zIndex: 1,
                touchAction: 'none',
                userSelect: 'none',
            }}
        >
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: radius.card,
                    overflow: 'hidden',
                    backgroundColor: colors.surface,
                    boxShadow: shadows.card,
                    display: 'flex',
                    flexDirection: 'column',
                    border: borders.cardOutset,
                    position: 'relative',
                }}
            >
                {/* Like/Nope Overlays */}
                <div
                    style={{
                        position: 'absolute',
                        top: 40,
                        left: 20,
                        border: `4px solid ${colors.success}`,
                        color: colors.success,
                        padding: '4px 12px',
                        borderRadius: radius.sm,
                        fontSize: typography.fontSize.xl,
                        fontWeight: 'bold',
                        transform: 'rotate(-20deg)',
                        opacity: likeOpacity,
                        zIndex: 10,
                        pointerEvents: 'none',
                    }}
                >
                    LIKE
                </div>
                <div
                    style={{
                        position: 'absolute',
                        top: 40,
                        right: 20,
                        border: `4px solid ${colors.error}`,
                        color: colors.error,
                        padding: '4px 12px',
                        borderRadius: radius.sm,
                        fontSize: typography.fontSize.xl,
                        fontWeight: 'bold',
                        transform: 'rotate(20deg)',
                        opacity: nopeOpacity,
                        zIndex: 10,
                        pointerEvents: 'none',
                    }}
                >
                    NOPE
                </div>

                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <img
                        src={movie.posterUrl || 'https://via.placeholder.com/400x600?text=No+Poster'}
                        alt={movie.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        draggable={false}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                            padding: spacing.lg,
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                color: colors.textPrimary,
                                fontSize: typography.fontSize.xl,
                                fontFamily: typography.fontFamily.heading.join(', '),
                                textShadow: shadows.textGlow,
                                marginBottom: spacing.xs,
                            }}
                        >
                            {movie.title}
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                color: colors.textSecondary,
                                fontSize: typography.fontSize.sm,
                                opacity: 0.9,
                            }}
                        >
                            {movie.year} • {movie.category || movie.genre || 'Movie'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SwipeCard;
