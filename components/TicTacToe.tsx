import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { spacing, colors, shadows, radius, typography } from '../design-system/tokens';

const TicTacToe: React.FC = () => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.includes(null) ? null : 'Draw';
  };

  const winner = calculateWinner(board);
  const status = winner 
    ? winner === 'Draw' ? "It's a draw!" : `Winner: ${winner}`
    : `Next player: ${isXNext ? 'X' : 'O'}`;

  const handleClick = (i: number) => {
    if (winner || board[i]) return;
    const nextBoard = board.slice();
    nextBoard[i] = isXNext ? 'X' : 'O';
    setBoard(nextBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <Card variant="elevated" style={{ padding: spacing.lg, margin: `${spacing.md} 0` }}>
      <h3 style={{ marginBottom: spacing.sm, color: colors.accent, fontFamily: typography.fontFamily.heading.join(',') }}>
        🕹️ Tic-Tac-Toe
      </h3>
      <div style={{ marginBottom: spacing.md, fontSize: typography.fontSize.sm, fontWeight: 'bold' }}>
        {status}
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: spacing.xs,
        maxWidth: '200px',
        margin: '0 auto'
      }}>
        {board.map((square, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: colors.surface,
              border: `2px solid ${colors.borderSecondary}`,
              borderRadius: radius.sm,
              fontSize: '24px',
              fontWeight: 'bold',
              color: square === 'X' ? colors.accent : colors.secondary,
              cursor: square || winner ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: shadows.button,
            }}
          >
            {square}
          </button>
        ))}
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={resetGame}
        style={{ marginTop: spacing.md, width: '100%' }}
      >
        Reset Game
      </Button>
    </Card>
  );
};

export default TicTacToe;
