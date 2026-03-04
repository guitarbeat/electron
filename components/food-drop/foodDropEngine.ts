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
  FOOD_DROP_WALL_THICKNESS,
  FOOD_DROP_WORLD_HEIGHT,
  FOOD_DROP_WORLD_WIDTH,
  FOOD_LEVELS,
  FoodDropStatus,
  scoreForMergeTargetLevel,
} from './foodDropConfig';

interface FoodBodyMeta {
  foodLevel: number;
  sizeScale: number;
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

const FLOOR_Y = FOOD_DROP_WORLD_HEIGHT + FOOD_DROP_WALL_THICKNESS / 2;
const LEFT_WALL_X = -FOOD_DROP_WALL_THICKNESS / 2;
const RIGHT_WALL_X = FOOD_DROP_WORLD_WIDTH + FOOD_DROP_WALL_THICKNESS / 2;
const BASKET_INSET_X = 26;
const BASKET_WIDTH = FOOD_DROP_WORLD_WIDTH - BASKET_INSET_X * 2;
const BASKET_BASE_THICKNESS = 12;
const BASKET_BASE_Y = FOOD_DROP_WORLD_HEIGHT - BASKET_BASE_THICKNESS / 2 - 6;
const BASKET_WALL_THICKNESS = 12;
const BASKET_WALL_HEIGHT = 82;
const BASKET_LEFT_WALL_X = BASKET_INSET_X + BASKET_WALL_THICKNESS / 2;
const BASKET_RIGHT_WALL_X = FOOD_DROP_WORLD_WIDTH - BASKET_INSET_X - BASKET_WALL_THICKNESS / 2;
const BASKET_WALL_CENTER_Y = BASKET_BASE_Y - BASKET_WALL_HEIGHT / 2;
const BASKET_TOP_Y = BASKET_BASE_Y - BASKET_BASE_THICKNESS / 2;
const BASKET_INNER_LEFT_X = BASKET_LEFT_WALL_X + BASKET_WALL_THICKNESS / 2;
const BASKET_INNER_RIGHT_X = BASKET_RIGHT_WALL_X - BASKET_WALL_THICKNESS / 2;

export class FoodDropEngine {
  private engine: Engine;

  private world: World;

  private score = 0;

  private status: FoodDropStatus = 'running';

  private launcherX = FOOD_DROP_LAUNCHER_START_X;

  private canDrop = true;

  private cooldownRemainingMs = 0;

  private overflowSettledMs = 0;

  private pendingMergePairs: Map<string, MergePair> = new Map();

  private currentLevel: number;

  private nextLevel: number;

  private currentScale: number;

  private nextScale: number;

  private mergeBursts: MergeBurst[] = [];

  private readonly queueMergePairs = (event: IEventCollision<Engine>) => {
    event.pairs.forEach((pair) => {
      if (!FoodDropEngine.canBodiesMerge(pair.bodyA, pair.bodyB)) {
        return;
      }
      const key =
        pair.bodyA.id < pair.bodyB.id
          ? `${pair.bodyA.id}-${pair.bodyB.id}`
          : `${pair.bodyB.id}-${pair.bodyA.id}`;
      this.pendingMergePairs.set(key, { bodyA: pair.bodyA, bodyB: pair.bodyB });
    });
  };

  constructor() {
    this.engine = Engine.create({
      gravity: { x: 0, y: FOOD_DROP_GRAVITY },
      enableSleeping: false,
    });
    this.world = this.engine.world;

    this.currentLevel = FoodDropEngine.randomSpawnLevel();
    this.nextLevel = FoodDropEngine.randomSpawnLevel();
    this.currentScale = FoodDropEngine.randomSpawnScale(this.currentLevel);
    this.nextScale = FoodDropEngine.randomSpawnScale(this.nextLevel);

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
    this.currentLevel = FoodDropEngine.randomSpawnLevel();
    this.nextLevel = FoodDropEngine.randomSpawnLevel();
    this.currentScale = FoodDropEngine.randomSpawnScale(this.currentLevel);
    this.nextScale = FoodDropEngine.randomSpawnScale(this.nextLevel);
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
    const minX = FOOD_DROP_WALL_THICKNESS + radius;
    const maxX = FOOD_DROP_WORLD_WIDTH - FOOD_DROP_WALL_THICKNESS - radius;
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
    this.currentLevel = this.nextLevel;
    this.currentScale = this.nextScale;
    this.nextLevel = FoodDropEngine.randomSpawnLevel();
    this.nextScale = FoodDropEngine.randomSpawnScale(this.nextLevel);
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

    const gradient = ctx.createLinearGradient(0, 0, 0, FOOD_DROP_WORLD_HEIGHT);
    gradient.addColorStop(0, '#111827');
    gradient.addColorStop(0.45, '#1f2937');
    gradient.addColorStop(1, '#0b1020');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT);

    const glow = ctx.createRadialGradient(
      FOOD_DROP_WORLD_WIDTH * 0.2,
      FOOD_DROP_WORLD_HEIGHT * 0.08,
      10,
      FOOD_DROP_WORLD_WIDTH * 0.2,
      FOOD_DROP_WORLD_HEIGHT * 0.08,
      FOOD_DROP_WORLD_WIDTH * 0.75
    );
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
    glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT);

    this.renderBasket(ctx);

    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, FOOD_DROP_LOSE_LINE_Y);
    ctx.lineTo(FOOD_DROP_WORLD_WIDTH, FOOD_DROP_LOSE_LINE_Y);
    ctx.stroke();
    ctx.restore();

    const radius = FOOD_LEVELS[this.currentLevel].radius * this.currentScale;
    const launcherY = FOOD_DROP_SPAWN_Y;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(this.launcherX, launcherY);
    ctx.lineTo(this.launcherX, FOOD_DROP_WORLD_HEIGHT - 12);
    ctx.stroke();
    ctx.restore();

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
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Paused', FOOD_DROP_WORLD_WIDTH / 2, FOOD_DROP_WORLD_HEIGHT / 2);
    }

    if (this.status === 'game-over') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT);
      ctx.fillStyle = '#fecaca';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', FOOD_DROP_WORLD_WIDTH / 2, FOOD_DROP_WORLD_HEIGHT / 2 - 8);
    }

    ctx.save();
    const vignette = ctx.createRadialGradient(
      FOOD_DROP_WORLD_WIDTH / 2,
      FOOD_DROP_WORLD_HEIGHT / 2,
      FOOD_DROP_WORLD_WIDTH * 0.2,
      FOOD_DROP_WORLD_WIDTH / 2,
      FOOD_DROP_WORLD_HEIGHT / 2,
      FOOD_DROP_WORLD_WIDTH * 0.9
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT);
    ctx.restore();
  }

  private renderBasket(ctx: CanvasRenderingContext2D) {
    const basketTopY = BASKET_BASE_Y - BASKET_BASE_THICKNESS / 2;

    ctx.save();
    const basketGlow = ctx.createLinearGradient(0, basketTopY - 16, 0, FOOD_DROP_WORLD_HEIGHT);
    basketGlow.addColorStop(0, 'rgba(251, 191, 36, 0)');
    basketGlow.addColorStop(1, 'rgba(217, 119, 6, 0.2)');
    ctx.fillStyle = basketGlow;
    ctx.fillRect(0, basketTopY - 18, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT - basketTopY + 18);

    ctx.fillStyle = '#92400e';
    ctx.fillRect(BASKET_INSET_X, basketTopY, BASKET_WIDTH, BASKET_BASE_THICKNESS);
    ctx.fillRect(
      BASKET_LEFT_WALL_X - BASKET_WALL_THICKNESS / 2,
      basketTopY - BASKET_WALL_HEIGHT + BASKET_BASE_THICKNESS / 2,
      BASKET_WALL_THICKNESS,
      BASKET_WALL_HEIGHT
    );
    ctx.fillRect(
      BASKET_RIGHT_WALL_X - BASKET_WALL_THICKNESS / 2,
      basketTopY - BASKET_WALL_HEIGHT + BASKET_BASE_THICKNESS / 2,
      BASKET_WALL_THICKNESS,
      BASKET_WALL_HEIGHT
    );

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.88)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(BASKET_INSET_X - 1, basketTopY + 1);
    ctx.lineTo(BASKET_INSET_X + BASKET_WIDTH + 1, basketTopY + 1);
    ctx.stroke();
    ctx.restore();
  }

  private setupBoundaries() {
    const floor = Bodies.rectangle(
      FOOD_DROP_WORLD_WIDTH / 2,
      FLOOR_Y,
      FOOD_DROP_WORLD_WIDTH + FOOD_DROP_WALL_THICKNESS * 2,
      FOOD_DROP_WALL_THICKNESS,
      { isStatic: true, restitution: 0.2, label: 'floor' }
    );

    const leftWall = Bodies.rectangle(
      LEFT_WALL_X,
      FOOD_DROP_WORLD_HEIGHT / 2,
      FOOD_DROP_WALL_THICKNESS,
      FOOD_DROP_WORLD_HEIGHT * 2,
      { isStatic: true, restitution: 0.2, label: 'left-wall' }
    );

    const rightWall = Bodies.rectangle(
      RIGHT_WALL_X,
      FOOD_DROP_WORLD_HEIGHT / 2,
      FOOD_DROP_WALL_THICKNESS,
      FOOD_DROP_WORLD_HEIGHT * 2,
      { isStatic: true, restitution: 0.2, label: 'right-wall' }
    );

    const basketBase = Bodies.rectangle(
      FOOD_DROP_WORLD_WIDTH / 2,
      BASKET_BASE_Y,
      BASKET_WIDTH,
      BASKET_BASE_THICKNESS,
      { isStatic: true, restitution: 0.12, friction: 0.08, label: 'basket-base' }
    );

    const basketLeftWall = Bodies.rectangle(
      BASKET_LEFT_WALL_X,
      BASKET_WALL_CENTER_Y,
      BASKET_WALL_THICKNESS,
      BASKET_WALL_HEIGHT,
      { isStatic: true, restitution: 0.14, friction: 0.1, label: 'basket-left-wall' }
    );

    const basketRightWall = Bodies.rectangle(
      BASKET_RIGHT_WALL_X,
      BASKET_WALL_CENTER_Y,
      BASKET_WALL_THICKNESS,
      BASKET_WALL_HEIGHT,
      { isStatic: true, restitution: 0.14, friction: 0.1, label: 'basket-right-wall' }
    );

    World.add(this.world, [floor, leftWall, rightWall, basketBase, basketLeftWall, basketRightWall]);
  }

  private bindCollisionEvents() {
    // Keep merge candidates fresh both when contacts begin and while they remain in contact.
    Events.on(this.engine, 'collisionStart', this.queueMergePairs);
    Events.on(this.engine, 'collisionActive', this.queueMergePairs);
  }

  private clampLauncherToCurrentLevel() {
    this.setLauncherX(this.launcherX);
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
      const mergedBody = FoodDropEngine.createFoodBody(targetLevel, mergedX, mergedY, mergedScale);
      Body.setVelocity(mergedBody, { x: mergedVelocityX, y: mergedVelocityY });
      World.add(this.world, mergedBody);

      const points = scoreForMergeTargetLevel(targetLevel);
      mergeCount += 1;
      mergeScore += points;
      this.createMergeBurst(mergedX, mergedY, points, FOOD_LEVELS[targetLevel].radius * mergedScale);
    });

    if (mergeCount > 0) {
      const comboBonus = mergeCount > 1 ? (mergeCount - 1) * 5 : 0;
      this.score += mergeScore + comboBonus;
      if (comboBonus > 0) {
        this.createMergeBurst(
          FOOD_DROP_WORLD_WIDTH / 2,
          FOOD_DROP_LOSE_LINE_Y + 26,
          comboBonus,
          22,
          `Combo +${comboBonus}`
        );
      }
    }
  }

  private updateOverflowState(deltaMs: number) {
    const dynamicBodies = this.world.bodies.filter(
      (body) => !body.isStatic && FoodDropEngine.getBodyLevel(body) !== null
    );

    if (dynamicBodies.length === 0) {
      this.overflowSettledMs = 0;
      return;
    }

    // Immediate fail if any fruit misses the basket and falls to either side.
    const hasMissedBasket = dynamicBodies.some((body) => {
      const level = FoodDropEngine.getBodyLevel(body) ?? 0;
      const radius = FoodDropEngine.getBodyRadius(body, level);
      const isOutsideBasket =
        body.position.x + radius < BASKET_INNER_LEFT_X ||
        body.position.x - radius > BASKET_INNER_RIGHT_X;
      const isBelowBasketRim = body.position.y + radius >= BASKET_TOP_Y + 8;
      return isOutsideBasket && isBelowBasketRim;
    });

    if (hasMissedBasket) {
      this.status = 'game-over';
      this.canDrop = false;
      return;
    }

    const hasOverflow = dynamicBodies.some((body) => {
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

  private static getBodyLevel(body: Body): number | null {
    const plugin = body.plugin as Partial<FoodBodyMeta> | undefined;
    const level = plugin?.foodLevel;
    return typeof level === 'number' ? level : null;
  }

  private static getBodyScale(body: Body): number {
    const plugin = body.plugin as Partial<FoodBodyMeta> | undefined;
    return typeof plugin?.sizeScale === 'number' ? plugin.sizeScale : 1;
  }

  private static getBodyRadius(body: Body, level: number): number {
    return body.circleRadius ?? FOOD_LEVELS[level].radius * FoodDropEngine.getBodyScale(body);
  }

  private static createFoodBody(level: number, x: number, y: number, sizeScale = 1): Body {
    const { radius } = FOOD_LEVELS[level];
    const body = Bodies.circle(x, y, radius, {
      restitution: 0.26,
      friction: 0.018,
      frictionAir: 0.005,
      density: 0.001,
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
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, animatedRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(burst.label, burst.x, burst.y - burst.radius - progress * 18);
      ctx.restore();
    });
  }

  private static drawFoodCircle(ctx: CanvasRenderingContext2D, body: RenderBody) {
    ctx.save();
    ctx.translate(body.x, body.y);
    ctx.rotate(body.angle);

    const ringGradient = ctx.createRadialGradient(
      -body.radius / 3,
      -body.radius / 3,
      2,
      0,
      0,
      body.radius
    );
    ringGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    ringGradient.addColorStop(1, 'rgba(255, 255, 255, 0.22)');

    ctx.fillStyle = ringGradient;
    ctx.beginPath();
    ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `${Math.floor(body.radius * 1.2)}px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(FOOD_LEVELS[body.level].emoji, 0, body.radius * 0.04);

    ctx.restore();
  }

  private static randomSpawnLevel() {
    const span = FOOD_DROP_SPAWN_MAX_LEVEL - FOOD_DROP_SPAWN_MIN_LEVEL + 1;
    return FOOD_DROP_SPAWN_MIN_LEVEL + Math.floor(Math.random() * span);
  }

  private static randomSpawnScale(level: number): number {
    const normalized = Math.min(1, Math.max(0, level / FOOD_DROP_SIZE_VARIANCE_MAX_LEVEL));
    const levelVariance = 1 - normalized * 0.55;
    const min = 1 - (1 - FOOD_DROP_SIZE_VARIANCE_MIN) * levelVariance;
    const max = 1 + (FOOD_DROP_SIZE_VARIANCE_MAX - 1) * levelVariance;
    return min + Math.random() * (max - min);
  }
}
