import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useBubbleDismiss } from '../../context/BubbleDismissContext';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import { useUser } from '../../context/UserContext';
import { colors, radius, spacing, typography } from '../../design-system/tokens';
import {
  FLOATING_BUBBLE_SIZE,
  FLOATING_DRAG_THRESHOLD,
  clampFloatingBubblePosition,
  getFloatingBubbleBadgeStyle,
  getFloatingBubbleButtonStyle,
  getFloatingContainerStyle,
  getFloatingPanelCardStyle,
} from '../ui/floatingBubbleStyles';
import {
  FOOD_DROP_WORLD_HEIGHT,
  FOOD_DROP_WORLD_WIDTH,
  FoodDropStatus,
} from './foodDropConfig';
import { FoodDropEngine, FoodDropSnapshot } from './foodDropEngine';
import { useFoodDropBestScore } from './useFoodDropBestScore';

interface FoodDropGameProps {
  mode?: 'floating' | 'embedded';
}

const KEYBOARD_STEP = 14;

const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;

const statusLabel: Record<FoodDropStatus, string> = {
  running: 'Playing',
  paused: 'Paused',
  'game-over': 'Game Over',
};

const FoodDropGame: React.FC<FoodDropGameProps> = ({ mode = 'floating' }) => {
  const {
    isHidden,
    setDragging: setDismissDragging,
    checkDismissZoneHit,
    dismiss,
  } = useBubbleDismiss();
  const { currentUser } = useUser();
  const { bestScore, recordBestScore } = useFoodDropBestScore(currentUser);
  const isMobile = useMediaQuery(breakpoints.sm);
  const isEmbedded = mode === 'embedded';

  const [isMinimized, setIsMinimized] = useState(mode === 'floating');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bubblePosition, setBubblePosition] = useState(() => {
    if (typeof window === 'undefined') return { x: 16, y: 16 };
    const defaultY = window.innerHeight - FLOATING_BUBBLE_SIZE - 86;
    return {
      x: 20,
      y: defaultY,
    };
  });
  const [isDraggingBubble, setIsDraggingBubble] = useState(false);
  const [snapshot, setSnapshot] = useState<FoodDropSnapshot>({
    score: 0,
    status: 'running',
    nextLevel: 0,
    currentLevel: 0,
    nextScale: 1,
    currentScale: 1,
    canDrop: true,
    launcherX: FOOD_DROP_WORLD_WIDTH / 2,
  });

  const engineRef = useRef<FoodDropEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: { x: number; y: number };
  } | null>(null);
  const didDragRef = useRef(false);
  const hasRecordedGameOverRef = useRef(false);

  const pointerDragRef = useRef<{
    pointerId: number;
    active: boolean;
  } | null>(null);

  const isGameVisible = isEmbedded || !isMinimized;
  const isViewportExpanded = isFullscreen || (!isEmbedded && !isMinimized);

  const canvasDisplayWidth = isFullscreen
    ? Math.min(520, typeof window === 'undefined' ? 520 : window.innerWidth - 80)
    : isMobile
      ? 300
      : 340;

  const canvasDisplayHeight = Math.round(
    canvasDisplayWidth * (FOOD_DROP_WORLD_HEIGHT / FOOD_DROP_WORLD_WIDTH)
  );

  const syncSnapshot = useCallback(() => {
    if (!engineRef.current) return;
    const next = engineRef.current.getSnapshot();
    setSnapshot((prev) => {
      if (
        prev.score === next.score &&
        prev.status === next.status &&
        prev.nextLevel === next.nextLevel &&
        prev.currentLevel === next.currentLevel &&
        Math.abs(prev.nextScale - next.nextScale) < 0.001 &&
        Math.abs(prev.currentScale - next.currentScale) < 0.001 &&
        prev.canDrop === next.canDrop &&
        Math.abs(prev.launcherX - next.launcherX) < 0.5
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.render(ctx);
    syncSnapshot();
  }, [syncSnapshot]);

  const restartGame = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.restart();
    hasRecordedGameOverRef.current = false;
    syncSnapshot();
    renderFrame();
  }, [renderFrame, syncSnapshot]);

  const togglePause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const current = engine.getSnapshot();
    if (current.status === 'game-over') return;

    engine.setStatus(current.status === 'paused' ? 'running' : 'paused');
    syncSnapshot();
    renderFrame();
  }, [renderFrame, syncSnapshot]);

  const setLauncherFromClientX = useCallback(
    (clientX: number) => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine) return;

      const rect = canvas.getBoundingClientRect();
      const ratio = FOOD_DROP_WORLD_WIDTH / rect.width;
      const worldX = (clientX - rect.left) * ratio;
      engine.setLauncherX(worldX);
      syncSnapshot();
      renderFrame();
    },
    [renderFrame, syncSnapshot]
  );

  const dropFruit = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.dropCurrentFruit();
    syncSnapshot();
    renderFrame();
  }, [renderFrame, syncSnapshot]);

  const handleBubblePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: bubblePosition,
    };
    didDragRef.current = false;
    setIsDraggingBubble(true);
    setDismissDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBubblePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - ds.startX;
    const deltaY = event.clientY - ds.startY;
    if (
      !didDragRef.current &&
      (Math.abs(deltaX) > FLOATING_DRAG_THRESHOLD || Math.abs(deltaY) > FLOATING_DRAG_THRESHOLD)
    ) {
      didDragRef.current = true;
    }
    if (!didDragRef.current) return;

    const nextX = ds.origin.x + deltaX;
    const nextY = ds.origin.y + deltaY;
    setBubblePosition(clampFloatingBubblePosition(nextX, nextY));
    checkDismissZoneHit(nextX, nextY, FLOATING_BUBBLE_SIZE);
  };

  const handleBubblePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== event.pointerId) return;

    const wasDragged = didDragRef.current;
    setIsDraggingBubble(false);
    setDismissDragging(false);
    dragStateRef.current = null;
    didDragRef.current = false;

    if (
      wasDragged &&
      checkDismissZoneHit(bubblePosition.x, bubblePosition.y, FLOATING_BUBBLE_SIZE)
    ) {
      dismiss('foodDrop');
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      return;
    }

    if (!wasDragged) {
      setIsMinimized(false);
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release errors.
    }
  };

  useEffect(() => {
    const engine = new FoodDropEngine();
    engineRef.current = engine;
    setSnapshot(engine.getSnapshot());

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isEmbedded) {
      setIsMinimized(false);
    }
  }, [isEmbedded]);

  useEffect(() => {
    if (!isGameVisible || snapshot.status !== 'running') {
      renderFrame();
      return undefined;
    }

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(34, now - lastTime);
      lastTime = now;

      const engine = engineRef.current;
      if (engine) {
        engine.step(delta);
        renderFrame();
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isGameVisible, snapshot.status, renderFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = dpr;
    canvas.width = Math.round(FOOD_DROP_WORLD_WIDTH * ratio);
    canvas.height = Math.round(FOOD_DROP_WORLD_HEIGHT * ratio);

    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    renderFrame();
  }, [renderFrame]);

  useEffect(() => {
    if (snapshot.status !== 'game-over') {
      hasRecordedGameOverRef.current = false;
      return;
    }

    if (hasRecordedGameOverRef.current) return;
    recordBestScore(snapshot.score);
    hasRecordedGameOverRef.current = true;
  }, [recordBestScore, snapshot.score, snapshot.status]);

  useEffect(() => {
    if (!isGameVisible) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        event.preventDefault();
        engine.nudgeLauncher(-KEYBOARD_STEP);
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        engine.nudgeLauncher(KEYBOARD_STEP);
      } else if (event.key === 'ArrowDown' || event.code === 'Space') {
        event.preventDefault();
        engine.dropCurrentFruit();
      } else if (event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        const current = engine.getSnapshot();
        if (current.status !== 'game-over') {
          engine.setStatus(current.status === 'paused' ? 'running' : 'paused');
        }
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        engine.restart();
        hasRecordedGameOverRef.current = false;
      } else {
        return;
      }

      syncSnapshot();
      renderFrame();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameVisible, renderFrame, syncSnapshot]);

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (snapshot.status !== 'running') return;
    pointerDragRef.current = { pointerId: event.pointerId, active: true };
    event.currentTarget.setPointerCapture(event.pointerId);
    setLauncherFromClientX(event.clientX);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const pointer = pointerDragRef.current;
    if (!pointer || !pointer.active || pointer.pointerId !== event.pointerId) return;
    setLauncherFromClientX(event.clientX);
  };

  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const pointer = pointerDragRef.current;
    if (!pointer || pointer.pointerId !== event.pointerId) return;

    setLauncherFromClientX(event.clientX);
    dropFruit();
    pointerDragRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release errors.
    }
  };

  const handleCanvasPointerCancel = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const pointer = pointerDragRef.current;
    if (!pointer || pointer.pointerId !== event.pointerId) return;

    pointerDragRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release errors.
    }
  };

  const containerStyle = useMemo<React.CSSProperties>(() => {
    return getFloatingContainerStyle({
      isEmbedded,
      isViewportExpanded,
      isMobile,
      desktopWidth: '420px',
    });
  }, [isEmbedded, isViewportExpanded, isMobile]);

  if (isMinimized && !isEmbedded) {
    if (isHidden('foodDrop')) return null;

    return (
      <button
        type="button"
        onPointerDown={handleBubblePointerDown}
        onPointerMove={handleBubblePointerMove}
        onPointerUp={handleBubblePointerUp}
        onPointerCancel={handleBubblePointerUp}
        style={{
          ...getFloatingBubbleButtonStyle({
            position: bubblePosition,
            isDragging: isDraggingBubble,
            background:
              'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), linear-gradient(145deg, rgba(251, 146, 60, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)',
            color: '#fff',
            fontSize: '1.5rem',
          }),
        }}
        aria-label="Open Food Drop"
      >
        🍉
        {bestScore > 0 && (
          <span
            style={{
              ...getFloatingBubbleBadgeStyle(),
              fontWeight: typography.fontWeight.bold,
            }}
            aria-label={`Best score ${bestScore}`}
          >
            {bestScore}
          </span>
        )}
      </button>
    );
  }

  return (
    <div style={containerStyle}>
      <Card
        style={{
          ...getFloatingPanelCardStyle({
            isViewportExpanded,
            isMobile,
            maxHeight: 'min(640px, 82vh)',
            background:
              'radial-gradient(circle at 18% 0%, rgba(56, 189, 248, 0.18), transparent 42%), radial-gradient(circle at 100% 100%, rgba(251, 146, 60, 0.16), transparent 46%), rgba(15, 23, 42, 0.95)',
            shadow:
              '0 18px 44px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.12) inset, 0 0 34px rgba(56, 189, 248, 0.12)',
          }),
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
            gap: spacing.sm,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            {!isEmbedded && (
              <h2
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.lg,
                  color: colors.textPrimary,
                  textShadow: '0 2px 10px rgba(251, 146, 60, 0.5)',
                  letterSpacing: '0.02em',
                }}
              >
                Food Drop Arcade
              </h2>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsFullscreen((prev) => !prev)}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                border: `1px solid ${colors.borderSecondary}30`,
                display: isEmbedded ? 'inline-flex' : 'none',
              }}
            >
              {isFullscreen ? 'Exit Full' : 'Fullscreen'}
            </Button>
          </div>
          {!isEmbedded && !isFullscreen && (
            <Button size="sm" variant="ghost" onClick={() => setIsMinimized(true)}>
              Hide
            </Button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
            color: colors.textPrimary,
            fontSize: typography.fontSize.sm,
            flexWrap: 'wrap',
            gap: spacing.xs,
          }}
        >
          <span
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(248, 250, 252, 0.2)',
              background: 'rgba(2, 6, 23, 0.42)',
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            Score: {snapshot.score}
          </span>
          <span
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(248, 250, 252, 0.2)',
              background: 'rgba(2, 6, 23, 0.42)',
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            Best: {bestScore}
          </span>
          <span
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(125, 211, 252, 0.35)',
              background: 'rgba(14, 116, 144, 0.24)',
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            {statusLabel[snapshot.status]}
          </span>
          <span
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(251, 191, 36, 0.35)',
              background: 'rgba(120, 53, 15, 0.24)',
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            Next: L{snapshot.nextLevel + 1}
          </span>
        </div>

        <div
          style={{
            alignSelf: 'center',
            width: `${canvasDisplayWidth}px`,
            maxWidth: '100%',
            borderRadius: radius.lg,
            overflow: 'hidden',
            border: `1px solid ${colors.borderSecondary}70`,
            boxShadow: '0 14px 36px rgba(2, 6, 23, 0.55), 0 0 0 1px rgba(255,255,255,0.08) inset',
            marginBottom: spacing.md,
            background:
              'linear-gradient(140deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
            padding: 8,
          }}
        >
          <canvas
            ref={canvasRef}
            width={FOOD_DROP_WORLD_WIDTH}
            height={FOOD_DROP_WORLD_HEIGHT}
            style={{
              width: `${canvasDisplayWidth}px`,
              height: `${canvasDisplayHeight}px`,
              maxWidth: '100%',
              display: 'block',
              touchAction: 'none',
              cursor: snapshot.status === 'running' ? 'crosshair' : 'default',
              borderRadius: radius.md,
            }}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerCancel}
            aria-label="Food Drop game board"
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={togglePause}
            disabled={snapshot.status === 'game-over'}
          >
            {snapshot.status === 'paused' ? 'Resume' : 'Pause'}
          </Button>
          <Button size="sm" variant="primary" onClick={restartGame}>
            Restart
          </Button>
          {snapshot.status === 'running' && (
            <Button size="sm" variant="ghost" onClick={dropFruit} disabled={!snapshot.canDrop}>
              Drop
            </Button>
          )}
          {snapshot.status === 'game-over' && (
            <Button size="sm" variant="primary" onClick={restartGame}>
              Play Again
            </Button>
          )}
        </div>

        {!isMobile && (
          <p
            style={{
              marginBottom: 0,
              marginTop: spacing.sm,
              textAlign: 'center',
              color: 'rgba(226, 232, 240, 0.78)',
              fontSize: typography.fontSize.xs,
              letterSpacing: '0.02em',
            }}
          >
            Arrow/A-D move launcher · Space/Down drop · P pause · R restart
          </p>
        )}
      </Card>
    </div>
  );
};

export default FoodDropGame;
