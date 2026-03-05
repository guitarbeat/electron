import { Bodies, Body, Engine, Events, World } from 'matter-js';
import type { IEventCollision } from 'matter-js';
import {
  FOOD_DROP_GRAVITY,
  FOOD_DROP_LAUNCHER_START_X,
  FOOD_DROP_LOSE_LINE_Y,
  FOOD_DROP_OVERFLOW_SETTLED_MS,
  FOOD_DROP_SIZE_VARIANCE_MAX,
  FOOD_DROP_SIZE_VARIANCE_MAX_LEVEL,
  FOOD_DROP_SIZE_VARIANCE_MIN,
  FOOD_DROP_SETTLED_ANGULAR_THRESHOLD,
  FOOD_DROP_SETTLED_SPEED_THRESHOLD,
  FOOD_DROP_SPAWN_COOLDOWN_MS,
  FOOD_DROP_SPAWN_MAX_LEVEL,
  FOOD_DROP_SPAWN_MIN_LEVEL,
  FOOD_DROP_SPAWN_Y,
  FOOD_DROP_WORLD_HEIGHT,
  FOOD_DROP_WORLD_WIDTH,
  FOOD_LEVELS,
  FoodDropStatus,
  scoreForMergeTargetLevel,
} from './foodDropConfig';

interface FoodBodyMeta {
  foodLevel: number;
  sizeScale: number;
  spawnedAtMs?: number;
}

interface MergePair {
  bodyA: Body;
  bodyB: Body;
}

export interface FoodDropSnapshot {
  score: number;
  status: FoodDropStatus;
  nextLevel: number;
  currentLevel: number;
  nextScale: number;
  currentScale: number;
  canDrop: boolean;
  launcherX: number;
}

interface RenderBody {
  x: number;
  y: number;
  radius: number;
  level: number;
  angle: number;
}

interface MergeBurst {
  x: number;
  y: number;
  ageMs: number;
  ttlMs: number;
  radius: number;
  label: string;
}

const CONTAINER_INSET_X = 10;
const CONTAINER_WIDTH = FOOD_DROP_WORLD_WIDTH - CONTAINER_INSET_X * 2;
const CONTAINER_BASE_THICKNESS = 16;
const CONTAINER_BASE_Y = FOOD_DROP_WORLD_HEIGHT - CONTAINER_BASE_THICKNESS / 2 - 2;
const CONTAINER_WALL_THICKNESS = 14;
const CONTAINER_WALL_HEIGHT = FOOD_DROP_WORLD_HEIGHT + 40;
const CONTAINER_LEFT_WALL_X = CONTAINER_INSET_X + CONTAINER_WALL_THICKNESS / 2;
const CONTAINER_RIGHT_WALL_X = FOOD_DROP_WORLD_WIDTH - CONTAINER_INSET_X - CONTAINER_WALL_THICKNESS / 2;
const CONTAINER_WALL_CENTER_Y = FOOD_DROP_WORLD_HEIGHT / 2 + 20;
const CONTAINER_FLOOR_TOP_Y = CONTAINER_BASE_Y - CONTAINER_BASE_THICKNESS / 2;
const CONTAINER_INNER_LEFT_X = CONTAINER_LEFT_WALL_X + CONTAINER_WALL_THICKNESS / 2;
const CONTAINER_INNER_RIGHT_X = CONTAINER_RIGHT_WALL_X - CONTAINER_WALL_THICKNESS / 2;
const GAME_OVER_GRACE_MS = 1200;
const SPAWN_LEVEL_WEIGHTS = [34, 28, 20, 12, 6];
const FRUIT_COLORS = [
  '#ff6b6b',
  '#ff8fab',
  '#ffa94d',
  '#b8f28e',
  '#85dcb8',
  '#74c0fc',
  '#cba6f7',
  '#ffd166',
  '#f78fb3',
  '#f06595',
];
const FRUIT_SPRITE_NAMES = [
  'blueberry',
  'grape',
  'lemon',
  'orange',
  'apple',
  'dragonfruit',
  'pear',
  'peach',
  'pineapple',
  'honeydew',
  'watermelon',
];

export class FoodDropEngine {
  private static fruitSprites: Array<HTMLImageElement | null> = FRUIT_SPRITE_NAMES.map((name) => {
    if (typeof Image === 'undefined') return null;
    const sprite = new Image();
    sprite.src = `/food-drop/fruits/${name}.svg`;
    return sprite;
  });

  private engine: Engine;

  private world: World;

  private score = 0;

  private status: FoodDropStatus = 'running';

  private launcherX = FOOD_DROP_LAUNCHER_START_X;

  private canDrop = true;

  private cooldownRemainingMs = 0;

  private overflowSettledMs = 0;

  private pendingMergePairs: Map<string, MergePair> = new Map();

  private currentLevel!: number;

  private nextLevel!: number;

  private currentScale!: number;

  private nextScale!: number;

  private mergeBursts: MergeBurst[] = [];

  private readonly queueMergePairs = (event: IEventCollision<Engine>) => {
    event.pairs.forEach((pair) => {
      if (!FoodDropEngine.canBodiesMerge(pair.bodyA, pair.bodyB)) {
        return;
      }
      const key = FoodDropEngine.mergePairKey(pair.bodyA, pair.bodyB);
      this.pendingMergePairs.set(key, { bodyA: pair.bodyA, bodyB: pair.bodyB });
    });
  };

  constructor() {
    this.engine = Engine.create({
      gravity: { x: 0, y: FOOD_DROP_GRAVITY },
      enableSleeping: false,
    });
    this.world = this.engine.world;

    this.initializeSpawnQueue();

    this.setupBoundaries();
    this.bindCollisionEvents();
  }

  destroy() {
    Events.off(this.engine, 'collisionStart', this.queueMergePairs);
    Events.off(this.engine, 'collisionActive', this.queueMergePairs);
    World.clear(this.world, false);
    Engine.clear(this.engine);
  }

  restart() {
    World.clear(this.world, false);
    this.setupBoundaries();

    this.score = 0;
    this.status = 'running';
    this.launcherX = FOOD_DROP_LAUNCHER_START_X;
    this.canDrop = true;
    this.cooldownRemainingMs = 0;
    this.overflowSettledMs = 0;
    this.pendingMergePairs.clear();
    this.initializeSpawnQueue();
    this.mergeBursts = [];
    this.clampLauncherToCurrentLevel();
  }

  setStatus(nextStatus: FoodDropStatus) {
    this.status = nextStatus;
  }

  getSnapshot(): FoodDropSnapshot {
    return {
      score: this.score,
      status: this.status,
      nextLevel: this.nextLevel,
      currentLevel: this.currentLevel,
      nextScale: this.nextScale,
      currentScale: this.currentScale,
      canDrop: this.canDrop && this.status === 'running',
      launcherX: this.launcherX,
    };
  }

  setLauncherX(targetX: number) {
    const radius = FOOD_LEVELS[this.currentLevel].radius * this.currentScale;
    const minX = FoodDropEngine.minLauncherX(radius);
    const maxX = FoodDropEngine.maxLauncherX(radius);
    this.launcherX = Math.min(Math.max(targetX, minX), maxX);
  }

  nudgeLauncher(deltaX: number) {
    this.setLauncherX(this.launcherX + deltaX);
  }

  dropCurrentFruit(): boolean {
    if (this.status !== 'running' || !this.canDrop) {
      return false;
    }

    const body = FoodDropEngine.createFoodBody(
      this.currentLevel,
      this.launcherX,
      FOOD_DROP_SPAWN_Y,
      this.currentScale
    );
    World.add(this.world, body);

    this.canDrop = false;
    this.cooldownRemainingMs = FOOD_DROP_SPAWN_COOLDOWN_MS;
    this.advanceSpawnQueue();
    this.clampLauncherToCurrentLevel();

    return true;
  }

  step(deltaMs: number) {
    if (this.status !== 'running') return;

    if (!this.canDrop) {
      this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - deltaMs);
      if (this.cooldownRemainingMs <= 0) {
        this.canDrop = true;
      }
    }
    Engine.update(this.engine, deltaMs);

    this.processPendingMerges();
    this.updateMergeBursts(deltaMs);
    this.updateOverflowState(deltaMs);
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT);

    const bg = ctx.createLinearGradient(0, 0, 0, FOOD_DROP_WORLD_HEIGHT);
    bg.addColorStop(0, '#f4e4c8');
    bg.addColorStop(1, '#ecd9b4');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT);

    const isDangerActive = this.isDangerActive();
    this.renderBoardDecor(ctx, isDangerActive);

    this.renderContainer(ctx);

    ctx.save();
    ctx.setLineDash([6, 6]);
    const pulse = 0.45 + 0.25 * Math.sin(Date.now() * 0.008);
    ctx.strokeStyle = isDangerActive ? `rgba(220, 38, 38, ${pulse})` : 'rgba(229, 57, 53, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, FOOD_DROP_LOSE_LINE_Y);
    ctx.lineTo(FOOD_DROP_WORLD_WIDTH, FOOD_DROP_LOSE_LINE_Y);
    ctx.stroke();
    ctx.restore();

    const radius = FOOD_LEVELS[this.currentLevel]?.radius * this.currentScale;
    if (!Number.isFinite(radius) || radius <= 0) return;
    const launcherY = FOOD_DROP_SPAWN_Y;

    this.renderDropBeam(ctx, launcherY);

    FoodDropEngine.drawFoodCircle(ctx, {
      x: this.launcherX,
      y: launcherY,
      radius,
      level: this.currentLevel,
      angle: 0,
    });

    ctx.save();
    const launcherAura = ctx.createRadialGradient(
      this.launcherX,
      launcherY,
      radius * 0.35,
      this.launcherX,
      launcherY,
      radius * 1.85
    );
    launcherAura.addColorStop(0, 'rgba(252, 211, 77, 0.28)');
    launcherAura.addColorStop(1, 'rgba(252, 211, 77, 0)');
    ctx.fillStyle = launcherAura;
    ctx.beginPath();
    ctx.arc(this.launcherX, launcherY, radius * 1.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.getRenderableBodies().forEach((body) => {
      FoodDropEngine.drawFoodCircle(ctx, body);
    });
    this.renderMergeBursts(ctx);

    if (this.status === 'paused') {
      ctx.fillStyle = 'rgba(80, 55, 25, 0.35)';
      ctx.fillRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT);
      ctx.fillStyle = '#4a2f19';
      ctx.font = 'bold 28px "Trebuchet MS", system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Paused', FOOD_DROP_WORLD_WIDTH / 2, FOOD_DROP_WORLD_HEIGHT / 2);
    }

    if (this.status === 'game-over') {
      ctx.fillStyle = 'rgba(120, 24, 24, 0.34)';
      ctx.fillRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT);
      ctx.fillStyle = '#7f1d1d';
      ctx.font = 'bold 28px "Trebuchet MS", system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', FOOD_DROP_WORLD_WIDTH / 2, FOOD_DROP_WORLD_HEIGHT / 2 - 8);
    }
  }

  private renderBoardDecor(ctx: CanvasRenderingContext2D, isDangerActive: boolean) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.fillRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_LOSE_LINE_Y);

    ctx.strokeStyle = 'rgba(121, 85, 72, 0.22)';
    ctx.lineWidth = 1;
    for (let x = -FOOD_DROP_LOSE_LINE_Y; x < FOOD_DROP_WORLD_WIDTH + FOOD_DROP_LOSE_LINE_Y; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + FOOD_DROP_LOSE_LINE_Y, FOOD_DROP_LOSE_LINE_Y);
      ctx.stroke();
    }
    if (isDangerActive) {
      const dangerGlow = ctx.createLinearGradient(0, 0, 0, FOOD_DROP_LOSE_LINE_Y + 52);
      const alpha = 0.08 + 0.06 * Math.sin(Date.now() * 0.006);
      dangerGlow.addColorStop(0, `rgba(239, 68, 68, ${Math.max(0.02, alpha)})`);
      dangerGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = dangerGlow;
      ctx.fillRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_LOSE_LINE_Y + 52);
    }
    ctx.restore();
  }

  private renderDropBeam(ctx: CanvasRenderingContext2D, launcherY: number) {
    const beamTop = Math.max(6, launcherY - 95);
    const beam = ctx.createLinearGradient(this.launcherX, beamTop, this.launcherX, launcherY + 6);
    beam.addColorStop(0, 'rgba(255, 255, 255, 0)');
    beam.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    beam.addColorStop(1, 'rgba(255, 180, 60, 0)');

    ctx.save();
    ctx.fillStyle = beam;
    ctx.fillRect(this.launcherX - 16, beamTop, 32, launcherY + 6 - beamTop);
    ctx.restore();
  }

  private renderContainer(ctx: CanvasRenderingContext2D) {
    const floorTopY = CONTAINER_FLOOR_TOP_Y;
    const wallTopY = floorTopY - CONTAINER_WALL_HEIGHT + CONTAINER_BASE_THICKNESS / 2;

    ctx.save();
    ctx.fillStyle = '#c68642';
    ctx.fillRect(CONTAINER_INSET_X, floorTopY, CONTAINER_WIDTH, CONTAINER_BASE_THICKNESS);
    ctx.fillRect(
      CONTAINER_LEFT_WALL_X - CONTAINER_WALL_THICKNESS / 2,
      wallTopY,
      CONTAINER_WALL_THICKNESS,
      CONTAINER_WALL_HEIGHT
    );
    ctx.fillRect(
      CONTAINER_RIGHT_WALL_X - CONTAINER_WALL_THICKNESS / 2,
      wallTopY,
      CONTAINER_WALL_THICKNESS,
      CONTAINER_WALL_HEIGHT
    );

    ctx.strokeStyle = '#7a4a1f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(CONTAINER_INSET_X - 1, floorTopY + 1);
    ctx.lineTo(CONTAINER_INSET_X + CONTAINER_WIDTH + 1, floorTopY + 1);
    ctx.moveTo(CONTAINER_INSET_X, floorTopY + CONTAINER_BASE_THICKNESS - 1);
    ctx.lineTo(CONTAINER_INSET_X + CONTAINER_WIDTH, floorTopY + CONTAINER_BASE_THICKNESS - 1);
    ctx.moveTo(CONTAINER_INSET_X + 1, wallTopY);
    ctx.lineTo(CONTAINER_INSET_X + 1, floorTopY + CONTAINER_BASE_THICKNESS);
    ctx.moveTo(CONTAINER_INSET_X + CONTAINER_WIDTH - 1, wallTopY);
    ctx.lineTo(CONTAINER_INSET_X + CONTAINER_WIDTH - 1, floorTopY + CONTAINER_BASE_THICKNESS);
    ctx.stroke();
    ctx.restore();
  }

  private setupBoundaries() {
    const containerBase = Bodies.rectangle(
      FOOD_DROP_WORLD_WIDTH / 2,
      CONTAINER_BASE_Y,
      CONTAINER_WIDTH,
      CONTAINER_BASE_THICKNESS,
      { isStatic: true, restitution: 0.12, friction: 0.08, label: 'container-base' }
    );

    const containerLeftWall = Bodies.rectangle(
      CONTAINER_LEFT_WALL_X,
      CONTAINER_WALL_CENTER_Y,
      CONTAINER_WALL_THICKNESS,
      CONTAINER_WALL_HEIGHT,
      { isStatic: true, restitution: 0.14, friction: 0.1, label: 'container-left-wall' }
    );

    const containerRightWall = Bodies.rectangle(
      CONTAINER_RIGHT_WALL_X,
      CONTAINER_WALL_CENTER_Y,
      CONTAINER_WALL_THICKNESS,
      CONTAINER_WALL_HEIGHT,
      { isStatic: true, restitution: 0.14, friction: 0.1, label: 'container-right-wall' }
    );

    World.add(this.world, [containerBase, containerLeftWall, containerRightWall]);
  }

  private bindCollisionEvents() {
    // Keep merge candidates fresh both when contacts begin and while they remain in contact.
    Events.on(this.engine, 'collisionStart', this.queueMergePairs);
    Events.on(this.engine, 'collisionActive', this.queueMergePairs);
  }

  private clampLauncherToCurrentLevel() {
    this.setLauncherX(this.launcherX);
  }

  private initializeSpawnQueue() {
    this.currentLevel = FoodDropEngine.randomSpawnLevel();
    this.nextLevel = FoodDropEngine.randomSpawnLevel();
    this.currentScale = FoodDropEngine.randomSpawnScale(this.currentLevel);
    this.nextScale = FoodDropEngine.randomSpawnScale(this.nextLevel);
  }

  private advanceSpawnQueue() {
    this.currentLevel = this.nextLevel;
    this.currentScale = this.nextScale;
    this.nextLevel = FoodDropEngine.randomSpawnLevel();
    this.nextScale = FoodDropEngine.randomSpawnScale(this.nextLevel);
  }

  private static canBodiesMerge(bodyA: Body, bodyB: Body): boolean {
    if (bodyA.isStatic || bodyB.isStatic) return false;

    const levelA = FoodDropEngine.getBodyLevel(bodyA);
    const levelB = FoodDropEngine.getBodyLevel(bodyB);

    if (levelA === null || levelB === null) return false;
    if (levelA !== levelB) return false;
    if (levelA >= FOOD_LEVELS.length - 1) return false;

    return true;
  }

  private processPendingMerges() {
    if (this.pendingMergePairs.size === 0) return;

    const consumed = new Set<number>();
    const nextPairs = [...this.pendingMergePairs.values()];
    this.pendingMergePairs.clear();
    let mergeCount = 0;
    let mergeScore = 0;

    nextPairs.forEach(({ bodyA, bodyB }) => {
      if (consumed.has(bodyA.id) || consumed.has(bodyB.id)) return;
      if (!this.world.bodies.includes(bodyA) || !this.world.bodies.includes(bodyB)) return;
      if (!FoodDropEngine.canBodiesMerge(bodyA, bodyB)) return;

      const sourceLevel = FoodDropEngine.getBodyLevel(bodyA);
      if (sourceLevel === null) return;

      const targetLevel = sourceLevel + 1;
      const mergedX = (bodyA.position.x + bodyB.position.x) / 2;
      const mergedY = (bodyA.position.y + bodyB.position.y) / 2;
      const mergedVelocityX = (bodyA.velocity.x + bodyB.velocity.x) / 2;
      const mergedVelocityY = (bodyA.velocity.y + bodyB.velocity.y) / 2;
      const scaleA = FoodDropEngine.getBodyScale(bodyA);
      const scaleB = FoodDropEngine.getBodyScale(bodyB);

      consumed.add(bodyA.id);
      consumed.add(bodyB.id);
      World.remove(this.world, bodyA);
      World.remove(this.world, bodyB);

      const mergedScale = Math.max(
        FOOD_DROP_SIZE_VARIANCE_MIN,
        Math.min(
          FOOD_DROP_SIZE_VARIANCE_MAX,
          (scaleA + scaleB) / 2 + (Math.random() - 0.5) * 0.08
        )
      );
      const mergedRadius = FOOD_LEVELS[targetLevel].radius * mergedScale;
      const clampedMergedX = Math.min(
        CONTAINER_INNER_RIGHT_X - mergedRadius - 1,
        Math.max(CONTAINER_INNER_LEFT_X + mergedRadius + 1, mergedX)
      );
      const clampedMergedY = Math.min(mergedY, CONTAINER_FLOOR_TOP_Y - mergedRadius - 1);
      const mergedBody = FoodDropEngine.createFoodBody(
        targetLevel,
        clampedMergedX,
        clampedMergedY,
        mergedScale
      );
      const popImpulse = Math.min(2.2, 0.8 + targetLevel * 0.1);
      Body.setVelocity(mergedBody, { x: mergedVelocityX, y: mergedVelocityY - popImpulse });
      World.add(this.world, mergedBody);

      const points = scoreForMergeTargetLevel(targetLevel);
      mergeCount += 1;
      mergeScore += points;
      this.createMergeBurst(
        clampedMergedX,
        clampedMergedY,
        points,
        FOOD_LEVELS[targetLevel].radius * mergedScale
      );
    });

    if (mergeCount > 0) {
      this.score += mergeScore;
      if (mergeCount > 1) {
        this.createMergeBurst(
          FOOD_DROP_WORLD_WIDTH / 2,
          FOOD_DROP_LOSE_LINE_Y + 24,
          mergeCount,
          16,
          `${mergeCount}x merge`
        );
      }
    }
  }

  private updateOverflowState(deltaMs: number) {
    const now = Date.now();
    const dynamicBodies = this.getDynamicFruitBodies();

    if (dynamicBodies.length === 0) {
      this.overflowSettledMs = 0;
      return;
    }

    // Immediate fail if any fruit escapes the container side walls and drops below the danger zone.
    const hasMissedContainer = dynamicBodies.some((body) => {
      if (this.shouldSkipDangerCheck(body, now)) {
        return false;
      }
      const level = FoodDropEngine.getBodyLevel(body) ?? 0;
      const radius = FoodDropEngine.getBodyRadius(body, level);
      const isOutsideContainer = FoodDropEngine.isOutsideContainer(body, radius);
      const isBelowDangerZone = body.position.y + radius >= FOOD_DROP_LOSE_LINE_Y + 8;
      return isOutsideContainer && isBelowDangerZone;
    });

    if (hasMissedContainer) {
      this.status = 'game-over';
      this.canDrop = false;
      return;
    }

    const hasOverflow = dynamicBodies.some((body) => {
      if (this.shouldSkipDangerCheck(body, now)) {
        return false;
      }
      const bodyLevel = FoodDropEngine.getBodyLevel(body) ?? 0;
      const radius = FoodDropEngine.getBodyRadius(body, bodyLevel);
      return body.position.y - radius < FOOD_DROP_LOSE_LINE_Y;
    });

    if (!hasOverflow) {
      this.overflowSettledMs = 0;
      return;
    }

    const allSettled = dynamicBodies.every(
      (body) =>
        body.speed < FOOD_DROP_SETTLED_SPEED_THRESHOLD &&
        Math.abs(body.angularVelocity) < FOOD_DROP_SETTLED_ANGULAR_THRESHOLD
    );

    if (!allSettled) {
      this.overflowSettledMs = 0;
      return;
    }

    this.overflowSettledMs += deltaMs;
    if (this.overflowSettledMs >= FOOD_DROP_OVERFLOW_SETTLED_MS) {
      this.status = 'game-over';
      this.canDrop = false;
    }
  }

  private isDangerActive(): boolean {
    const now = Date.now();
    return this.getDynamicFruitBodies().some((body) => {
      if (this.shouldSkipDangerCheck(body, now)) return false;
      const level = FoodDropEngine.getBodyLevel(body) ?? 0;
      const radius = FoodDropEngine.getBodyRadius(body, level);
      return body.position.y - radius < FOOD_DROP_LOSE_LINE_Y + 40;
    });
  }

  private getDynamicFruitBodies(): Body[] {
    return this.world.bodies.filter(
      (body) => !body.isStatic && FoodDropEngine.getBodyLevel(body) !== null
    );
  }

  private shouldSkipDangerCheck(body: Body, nowMs: number): boolean {
    const spawnedAt = FoodDropEngine.getBodySpawnedAt(body);
    return spawnedAt !== null && nowMs - spawnedAt < GAME_OVER_GRACE_MS;
  }

  private static getBodyLevel(body: Body): number | null {
    const plugin = body.plugin as Partial<FoodBodyMeta> | undefined;
    const level = plugin?.foodLevel;
    return typeof level === 'number' ? level : null;
  }

  private static getBodyScale(body: Body): number {
    const plugin = body.plugin as Partial<FoodBodyMeta> | undefined;
    return typeof plugin?.sizeScale === 'number' ? plugin.sizeScale : 1;
  }

  private static getBodySpawnedAt(body: Body): number | null {
    const plugin = body.plugin as Partial<FoodBodyMeta> | undefined;
    return typeof plugin?.spawnedAtMs === 'number' ? plugin.spawnedAtMs : null;
  }

  private static minLauncherX(radius: number): number {
    return CONTAINER_INNER_LEFT_X + radius;
  }

  private static maxLauncherX(radius: number): number {
    return CONTAINER_INNER_RIGHT_X - radius;
  }

  private static isOutsideContainer(body: Body, radius: number): boolean {
    return (
      body.position.x + radius < CONTAINER_INNER_LEFT_X ||
      body.position.x - radius > CONTAINER_INNER_RIGHT_X
    );
  }

  private static mergePairKey(bodyA: Body, bodyB: Body): string {
    return bodyA.id < bodyB.id ? `${bodyA.id}-${bodyB.id}` : `${bodyB.id}-${bodyA.id}`;
  }

  private static getBodyRadius(body: Body, level: number): number {
    return body.circleRadius ?? FOOD_LEVELS[level].radius * FoodDropEngine.getBodyScale(body);
  }

  private static createFoodBody(level: number, x: number, y: number, sizeScale = 1): Body {
    const { radius } = FOOD_LEVELS[level];
    const normalizedLevel = FOOD_LEVELS.length > 1 ? level / (FOOD_LEVELS.length - 1) : 0;
    const restitution = Math.max(0.1, 0.24 - normalizedLevel * 0.1);
    const friction = 0.018 + normalizedLevel * 0.022;
    const frictionAir = 0.005 + normalizedLevel * 0.004;
    const density = 0.001 + normalizedLevel * 0.0009;
    const body = Bodies.circle(x, y, radius, {
      restitution,
      friction,
      frictionAir,
      density,
      label: `food-${level}`,
      slop: 0.4,
    });
    if (Math.abs(sizeScale - 1) > 0.001) {
      Body.scale(body, sizeScale, sizeScale);
    }

    body.plugin = {
      ...(body.plugin ?? {}),
      foodLevel: level,
      sizeScale,
      spawnedAtMs: Date.now(),
    };

    return body;
  }

  private getRenderableBodies(): RenderBody[] {
    return this.world.bodies
      .filter((body) => !body.isStatic)
      .map((body) => {
        const level = FoodDropEngine.getBodyLevel(body);
        if (level === null) return null;
        return {
          x: body.position.x,
          y: body.position.y,
          radius: FoodDropEngine.getBodyRadius(body, level),
          level,
          angle: body.angle,
        };
      })
      .filter((body): body is RenderBody => body !== null);
  }

  private createMergeBurst(
    x: number,
    y: number,
    points: number,
    radius: number,
    label = `+${points}`
  ) {
    this.mergeBursts.push({
      x,
      y,
      ageMs: 0,
      ttlMs: 520,
      radius,
      label,
    });
  }

  private updateMergeBursts(deltaMs: number) {
    if (this.mergeBursts.length === 0) return;
    this.mergeBursts = this.mergeBursts
      .map((burst) => ({
        ...burst,
        ageMs: burst.ageMs + deltaMs,
      }))
      .filter((burst) => burst.ageMs < burst.ttlMs);
  }

  private renderMergeBursts(ctx: CanvasRenderingContext2D) {
    if (this.mergeBursts.length === 0) return;

    this.mergeBursts.forEach((burst) => {
      const progress = burst.ageMs / burst.ttlMs;
      const alpha = 1 - progress;
      const animatedRadius = burst.radius + progress * 12;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, animatedRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#7c2d12';
      ctx.font = 'bold 14px "Trebuchet MS", system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(burst.label, burst.x, burst.y - burst.radius - progress * 18);
      ctx.restore();
    });
  }

  private static drawFoodCircle(ctx: CanvasRenderingContext2D, body: RenderBody) {
    if (!Number.isFinite(body.x) || !Number.isFinite(body.y) || !Number.isFinite(body.radius) || body.radius <= 0) {
      return;
    }
    ctx.save();
    ctx.translate(body.x, body.y);
    ctx.rotate(body.angle);

    const sprite = FoodDropEngine.fruitSprites[body.level] ?? null;
    if (sprite && sprite.complete && sprite.naturalWidth > 0 && sprite.naturalHeight > 0) {
      const size = body.radius * 2.02;
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
      return;
    }

    const fruitColor = FRUIT_COLORS[body.level % FRUIT_COLORS.length];
    const highlight = ctx.createRadialGradient(
      -body.radius * 0.35,
      -body.radius * 0.4,
      2,
      0,
      0,
      body.radius * 1.1
    );
    highlight.addColorStop(0, 'rgba(255,255,255,0.55)');
    highlight.addColorStop(0.35, fruitColor);
    highlight.addColorStop(1, fruitColor);

    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#472a14';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    const leafW = Math.max(5, body.radius * 0.48);
    const leafH = Math.max(4, body.radius * 0.32);
    ctx.save();
    ctx.translate(0, -body.radius * 0.82);
    ctx.rotate(-0.35);
    ctx.fillStyle = '#5aa449';
    ctx.beginPath();
    ctx.ellipse(0, 0, leafW, leafH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#365f2a';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    const eyeY = -body.radius * 0.1;
    const eyeDx = body.radius * 0.28;
    const eyeR = Math.max(1.8, body.radius * 0.12);
    ctx.fillStyle = '#2a1a12';
    ctx.beginPath();
    ctx.arc(-eyeDx, eyeY, eyeR, 0, Math.PI * 2);
    ctx.arc(eyeDx, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(-eyeDx - eyeR * 0.2, eyeY - eyeR * 0.2, eyeR * 0.4, 0, Math.PI * 2);
    ctx.arc(eyeDx - eyeR * 0.2, eyeY - eyeR * 0.2, eyeR * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2a1a12';
    ctx.lineWidth = Math.max(1.2, body.radius * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, body.radius * 0.12, body.radius * 0.35, 0.15, Math.PI - 0.15);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 120, 140, 0.45)';
    ctx.beginPath();
    ctx.arc(-body.radius * 0.46, body.radius * 0.08, body.radius * 0.12, 0, Math.PI * 2);
    ctx.arc(body.radius * 0.46, body.radius * 0.08, body.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static randomSpawnLevel() {
    const maxIndex = FOOD_DROP_SPAWN_MAX_LEVEL - FOOD_DROP_SPAWN_MIN_LEVEL;
    const weights = SPAWN_LEVEL_WEIGHTS.slice(0, maxIndex + 1);
    const total = weights.reduce((sum, value) => sum + value, 0);
    let random = Math.random() * total;
    for (let i = 0; i < weights.length; i += 1) {
      random -= weights[i];
      if (random <= 0) {
        return FOOD_DROP_SPAWN_MIN_LEVEL + i;
      }
    }
    return FOOD_DROP_SPAWN_MIN_LEVEL;
  }

  private static randomSpawnScale(level: number): number {
    const normalized = Math.min(1, Math.max(0, level / FOOD_DROP_SIZE_VARIANCE_MAX_LEVEL));
    const levelVariance = 1 - normalized * 0.55;
    const min = 1 - (1 - FOOD_DROP_SIZE_VARIANCE_MIN) * levelVariance;
    const max = 1 + (FOOD_DROP_SIZE_VARIANCE_MAX - 1) * levelVariance;
    return min + Math.random() * (max - min);
  }
}
