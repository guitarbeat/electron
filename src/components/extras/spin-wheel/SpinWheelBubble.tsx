import React from 'react';
import DraggableFeatureBubble from '@/common/DraggableFeatureBubble';

interface SpinWheelBubbleProps {
  currentUser: unknown;
}

const SpinWheelBubble: React.FC<SpinWheelBubbleProps> = () => {
  return (
    <DraggableFeatureBubble
      title="Spin Wheel"
      icon="🎡"
      message="Spin wheel coming soon."
      initialPosition={{ x: 600, y: 200 }}
    />
  );
};

export default SpinWheelBubble;
