import React, { useMemo } from 'react';
import { colors, radius } from '../../design-system/tokens';
import type { SnakeGameState, GridPosition } from './snakeGameLogic';

function keyForCell(position: GridPosition) {
  return `${position.x},${position.y}`;
}

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
  const { width, height, snake, food, status } = gameState;

  const snakeCells = useMemo(() => new Set(snake.map(keyForCell)), [snake]);
  const headKey = snake.length > 0 ? keyForCell(snake[0]) : null;

  const boardSize = width * cellSize + (width - 1) * cellGap;
  const scale = isFullscreen ? 1 : isMobile ? 0.95 : 1;

  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
    gap: `${cellGap}px`,
    width: `${boardSize}px`,
    maxWidth: '100%',
    margin: '0 auto',
    padding: `${cellGap}px`,
    borderRadius: radius.lg,
    background: `linear-gradient(180deg, ${colors.surfaceElevated}, ${colors.surface})`,
    border: `1px solid ${colors.borderSecondary}40`,
    touchAction: 'none',
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    opacity: status === 'paused' ? 0.9 : 1,
  };

  const baseCellStyle: React.CSSProperties = {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    borderRadius: Math.max(4, Math.floor(cellSize / 6)),
    backgroundColor: `${colors.borderSecondary}22`,
  };

  const foodStyle: React.CSSProperties = {
    ...baseCellStyle,
    backgroundColor: `${colors.accent}CC`,
    boxShadow: `0 0 10px ${colors.accent}55`,
  };

  const bodyStyle: React.CSSProperties = {
    ...baseCellStyle,
    backgroundColor: `${colors.secondary}B0`,
  };

  const headStyle: React.CSSProperties = {
    ...baseCellStyle,
    backgroundColor: colors.secondary,
    boxShadow: `0 0 8px ${colors.secondary}55`,
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
      <div style={containerStyle} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {Array.from({ length: width * height }, (_, index) => {
          const x = index % width;
          const y = Math.floor(index / width);
          const key = keyForCell({ x, y });

          if (x === food.x && y === food.y) {
            return <div key={key} style={foodStyle} />;
          }

          if (snakeCells.has(key)) {
            return <div key={key} style={key === headKey ? headStyle : bodyStyle} />;
          }

          return <div key={key} style={baseCellStyle} />;
        })}
      </div>
    </div>
  );
};

export default SnakeBoard;
