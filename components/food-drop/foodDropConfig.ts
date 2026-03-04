export type FoodDropStatus = 'running' | 'paused' | 'game-over';

export interface FoodLevelConfig {
  emoji: string;
  radius: number;
}

export const FOOD_DROP_WORLD_WIDTH = 340;
export const FOOD_DROP_WORLD_HEIGHT = 520;
export const FOOD_DROP_WALL_THICKNESS = 20;
export const FOOD_DROP_LOSE_LINE_Y = 92;
export const FOOD_DROP_GRAVITY = 1.0;

export const FOOD_DROP_SETTLED_SPEED_THRESHOLD = 0.15;
export const FOOD_DROP_SETTLED_ANGULAR_THRESHOLD = 0.05;
export const FOOD_DROP_OVERFLOW_SETTLED_MS = 1000;
export const FOOD_DROP_SPAWN_COOLDOWN_MS = 350;

export const FOOD_DROP_SPAWN_MIN_LEVEL = 0;
export const FOOD_DROP_SPAWN_MAX_LEVEL = 4;

export const FOOD_LEVELS: FoodLevelConfig[] = [
  { emoji: '🍒', radius: 12 },
  { emoji: '🍓', radius: 14 },
  { emoji: '🍇', radius: 16 },
  { emoji: '🍊', radius: 18 },
  { emoji: '🍎', radius: 20 },
  { emoji: '🍐', radius: 22 },
  { emoji: '🍑', radius: 24 },
  { emoji: '🍍', radius: 26 },
  { emoji: '🍈', radius: 30 },
  { emoji: '🍉', radius: 34 },
];

export const FOOD_DROP_LAUNCHER_START_X = FOOD_DROP_WORLD_WIDTH / 2;
export const FOOD_DROP_SPAWN_Y = 48;

export function scoreForMergeTargetLevel(targetLevel: number): number {
  return (targetLevel + 1) * 10;
}
