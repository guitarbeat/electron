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

interface BubbleButtonStyleOptions {
  position: { x: number; y: number };
  isDragging: boolean;
  background?: string;
  color?: string;
  fontSize?: string | number;
}

export function getFloatingBubbleButtonStyle(options: BubbleButtonStyleOptions): any;
export function getFloatingBubbleButtonStyle(
  position: { x: number; y: number },
  isDragging: boolean
): any;
export function getFloatingBubbleButtonStyle(
  arg1: BubbleButtonStyleOptions | { x: number; y: number },
  arg2?: boolean
): any {
  let position: { x: number; y: number };
  let isDragging: boolean;
  let background: string | undefined;
  let color: string | undefined;
  let fontSize: string | number | undefined;

  if ('position' in arg1) {
    position = arg1.position;
    isDragging = arg1.isDragging;
    background = arg1.background;
    color = arg1.color;
    fontSize = arg1.fontSize;
  } else {
    position = arg1;
    isDragging = arg2 || false;
  }
  return {
    position: 'fixed' as const,
    left: position.x,
    top: position.y,
    width: FLOATING_BUBBLE_SIZE,
    height: FLOATING_BUBBLE_SIZE,
    borderRadius: '50%',
    border: 'none',
    background: background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: color || 'white',
    fontSize: fontSize || '20px',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: isDragging ? '0 8px 24px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    transform: isDragging ? 'scale(0.95)' : 'scale(1)',
  };
}

interface ContainerStyleOptions {
  isEmbedded?: boolean;
  isViewportExpanded?: boolean;
  isMobile?: boolean;
  desktopWidth?: string;
  zIndex?: number;
}

export const getFloatingContainerStyle = (options: ContainerStyleOptions = {}) => {
  const { isEmbedded, zIndex } = options;
  return {
    position: (isEmbedded ? 'relative' : 'fixed') as any,
    inset: isEmbedded ? 'auto' : 0,
    pointerEvents: (isEmbedded ? 'auto' : 'none') as any,
    zIndex: zIndex || 999,
  };
};

interface PanelCardStyleOptions {
  isViewportExpanded?: boolean;
  isMobile?: boolean;
  maxHeight?: string;
  background?: string;
  shadow?: string;
}

export const getFloatingPanelCardStyle = (options: PanelCardStyleOptions = {}) => {
  const { isViewportExpanded, isMobile, maxHeight, background, shadow } = options;
  return {
    position: (isMobile && isViewportExpanded ? 'fixed' : 'absolute') as any,
    bottom: isMobile ? 0 : '80px',
    right: isMobile ? 0 : '20px',
    width: isMobile ? '100%' : '380px',
    maxHeight: maxHeight || (isMobile ? '80vh' : '600px'),
    zIndex: 1001,
    pointerEvents: 'auto' as const,
    background: background || undefined,
    boxShadow: shadow || undefined,
  };
};

export const getFloatingBubbleBadgeStyle = () => ({
  position: 'absolute' as const,
  top: -4,
  right: -4,
  background: '#ef4444',
  color: 'white',
  borderRadius: 'full',
  minWidth: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
  fontWeight: 'bold',
  padding: '0 4px',
  border: '2px solid white',
});
