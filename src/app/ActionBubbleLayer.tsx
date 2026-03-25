import { useEffect, type FC, type MouseEvent, type PointerEvent, type RefObject } from 'react';
import { useUser } from '@/app/providers';
import ElectronMark from '@/branding/ElectronMark';
import type { ElectronMarkPalette, ElectronMarkVariant } from '@/branding/electronMarkData';
import type { ActionBubbleMenuPosition, ActionBubblePosition, ActionBubbleTogglePosition } from '@/app/actionBubble';
import CommandDeck, { type CommandActionItem } from '@/ui/CommandDeck';
import { BottomSheet } from '@/components/ui/modals';
import ThemeToggle from '@/ui/ThemeToggle';
import UserSelection from '@/components/common/UserSelection';
import { CrossIcon } from '@/common/icons';
import type { MainTab, User } from '@/shared/types';

const USER_LOGO_VARIANT: Record<User, ElectronMarkVariant> = {
  Aaron: 'orbit-a',
  Electra: 'orbit-e',
};

const USER_LOGO_PALETTE: Record<User, Partial<ElectronMarkPalette>> = {
  Aaron: {
    accent: '#ff9f45',
    accentLight: '#ffcc80',
    secondary: '#ffb347',
    tertiary: '#e85d04',
  },
  Electra: {
    accent: '#ff7fc6',
    accentLight: '#ffc2e6',
    secondary: '#95dcff',
    tertiary: '#a78af2',
  },
};

interface ActionBubbleLayerProps {
  actionBubbleRef: RefObject<HTMLButtonElement | null>;
  actionBubbleMenuRef: RefObject<HTMLDivElement | null>;
  actionBubblePosition: ActionBubblePosition;
  isDraggingActionBubble: boolean;
  actionBubbleToggleSide: 'left' | 'right';
  actionBubbleToggleStyle: ActionBubbleTogglePosition;
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
  actionBubbleToggleSide,
  actionBubbleToggleStyle,
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

  const bubbleClasses = [
    'action-bubble',
    `action-bubble--docked-${actionBubbleToggleSide}`,
    isDraggingActionBubble ? 'is-dragging' : '',
    showActionBubbleMenu ? 'is-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
          <ElectronMark
            variant={currentUser ? USER_LOGO_VARIANT[currentUser] : 'pulse-ae'}
            palette={currentUser ? USER_LOGO_PALETTE[currentUser] : undefined}
            size="100%"
            className="action-bubble__icon-image action-bubble__mark"
          />
        </span>
        <span className="action-bubble__open-ring" aria-hidden="true" />
        <span className="sr-only">{showActionBubbleMenu ? 'Close' : 'Open'} quick actions</span>
      </button>
      <ThemeToggle
        activeTab={activeTab}
        onChange={onTabChange}
        compact={isMobile}
        className={`action-bubble-toggle action-bubble-toggle--${actionBubbleToggleSide} action-bubble-toggle__control`}
        label="Switch between Watchlist and Date Ideas"
        style={actionBubbleToggleStyle}
      />

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
          <CommandDeck items={actionItems} variant="compact" onItemSelect={runItem} />
        </div>
      ) : null}

      <BottomSheet isOpen={isMobile && showActionBubbleMenu} onClose={closeMenu} title="Quick Actions">
        <div id="action-bubble-sheet">
          <UserSelection variant="inline" className="action-bubble-menu__profiles" />
          <CommandDeck items={actionItems} variant="compact" onItemSelect={runItem} />
        </div>
      </BottomSheet>
    </>
  );
};

export default ActionBubbleLayer;
