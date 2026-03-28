import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { useUser } from '@/app/providers';
import { ELECTRON_LOGO_MARK_PATH } from '@/branding/logoAssets';
import type { ActionBubbleMenuPosition, ActionBubblePosition } from '@/app/actionBubble';
import CommandDeck, { type CommandActionItem } from '@/components/ui/CommandDeck';
import { BottomSheet } from '@/components/ui/modals';
import ThemeToggle from '@/ui/ThemeToggle';
import UserSelection from '@/components/common/UserSelection';
import { CrossIcon } from '@/common/icons';
import type { MainTab } from '@/shared/types';
import { USER_PHOTOS } from '@/shared/types';

interface ActionBubbleLayerProps {
  actionBubbleRef: RefObject<HTMLButtonElement | null>;
  actionBubbleMenuRef: RefObject<HTMLDivElement | null>;
  actionBubblePosition: ActionBubblePosition;
  isDraggingActionBubble: boolean;
  actionBubbleMenuStyle: ActionBubbleMenuPosition;
  isMobile: boolean;
  activeTab: MainTab;
  showActionBubbleMenu: boolean;
  onToggleMenu: (open: boolean) => void;
  onTabChange: (tab: MainTab) => void;
  actionItems: CommandActionItem[];
  onActionBubbleClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onActionBubblePointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onActionBubblePointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onFinishActionBubbleDrag: (event: PointerEvent<HTMLButtonElement>) => void;
}

interface ActionMenuBodyProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  actionItems: CommandActionItem[];
  onItemSelect: (item: CommandActionItem) => void;
}

const ActionMenuBody: FC<ActionMenuBodyProps> = ({
  activeTab,
  onTabChange,
  actionItems,
  onItemSelect,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
  >
    <UserSelection variant="inline" className="action-bubble-menu__profiles" />
    <div className="action-bubble-menu__tab-row">
      <ThemeToggle
        activeTab={activeTab}
        onChange={onTabChange}
        label="Switch between Movies and Places"
      />
    </div>
    <CommandDeck items={actionItems} onItemSelect={onItemSelect} />
  </motion.div>
);

const HOVER_OPEN_DELAY_MS = 80;
const HOVER_CLOSE_DELAY_MS = 180;

const ActionBubbleLayer: FC<ActionBubbleLayerProps> = ({
  actionBubbleRef,
  actionBubbleMenuRef,
  actionBubblePosition,
  isDraggingActionBubble,
  actionBubbleMenuStyle,
  isMobile,
  activeTab,
  showActionBubbleMenu,
  onToggleMenu,
  onTabChange,
  actionItems,
  onActionBubbleClick,
  onActionBubblePointerDown,
  onActionBubblePointerMove,
  onFinishActionBubbleDrag,
}) => {
  const { currentUser } = useUser();
  const [failedPhotoUser, setFailedPhotoUser] = useState<string | null>(null);
  const photoError = Boolean(currentUser && failedPhotoUser === currentUser);
  const closeMenu = useCallback(() => onToggleMenu(false), [onToggleMenu]);
  const openMenu = useCallback(() => onToggleMenu(true), [onToggleMenu]);

  const hoverOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimers = () => {
    if (hoverOpenTimerRef.current !== null) {
      clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = null;
    }
    if (hoverCloseTimerRef.current !== null) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };

  useEffect(() => () => clearHoverTimers(), []);

  const handleBubbleMouseEnter = () => {
    if (isMobile || isDraggingActionBubble) return;
    if (hoverCloseTimerRef.current !== null) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
    hoverOpenTimerRef.current = setTimeout(() => {
      hoverOpenTimerRef.current = null;
      openMenu();
    }, HOVER_OPEN_DELAY_MS);
  };

  const handleBubbleMouseLeave = () => {
    if (isMobile) return;
    if (hoverOpenTimerRef.current !== null) {
      clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = null;
    }
    hoverCloseTimerRef.current = setTimeout(() => {
      hoverCloseTimerRef.current = null;
      closeMenu();
    }, HOVER_CLOSE_DELAY_MS);
  };

  const handleMenuMouseEnter = () => {
    if (isMobile) return;
    if (hoverCloseTimerRef.current !== null) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };

  const handleMenuMouseLeave = () => {
    if (isMobile) return;
    hoverCloseTimerRef.current = setTimeout(() => {
      hoverCloseTimerRef.current = null;
      closeMenu();
    }, HOVER_CLOSE_DELAY_MS);
  };

  const runItem = (item: CommandActionItem) => {
    closeMenu();
    item.action();
  };

  useEffect(() => {
    if (!showActionBubbleMenu) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
        actionBubbleRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actionBubbleRef, closeMenu, showActionBubbleMenu]);

  const actionBubbleSide =
    actionBubblePosition.x < window.innerWidth / 2 ? 'right' : 'left';

  const bubbleClasses = [
    'action-bubble',
    `action-bubble--docked-${actionBubbleSide}`,
    isDraggingActionBubble ? 'is-dragging' : '',
    showActionBubbleMenu ? 'is-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const menuBodyProps: ActionMenuBodyProps = {
    activeTab,
    onTabChange,
    actionItems,
    onItemSelect: runItem,
  };

  const springConfig = { damping: 25, stiffness: 250 };
  const xSpring = useSpring(actionBubblePosition.x, springConfig);
  const ySpring = useSpring(actionBubblePosition.y, springConfig);

  useEffect(() => {
    xSpring.set(actionBubblePosition.x);
    ySpring.set(actionBubblePosition.y);
  }, [actionBubblePosition.x, actionBubblePosition.y, xSpring, ySpring]);

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
        onMouseEnter={handleBubbleMouseEnter}
        onMouseLeave={handleBubbleMouseLeave}
        aria-label={showActionBubbleMenu ? 'Close quick actions' : 'Open quick actions'}
        aria-haspopup="menu"
        aria-expanded={showActionBubbleMenu}
        aria-controls={isMobile ? 'action-bubble-sheet' : 'action-bubble-menu'}
        style={{
          left: isDraggingActionBubble ? actionBubblePosition.x : xSpring,
          top: isDraggingActionBubble ? actionBubblePosition.y : ySpring,
        }}
        animate={{
          scale: showActionBubbleMenu ? 1.15 : 1,
          y: isDraggingActionBubble || showActionBubbleMenu ? 0 : [0, -4, 0],
        }}
        whileHover={{ scale: 1.08, rotate: 2 }}
        whileTap={{ scale: 0.94, rotate: -1 }}
        transition={{ 
          y: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          },
          scale: { type: 'spring', damping: 20, stiffness: 300 },
          rotate: { type: 'spring', damping: 20, stiffness: 300 }
        }}
      >
        <span className="action-bubble__icon" aria-hidden="true">
          {currentUser && !photoError ? (
            <img
              src={USER_PHOTOS[currentUser]}
              alt={currentUser}
              className="action-bubble__user-photo"
              draggable="false"
              onError={() => setFailedPhotoUser(currentUser)}
            />
          ) : (
            <img
              src={ELECTRON_LOGO_MARK_PATH}
              alt=""
              className="action-bubble__icon-image action-bubble__mark"
              draggable="false"
            />
          )}
        </span>
        <span className="action-bubble__open-ring" aria-hidden="true" />
        <span className="sr-only">{showActionBubbleMenu ? 'Close' : 'Open'} quick actions</span>
      </motion.button>

      <AnimatePresence>
        {showActionBubbleMenu && !isMobile ? (
          <motion.div
            id="action-bubble-menu"
            ref={actionBubbleMenuRef}
            className="action-bubble-menu"
            role="menu"
            aria-label="Quick actions"
            style={actionBubbleMenuStyle}
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)', transition: { duration: 0.15 } }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="action-bubble-menu__header">
              <span className="action-bubble-menu__title" aria-hidden="true">Quick Actions</span>
              <button
                type="button"
                className="action-bubble-menu__close-btn"
                onClick={closeMenu}
                aria-label="Close menu"
              >
                <CrossIcon size={10} />
              </button>
            </div>
            <ActionMenuBody {...menuBodyProps} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <BottomSheet isOpen={isMobile && showActionBubbleMenu} onClose={closeMenu} title="Quick Actions">
        <div id="action-bubble-sheet">
          <ActionMenuBody {...menuBodyProps} />
        </div>
      </BottomSheet>
    </>
  );
};

export default ActionBubbleLayer;
