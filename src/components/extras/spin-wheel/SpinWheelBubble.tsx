import React from 'react';
import { useUser } from '../../../context/UserContext';
import { getFloatingBubbleButtonStyle } from '../../ui/floatingBubbleStyles';

interface SpinWheelBubbleProps {
  currentUser: any;
}

const SpinWheelBubble: React.FC<SpinWheelBubbleProps> = ({ currentUser }) => {
  const [position, setPosition] = React.useState({ x: 600, y: 200 });
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
    // TODO: Open Spin Wheel modal
    alert('Spin Wheel - Coming soon!');
  };

  return (
    <button
      style={getFloatingBubbleButtonStyle(position, isDragging)}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title="Spin Wheel"
    >
      🎡
    </button>
  );
};

export default SpinWheelBubble;
