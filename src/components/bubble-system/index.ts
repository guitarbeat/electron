// Bubble System - Main exports
export { default as BubbleLayer } from './core/BubbleLayer';
export { BaseBubble } from './core/BaseBubble';
export { default as GelBubbleAvatar } from './components/GelBubbleAvatar';
export { useBubbleDocking } from './hooks/useBubbleDocking';
export { useBubbleDismiss, BubbleDismissProvider } from './context/BubbleDismissContext';

// Tools and configuration
export { BUBBLE_TOOLS, getToolConfig, getVisibleTools } from './tools/bubbleTools';

// Types and utilities
export type { BubbleToolId } from './types/bubbleLayout';
export type { BaseBubbleProps, BubbleToolConfig } from './tools/bubbleTools';
