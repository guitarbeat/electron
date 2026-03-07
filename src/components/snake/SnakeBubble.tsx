import React from 'react';
import DraggableFeatureBubble from '@/common/DraggableFeatureBubble';

interface SnakeBubbleProps {
  currentUser: unknown;
}

const SnakeBubble: React.FC<SnakeBubbleProps> = () => {
  return (
    <DraggableFeatureBubble
      title="Snake Game"
      icon="🐍"
      message="Snake game coming soon."
      initialPosition={{ x: 400, y: 300 }}
    />
  );
};

export default SnakeBubble;
