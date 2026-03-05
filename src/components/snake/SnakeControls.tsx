import React from 'react';
import Button from '@/ui/Button;
import { colors, radius, spacing } from '@/design-system/tokens;
import { Direction, GameStatus } from './snakeGameLogic';

interface SnakeControlsProps {
  status: GameStatus;
  isMobile: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  onDirection: (direction: Direction) => void;
}

const SnakeControls: React.FC<SnakeControlsProps> = ({
  status,
  isMobile,
  onTogglePause,
  onRestart,
  onDirection,
}) => {
  const renderDirectionButton = (direction: Direction, label: string) => (
    <Button
      variant="secondary"
      size="sm"
      onPointerDown={(e) => {
        e.preventDefault();
        onDirection(direction);
      }}
      style={{
        width: '56px',
        height: '56px',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        borderRadius: radius.lg,
        touchAction: 'none',
        userSelect: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: `1px solid ${colors.borderSecondary}40`,
      }}
      aria-label={`Move ${direction}`}
    >
      {label}
    </Button>
  );

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: spacing.sm,
        }}
      >
        <Button
          size="sm"
          variant="secondary"
          onClick={onTogglePause}
          disabled={status === 'game-over'}
        >
          {status === 'paused' ? 'Resume' : 'Pause'}
        </Button>
        <Button size="sm" variant="primary" onClick={onRestart}>
          Restart
        </Button>
      </div>

      {isMobile && (
        <div
          style={{
            width: '200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: spacing.md,
            marginTop: spacing.sm,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: spacing.sm,
            justifyItems: 'center',
          }}
        >
          <span />
          {renderDirectionButton('up', '↑')}
          <span />
          {renderDirectionButton('left', '←')}
          {renderDirectionButton('down', '↓')}
          {renderDirectionButton('right', '→')}
        </div>
      )}
    </>
  );
};

export default SnakeControls;
