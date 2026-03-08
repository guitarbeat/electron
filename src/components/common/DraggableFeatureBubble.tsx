import React from 'react';
import { useFloatingBubbleDrag } from '@/hooks/useFloatingBubbleDrag';
import { useToast } from '@/context/ToastContext';
import { getFloatingBubbleButtonStyle } from '@/ui/floatingBubbleStyles';

interface DraggableFeatureBubbleProps {
  icon: string;
  title: string;
  message?: string;
  initialPosition: { x: number; y: number };
  onActivate?: () => void;
}

const DraggableFeatureBubble: React.FC<DraggableFeatureBubbleProps> = ({
  icon,
  title,
  message,
  initialPosition,
  onActivate,
}) => {
  const { showToast } = useToast();
  const { position, isDragging, bubbleProps } = useFloatingBubbleDrag({
    initialPosition,
    snapToEdge: true,
    onClick: () => {
      if (onActivate) {
        onActivate();
        return;
      }
      showToast({
        message: message || `${title} is ready.`,
        type: 'info',
        duration: 2500,
      });
    },
  });

  return (
    <button
      style={getFloatingBubbleButtonStyle(position, isDragging)}
      {...bubbleProps}
      title={title}
      aria-label={title}
      type="button"
    >
      {icon}
    </button>
  );
};

export default DraggableFeatureBubble;
