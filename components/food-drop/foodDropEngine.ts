import { Bodies, Body, Engine, Events, World } from 'matter-js';
import {
  FOOD_DROP_GRAVITY,
  FOOD_DROP_LAUNCHER_START_X,
  FOOD_DROP_LOSE_LINE_Y,
  FOOD_DROP_OVERFLOW_SETTLED_MS,
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

const FLOOR_Y = FOOD_DROP_WORLD_HEIGHT + FOOD_DROP_WALL_THICKNESS / 2;
const LEFT_WALL_X = -FOOD_DROP_WALL_THICKNESS / 2;
const RIGHT_WALL_X = FOOD_DROP_WORLD_WIDTH + FOOD_DROP_WALL_THICKNESS / 2;

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

  constructor() {
    this.engine = Engine.create({
      gravity: { x: 0, y: FOOD_DROP_GRAVITY },
      enableSleeping: false,
    });
    this.world = this.engine.world;

    this.currentLevel = FoodDropEngine.randomSpawnLevel();
    this.nextLevel = FoodDropEngine.randomSpawnLevel();

    this.setupBoundaries();
    this.bindCollisionEvents();
  }

  destroy() {
    Events.off(this.engine, 'collisionStart');
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
      canDrop: this.canDrop && this.status === 'running',
      launcherX: this.launcherX,
    };
  }

  setLauncherX(targetX: number) {
    const { radius } = FOOD_LEVELS[this.currentLevel];
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
      FOOD_DROP_SPAWN_Y
    );
    World.add(this.world, body);

    this.canDrop = false;
    this.cooldownRemainingMs = FOOD_DROP_SPAWN_COOLDOWN_MS;
    this.currentLevel = this.nextLevel;
    this.nextLevel = FoodDropEngine.randomSpawnLevel();

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
    this.updateOverflowState(deltaMs);
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT);

    const gradient = ctx.createLinearGradient(0, 0, 0, FOOD_DROP_WORLD_HEIGHT);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FOOD_DROP_WORLD_WIDTH, FOOD_DROP_WORLD_HEIGHT);

    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, FOOD_DROP_LOSE_LINE_Y);
    ctx.lineTo(FOOD_DROP_WORLD_WIDTH, FOOD_DROP_LOSE_LINE_Y);
    ctx.stroke();
    ctx.restore();

    const { radius } = FOOD_LEVELS[this.currentLevel];
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

    this.getRenderableBodies().forEach((body) => {
      FoodDropEngine.drawFoodCircle(ctx, body);
    });

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

    World.add(this.world, [floor, leftWall, rightWall]);
  }

  private bindCollisionEvents() {
    Events.on(this.engine, 'collisionStart', (event) => {
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
    });
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

      consumed.add(bodyA.id);
      consumed.add(bodyB.id);
      World.remove(this.world, bodyA);
      World.remove(this.world, bodyB);

      const mergedBody = FoodDropEngine.createFoodBody(targetLevel, mergedX, mergedY);
      Body.setVelocity(mergedBody, { x: mergedVelocityX, y: mergedVelocityY });
      World.add(this.world, mergedBody);

      this.score += scoreForMergeTargetLevel(targetLevel);
    });
  }

  private updateOverflowState(deltaMs: number) {
    const dynamicBodies = this.world.bodies.filter(
      (body) => !body.isStatic && FoodDropEngine.getBodyLevel(body) !== null
    );

    if (dynamicBodies.length === 0) {
      this.overflowSettledMs = 0;
      return;
    }

    const hasOverflow = dynamicBodies.some((body) => {
      const bodyLevel = FoodDropEngine.getBodyLevel(body) ?? 0;
      const { radius } = FOOD_LEVELS[bodyLevel];
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

  private static createFoodBody(level: number, x: number, y: number): Body {
    const { radius } = FOOD_LEVELS[level];
    const body = Bodies.circle(x, y, radius, {
      restitution: 0.18,
      friction: 0.02,
      frictionAir: 0.006,
      density: 0.001,
      label: `food-${level}`,
      slop: 0.4,
    });

    body.plugin = {
      ...(body.plugin ?? {}),
      foodLevel: level,
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
          radius: FOOD_LEVELS[level].radius,
          level,
          angle: body.angle,
        };
      })
      .filter((body): body is RenderBody => body !== null);
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
}
