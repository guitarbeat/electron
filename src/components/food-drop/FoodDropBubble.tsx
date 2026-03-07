import React from 'react';
import DraggableFeatureBubble from '@/common/DraggableFeatureBubble';

interface FoodDropBubbleProps {
  currentUser: unknown;
}

const FoodDropBubble: React.FC<FoodDropBubbleProps> = () => {
  return (
    <DraggableFeatureBubble
      title="Food Drop Game"
      icon="🍔"
      message="Food Drop game coming soon."
      initialPosition={{ x: 300, y: 200 }}
    />
  );
};

export default FoodDropBubble;
