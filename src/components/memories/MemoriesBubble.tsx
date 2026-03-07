import React from 'react';
import DraggableFeatureBubble from '@/common/DraggableFeatureBubble';

interface MemoriesBubbleProps {
  currentUser: unknown;
}

const MemoriesBubble: React.FC<MemoriesBubbleProps> = () => {
  return (
    <DraggableFeatureBubble
      title="Memories"
      icon="💭"
      message="Memories panel coming soon."
      initialPosition={{ x: 500, y: 400 }}
    />
  );
};

export default MemoriesBubble;
