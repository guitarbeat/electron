import React from 'react';
import { useUser } from '../../context/UserContext';
import { getFloatingBubbleButtonStyle } from '../ui/floatingBubbleStyles';

interface SnakeBubbleProps {
  currentUser: any;
}

const SnakeBubble: React.FC<SnakeBubbleProps> = ({ currentUser }) => {
  const [position, setPosition] = React.useState({ x: 400, y: 300 });
  const [isDragging, setIsDragging] = React.useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = () => {
    // TODO: Open Snake game modal
    alert('Snake Game - Coming soon!');
  };

  return (
    <button
      style={getFloatingBubbleButtonStyle(position, isDragging)}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title="Snake Game"
    >
      🐍
    </button>
  );
};

export default SnakeBubble;
