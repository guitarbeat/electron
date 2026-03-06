export type BubbleToolId = 'messages' | 'spin' | 'snake' | 'foodDrop' | 'quiz' | 'matchmaker';

export type BubbleViewportBucket = 'mobile' | 'desktop';

export interface BubbleToolConfig {
  id: BubbleToolId;
  label: string;
  emoji: string;
}

export interface BubblePosition {
  x: number;
  y: number;
}

export interface PositionPersistence {
  mobile: Partial<Record<BubbleToolId, BubblePosition>>;
  desktop: Partial<Record<BubbleToolId, BubblePosition>>;
}
