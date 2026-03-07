import React from 'react';
import { useUser } from '../../context/UserContext';
import { useUserColors } from '../../hooks/useUserColors';
import { getFloatingBubbleButtonStyle } from '../ui/floatingBubbleStyles';

interface UserAvatarBubbleProps {
  user: 'Aaron' | 'Electra';
  position: { x: number; y: number };
}

const UserAvatarBubble: React.FC<UserAvatarBubbleProps> = ({ user, position }) => {
  const { currentUser, setCurrentUser } = useUser();
  const userColors = useUserColors(user);
  const [isDragging, setIsDragging] = React.useState(false);
  const [bubblePosition, setBubblePosition] = React.useState(position);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX - bubblePosition.x;
    const startY = e.clientY - bubblePosition.y;

    const handleMouseMove = (e: MouseEvent) => {
      setBubblePosition({
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
    setCurrentUser(user);
  };

  const getAvatarStyle = () => {
    const baseStyle = getFloatingBubbleButtonStyle(bubblePosition, isDragging);
    const userStyle = userColors || { primary: '#667eea', glowColor: 'rgba(102, 126, 234, 0.55)' };

    return {
      ...baseStyle,
      background: (userStyle as any).gradient || baseStyle.background,
      boxShadow: isDragging
        ? `0 8px 24px ${userStyle.glowColor}`
        : `0 4px 12px ${userStyle.glowColor}`,
      border: currentUser === user ? '3px solid white' : baseStyle.border,
      transform: isDragging ? 'scale(0.95)' : currentUser === user ? 'scale(1.1)' : 'scale(1)',
      zIndex: currentUser === user ? 1001 : 1000,
    };
  };

  return (
    <button
      style={getAvatarStyle()}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title={`${user} ${currentUser === user ? '(Active)' : '(Click to select)'}`}
    >
      <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{user === 'Aaron' ? '👨‍💻' : '👩‍🎨'}</span>
    </button>
  );
};

export default UserAvatarBubble;
