import type { FC, MouseEvent, PointerEvent, RefObject } from 'react';
import { ELECTRON_LOGO_MARK_PATH } from '@/branding/logoAssets';
import type { ActionBubbleMenuPosition, ActionBubblePosition, ActionBubbleTogglePosition } from '@/app/actionBubble';
import CommandDeck, { type CommandActionItem } from '@/ui/CommandDeck';
import { BottomSheet } from '@/components/ui/modals';
import ThemeToggle from '@/ui/ThemeToggle';
import type { MainTab } from '@/shared/types';

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
  const closeMenu = () => onToggleMenu(false);

  const runItem = (item: CommandActionItem) => {
    closeMenu();
    item.action();
  };

  return (
    <>
      <button
        ref={actionBubbleRef}
        type="button"
        className={`action-bubble action-bubble--docked-${actionBubbleToggleSide}${isDraggingActionBubble ? ' is-dragging' : ''}`}
        onClick={onActionBubbleClick}
        onPointerDown={onActionBubblePointerDown}
        onPointerMove={onActionBubblePointerMove}
        onPointerUp={onFinishActionBubbleDrag}
        onPointerCancel={onFinishActionBubbleDrag}
        aria-label="Open messages and extras"
        aria-haspopup="menu"
        aria-expanded={showActionBubbleMenu}
        aria-controls={isMobile ? 'action-bubble-sheet' : 'action-bubble-menu'}
        style={{
          top: `${actionBubblePosition.y}px`,
          left: `${actionBubblePosition.x}px`,
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
        <span className="sr-only">Messages and extras</span>
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
          style={actionBubbleMenuStyle}
        >
          <CommandDeck items={actionItems} variant="compact" onItemSelect={runItem} />
        </div>
      ) : null}

      <BottomSheet isOpen={isMobile && showActionBubbleMenu} onClose={closeMenu} title="Quick actions">
        <div id="action-bubble-sheet">
          <CommandDeck items={actionItems} variant="compact" onItemSelect={runItem} />
        </div>
      </BottomSheet>
    </>
  );
};

export default ActionBubbleLayer;
