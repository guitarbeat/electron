import React from 'react';
import { useUser } from '../../context/UserContext';
import { getFloatingBubbleButtonStyle } from '../ui/floatingBubbleStyles';

interface MemoriesBubbleProps {
  currentUser: any;
}

const MemoriesBubble: React.FC<MemoriesBubbleProps> = ({ currentUser }) => {
  const [position, setPosition] = React.useState({ x: 500, y: 400 });
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
    // TODO: Open Memories modal
    alert('Memories - Coming soon!');
  };

  return (
    <button
      style={getFloatingBubbleButtonStyle(position, isDragging)}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title="Memories"
    >
      💭
    </button>
  );
};

export default MemoriesBubble;
