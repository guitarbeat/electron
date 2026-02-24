import React, { useRef, useEffect } from 'react';
import { colors, radius, shadows } from '../../design-system/tokens';
import { SnakeGameState } from './snakeGameLogic';

interface SnakeBoardProps {
    gameState: SnakeGameState;
    cellSize: number;
    cellGap: number;
    isFullscreen: boolean;
    isMobile: boolean;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
}

const SnakeBoard: React.FC<SnakeBoardProps> = ({
    gameState,
    cellSize,
    cellGap,
    isFullscreen,
    isMobile,
    onTouchStart,
    onTouchEnd,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height, snake, food } = gameState;

        // Calculate canvas internal resolution
        const totalWidth = width * cellSize + (width - 1) * cellGap;
        const totalHeight = height * cellSize + (height - 1) * cellGap;

        if (canvas.width !== totalWidth || canvas.height !== totalHeight) {
            canvas.width = totalWidth;
            canvas.height = totalHeight;
        }

        // Clear background
        ctx.fillStyle = colors.borderInset;
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, r);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w - r, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r);
                ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.fill();
            }
        };

        // Draw grid cells (empty)
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const px = x * (cellSize + cellGap);
                const py = y * (cellSize + cellGap);
                drawRoundedRect(px, py, cellSize, cellSize, 2);
            }
        }

        // Draw Food
        ctx.fillStyle = colors.yellow;
        const fx = food.x * (cellSize + cellGap);
        const fy = food.y * (cellSize + cellGap);
        drawRoundedRect(fx, fy, cellSize, cellSize, 2);

        // Draw Snake
        snake.forEach((segment, index) => {
            const isHead = index === 0;
            ctx.fillStyle = isHead ? colors.secondary : colors.accent;
            const sx = segment.x * (cellSize + cellGap);
            const sy = segment.y * (cellSize + cellGap);
            drawRoundedRect(sx, sy, cellSize, cellSize, 2);
        });
    }, [gameState, cellSize, cellGap]);

    return (
        <div
            role="application"
            aria-label="Snake game board"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchMove={(e) => e.preventDefault()}
            style={{
                width: isFullscreen ? 'min(90vw, 70vh, 500px)' : isMobile ? 'min(88vw, 340px)' : '360px',
                maxWidth: '100%',
                aspectRatio: '1 / 1',
                borderRadius: radius.md,
                backgroundColor: colors.borderInset,
                marginBottom: '1rem',
                marginLeft: 'auto',
                marginRight: 'auto',
                padding: '2px',
                display: 'flex',
                touchAction: 'none',
                boxShadow: isFullscreen ? '0 0 30px rgba(0,0,0,0.5)' : shadows.card,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    borderRadius: '4px',
                }}
            />
        </div>
    );
};

export default SnakeBoard;
