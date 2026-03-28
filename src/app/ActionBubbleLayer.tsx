import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { AnimatePresence, motion, useReducedMotion, useSpring } from 'framer-motion';
import { useUser } from '@/app/providers';
import {
  ACTION_BUBBLE_PANEL_FALLBACK_HEIGHT,
  getActionBubblePanelPosition,
  type ActionBubblePosition,
} from '@/app/actionBubble';
import { ELECTRON_LOGO_MARK_PATH } from '@/branding/logoAssets';
import UserSelection from '@/components/common/UserSelection';
import { CrossIcon } from '@/common/icons';
import CommandDeck, { type CommandActionItem } from '@/components/ui/CommandDeck';
import { BottomSheet } from '@/components/ui/modals';
import type { User } from '@/shared/types';
import { USER_PHOTOS } from '@/shared/types';

interface ActionBubbleLayerProps {
  actionBubbleRef: RefObject<HTMLButtonElement | null>;
  actionBubblePanelRef: RefObject<HTMLDivElement | null>;
  actionBubblePosition: ActionBubblePosition;
  isDraggingActionBubble: boolean;
  isMobile: boolean;
  showActionBubbleMenu: boolean;
  onToggleMenu: (open: boolean) => void;
  actionItems: CommandActionItem[];
  onActionBubbleClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onActionBubblePointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onActionBubblePointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onFinishActionBubbleDrag: (event: PointerEvent<HTMLButtonElement>) => void;
}

interface ActionPanelContentProps {
  currentUser: User | null;
  actionItems: CommandActionItem[];
  firstActionRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onItemSelect: (item: CommandActionItem) => void;
  showCloseButton: boolean;
}

const USER_MONOGRAMS: Record<User, string> = {
  Aaron: 'AR',
  Electra: 'EL',
};

const getViewportSize = () => {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 800 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const ActionPanelContent: FC<ActionPanelContentProps> = ({
  currentUser,
  actionItems,
  firstActionRef,
  onClose,
  onItemSelect,
  showCloseButton,
}) => {
  const statusLabel = currentUser ? `${currentUser} active` : 'Guest mode';

  return (
    <>
      <div className="action-bubble-panel__header">
        <div className="action-bubble-panel__header-row">
          <div className="action-bubble-panel__context-copy">
            <span className="action-bubble-panel__eyebrow">Launcher</span>
            <span className="action-bubble-panel__workspace">Movies + Places</span>
            <span className="action-bubble-panel__status">{statusLabel}</span>
          </div>
          {showCloseButton ? (
            <button
              type="button"
              className="action-bubble-panel__close-btn"
              onClick={onClose}
              aria-label="Close launcher"
            >
              <CrossIcon size={10} />
            </button>
          ) : null}
        </div>
        <UserSelection variant="inline" className="action-bubble-panel__profiles" />
      </div>

      <div className="action-bubble-panel__body">
        <CommandDeck
          items={actionItems}
          onItemSelect={onItemSelect}
          firstItemRef={firstActionRef}
        />
      </div>
    </>
  );
};

const ActionBubbleLayer: FC<ActionBubbleLayerProps> = ({
  actionBubbleRef,
  actionBubblePanelRef,
  actionBubblePosition,
  isDraggingActionBubble,
  isMobile,
  showActionBubbleMenu,
  onToggleMenu,
  actionItems,
  onActionBubbleClick,
  onActionBubblePointerDown,
  onActionBubblePointerMove,
  onFinishActionBubbleDrag,
}) => {
  const { currentUser } = useUser();
  const prefersReducedMotion = useReducedMotion();
  const [failedPhotoUser, setFailedPhotoUser] = useState<User | null>(null);
  const [panelHeight, setPanelHeight] = useState(ACTION_BUBBLE_PANEL_FALLBACK_HEIGHT);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  const previousOpenRef = useRef(showActionBubbleMenu);
  const restoreFocusOnCloseRef = useRef(false);

  const bubbleHasPhotoError = Boolean(currentUser && failedPhotoUser === currentUser);

  const panelPosition = useMemo(() => {
    const viewport = getViewportSize();
    return getActionBubblePanelPosition(
      actionBubblePosition,
      viewport.width,
      viewport.height,
      panelHeight,
      isMobile
    );
  }, [actionBubblePosition, isMobile, panelHeight]);

  const closeMenu = useCallback(
    (restoreFocus: boolean = true) => {
      restoreFocusOnCloseRef.current = restoreFocus;
      onToggleMenu(false);
    },
    [onToggleMenu]
  );

  const runItem = useCallback(
    (item: CommandActionItem) => {
      closeMenu(false);
      item.action();
    },
    [closeMenu]
  );

  useLayoutEffect(() => {
    if (!showActionBubbleMenu || isMobile || !actionBubblePanelRef.current) {
      return undefined;
    }

    const panelNode = actionBubblePanelRef.current;
    const measure = () => {
      setPanelHeight(panelNode.offsetHeight || ACTION_BUBBLE_PANEL_FALLBACK_HEIGHT);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => measure());
    observer.observe(panelNode);

    return () => observer.disconnect();
  }, [actionBubblePanelRef, isMobile, showActionBubbleMenu]);

  useEffect(() => {
    const wasOpen = previousOpenRef.current;

    if (showActionBubbleMenu && !wasOpen) {
      window.requestAnimationFrame(() => {
        firstActionRef.current?.focus();
      });
    }

    if (!showActionBubbleMenu && wasOpen && restoreFocusOnCloseRef.current) {
      window.requestAnimationFrame(() => {
        actionBubbleRef.current?.focus();
      });
      restoreFocusOnCloseRef.current = false;
    }

    previousOpenRef.current = showActionBubbleMenu;
  }, [actionBubbleRef, showActionBubbleMenu]);

  useEffect(() => {
    if (!showActionBubbleMenu) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeMenu, showActionBubbleMenu]);

  useEffect(() => {
    if (!showActionBubbleMenu || isMobile) {
      return undefined;
    }

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (
        actionBubblePanelRef.current?.contains(target) ||
        actionBubbleRef.current?.contains(target)
      ) {
        return;
      }

      closeMenu(true);
    };

    document.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      });
    };
  }, [actionBubblePanelRef, actionBubbleRef, closeMenu, isMobile, showActionBubbleMenu]);

  const springConfig = { damping: 25, stiffness: 250 };
  const xSpring = useSpring(actionBubblePosition.x, springConfig);
  const ySpring = useSpring(actionBubblePosition.y, springConfig);

  useEffect(() => {
    xSpring.set(actionBubblePosition.x);
    ySpring.set(actionBubblePosition.y);
  }, [actionBubblePosition.x, actionBubblePosition.y, xSpring, ySpring]);

  const bubbleClasses = [
    'action-bubble',
    `action-bubble--docked-${panelPosition.side}`,
    isDraggingActionBubble ? 'is-dragging' : '',
    showActionBubbleMenu ? 'is-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const bubbleHoverAnimation = prefersReducedMotion
    ? undefined
    : {
        scale: 1.03,
        y: -2,
      };

  const bubbleTapAnimation = prefersReducedMotion
    ? {
        scale: 0.98,
      }
    : {
        scale: 0.96,
        y: 1,
      };

  const panelMotionDistance = prefersReducedMotion
    ? 0
    : panelPosition.side === 'right'
      ? -12
      : 12;

  return (
    <>
      <motion.button
        ref={actionBubbleRef}
        type="button"
        className={bubbleClasses}
        onClick={onActionBubbleClick}
        onPointerDown={onActionBubblePointerDown}
        onPointerMove={onActionBubblePointerMove}
        onPointerUp={onFinishActionBubbleDrag}
        onPointerCancel={onFinishActionBubbleDrag}
        aria-label={showActionBubbleMenu ? 'Close launcher' : 'Open launcher'}
        aria-haspopup="dialog"
        aria-expanded={showActionBubbleMenu}
        aria-controls={isMobile ? 'action-bubble-sheet' : 'action-bubble-panel'}
        style={{
          left: isDraggingActionBubble ? actionBubblePosition.x : xSpring,
          top: isDraggingActionBubble ? actionBubblePosition.y : ySpring,
        }}
        animate={{
          scale: isDraggingActionBubble ? 1.02 : showActionBubbleMenu ? 1.05 : 1,
          y: 0,
        }}
        whileHover={!isDraggingActionBubble ? bubbleHoverAnimation : undefined}
        whileTap={bubbleTapAnimation}
        transition={{
          scale: { type: 'spring', damping: 22, stiffness: 300 },
          y: { type: 'spring', damping: 24, stiffness: 280 },
        }}
      >
        <span className="action-bubble__icon" aria-hidden="true">
          <img
            src={ELECTRON_LOGO_MARK_PATH}
            alt=""
            className="action-bubble__icon-image action-bubble__mark"
            draggable="false"
          />
        </span>
        {currentUser ? (
          <span className="action-bubble__presence" aria-hidden="true">
            {bubbleHasPhotoError ? (
              <span className="action-bubble__presence-fallback">
                {USER_MONOGRAMS[currentUser]}
              </span>
            ) : (
              <img
                src={USER_PHOTOS[currentUser]}
                alt=""
                className="action-bubble__presence-photo"
                draggable="false"
                onError={() => setFailedPhotoUser(currentUser)}
              />
            )}
          </span>
        ) : null}
        <span className="sr-only">{showActionBubbleMenu ? 'Close' : 'Open'} launcher</span>
      </motion.button>

      <AnimatePresence>
        {showActionBubbleMenu && !isMobile ? (
          <motion.div
            id="action-bubble-panel"
            ref={actionBubblePanelRef}
            className={`action-bubble-panel action-bubble-panel--${panelPosition.side}`}
            role="dialog"
            aria-modal="false"
            aria-label="Launcher"
            style={{
              left: panelPosition.left,
              top: panelPosition.top,
              transformOrigin: panelPosition.transformOrigin,
            }}
            initial={{
              opacity: 0,
              x: panelMotionDistance,
              scale: prefersReducedMotion ? 1 : 0.98,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: panelMotionDistance,
              scale: prefersReducedMotion ? 1 : 0.985,
              transition: { duration: 0.16 },
            }}
            transition={{ type: 'spring', damping: 24, stiffness: 310 }}
          >
            <ActionPanelContent
              currentUser={currentUser}
              actionItems={actionItems}
              firstActionRef={firstActionRef}
              onClose={() => closeMenu(true)}
              onItemSelect={runItem}
              showCloseButton
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <BottomSheet
        isOpen={isMobile && showActionBubbleMenu}
        onClose={() => closeMenu(true)}
        title="Launcher"
      >
        <div id="action-bubble-sheet" className="action-bubble-sheet">
          <ActionPanelContent
            currentUser={currentUser}
            actionItems={actionItems}
            firstActionRef={firstActionRef}
            onClose={() => closeMenu(true)}
            onItemSelect={runItem}
            showCloseButton={false}
          />
        </div>
      </BottomSheet>
    </>
  );
};

export default ActionBubbleLayer;
