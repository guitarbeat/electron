export const FLOATING_BUBBLE_SIZE = 60;
export const FLOATING_BUBBLE_EDGE_MARGIN = 16;
export const FLOATING_DRAG_THRESHOLD = 5;

export const clampFloatingBubblePosition = (x: number, y: number) => {
  if (typeof window === 'undefined') return { x, y };

  const maxX = window.innerWidth - FLOATING_BUBBLE_SIZE - FLOATING_BUBBLE_EDGE_MARGIN;
  const maxY = window.innerHeight - FLOATING_BUBBLE_SIZE - FLOATING_BUBBLE_EDGE_MARGIN;

  return {
    x: Math.max(FLOATING_BUBBLE_EDGE_MARGIN, Math.min(x, maxX)),
    y: Math.max(FLOATING_BUBBLE_EDGE_MARGIN, Math.min(y, maxY)),
  };
};

export const getFloatingBubbleButtonStyle = (
  position: { x: number; y: number },
  isDragging: boolean
) => ({
  position: 'fixed' as const,
  left: position.x,
  top: position.y,
  width: FLOATING_BUBBLE_SIZE,
  height: FLOATING_BUBBLE_SIZE,
  borderRadius: '50%',
  border: 'none',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  fontSize: '20px',
  cursor: isDragging ? 'grabbing' : 'grab',
  transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
  boxShadow: isDragging ? '0 8px 24px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  transform: isDragging ? 'scale(0.95)' : 'scale(1)',
});
