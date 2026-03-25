import { useEffect, useState, type FC, type MouseEvent, type PointerEvent, type RefObject } from 'react';
import { useUser } from '@/app/providers';
import { ELECTRON_LOGO_MARK_PATH } from '@/branding/logoAssets';
import type { ActionBubbleMenuPosition, ActionBubblePosition } from '@/app/actionBubble';
import CommandDeck, { type CommandActionItem } from '@/ui/CommandDeck';
import { BottomSheet } from '@/components/ui/modals';
import ThemeToggle from '@/ui/ThemeToggle';
import UserSelection from '@/components/common/UserSelection';
import { CrossIcon } from '@/common/icons';
import type { MainTab, User } from '@/shared/types';

const USER_PHOTOS: Record<User, string> = {
  Aaron: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa2Qa_ao3GRvb5R5TyT7lET-s_0iqlHUxWMg&s',
  Electra: 'https://i.redd.it/vkmos70wqw641.jpg',
};

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
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setPhotoError(false);
  }, [currentUser]);

  const closeMenu = () => onToggleMenu(false);

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
  }, [showActionBubbleMenu]);

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

  const tabToggle = (
    <div className="action-bubble-menu__tab-row">
      <ThemeToggle
        activeTab={activeTab}
        onChange={onTabChange}
        label="Switch between Movies and Places"
      />
    </div>
  );

  return (
    <>
      <button
        ref={actionBubbleRef}
        type="button"
        className={bubbleClasses}
        onClick={onActionBubbleClick}
        onPointerDown={onActionBubblePointerDown}
        onPointerMove={onActionBubblePointerMove}
        onPointerUp={onFinishActionBubbleDrag}
        onPointerCancel={onFinishActionBubbleDrag}
        aria-label={showActionBubbleMenu ? 'Close quick actions' : 'Open quick actions'}
        aria-haspopup="menu"
        aria-expanded={showActionBubbleMenu}
        aria-controls={isMobile ? 'action-bubble-sheet' : 'action-bubble-menu'}
        style={{
          top: `${actionBubblePosition.y}px`,
          left: `${actionBubblePosition.x}px`,
        }}
      >
        <span className="action-bubble__icon" aria-hidden="true">
          {currentUser && !photoError ? (
            <img
              src={USER_PHOTOS[currentUser]}
              alt={currentUser}
              className="action-bubble__user-photo"
              draggable="false"
              onError={() => setPhotoError(true)}
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
      </button>

      {showActionBubbleMenu && !isMobile ? (
        <div
          id="action-bubble-menu"
          ref={actionBubbleMenuRef}
          className="action-bubble-menu"
          role="menu"
          aria-label="Quick actions"
          style={actionBubbleMenuStyle}
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
          <UserSelection variant="inline" className="action-bubble-menu__profiles" />
          {tabToggle}
          <CommandDeck items={actionItems} variant="compact" onItemSelect={runItem} />
        </div>
      ) : null}

      <BottomSheet isOpen={isMobile && showActionBubbleMenu} onClose={closeMenu} title="Quick Actions">
        <div id="action-bubble-sheet">
          <UserSelection variant="inline" className="action-bubble-menu__profiles" />
          {tabToggle}
          <CommandDeck items={actionItems} variant="compact" onItemSelect={runItem} />
        </div>
      </BottomSheet>
    </>
  );
};

export default ActionBubbleLayer;
