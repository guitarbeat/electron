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
export const FOOD_DROP_SPAWN_COOLDOWN_MS = 500;

export const FOOD_DROP_SIZE_VARIANCE_MIN = 1;
export const FOOD_DROP_SIZE_VARIANCE_MAX = 1;
export const FOOD_DROP_SIZE_VARIANCE_MAX_LEVEL = 0;

export const FOOD_DROP_SPAWN_MIN_LEVEL = 0;
export const FOOD_DROP_SPAWN_MAX_LEVEL = 4;

export const FOOD_LEVELS: FoodLevelConfig[] = [
  // Ratios matched to Suika/Subak sizing and scaled from 600px board to 340px board.
  { emoji: '\u{1FAD0}', radius: 11.5 }, // blueberry
  { emoji: '\u{1F347}', radius: 15.1 }, // grape
  { emoji: '\u{1F34B}', radius: 19.6 }, // lemon
  { emoji: '\u{1F34A}', radius: 24.5 }, // orange
  { emoji: '\u{1F34E}', radius: 32.4 }, // apple
  { emoji: '\u{1F409}', radius: 40.0 }, // dragonfruit
  { emoji: '\u{1F350}', radius: 48.2 }, // pear
  { emoji: '\u{1F351}', radius: 59.4 }, // peach
  { emoji: '\u{1F34D}', radius: 66.9 }, // pineapple
  { emoji: '\u{1F348}', radius: 82.6 }, // honeydew
  { emoji: '\u{1F349}', radius: 98.3 }, // watermelon
];

export const FOOD_DROP_LAUNCHER_START_X = FOOD_DROP_WORLD_WIDTH / 2;
export const FOOD_DROP_SPAWN_Y = 44;

export function scoreForMergeTargetLevel(targetLevel: number): number {
  return (targetLevel + 1) * 10;
}
