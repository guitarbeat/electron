import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { useChatLogic } from '../../hooks/useChatLogic';
import { useTheme } from '../../context/ThemeContext';
import ChatWindow from '../message-board/ChatWindow';
import MessageList from '../message-board/MessageList';
import MessageInput from '../message-board/MessageInput';
import ConfirmDialog from '../ui/ConfirmDialog';
import { colors, motion } from '../../design-system/tokens';
import { MessageIcon } from './icons';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import { useBubbleDismiss } from '../../context/BubbleDismissContext';
import {
  FLOATING_BUBBLE_SIZE,
  FLOATING_BUBBLE_EDGE_MARGIN,
  FLOATING_DRAG_THRESHOLD,
  clampFloatingBubblePosition,
  getFloatingBubbleButtonStyle,
} from '../ui/floatingBubbleStyles';

interface MessageBoardProps {
  mode?: 'floating' | 'embedded';
}

interface BubblePosition {
  x: number;
  y: number;
}

const FLOATING_Z_INDEX = 220;

const getDefaultBubblePosition = (isMobile: boolean): BubblePosition => {
  if (typeof window === 'undefined') {
    return { x: FLOATING_BUBBLE_EDGE_MARGIN, y: FLOATING_BUBBLE_EDGE_MARGIN };
  }

  const defaultX = isMobile
    ? window.innerWidth - FLOATING_BUBBLE_SIZE - FLOATING_BUBBLE_EDGE_MARGIN
    : FLOATING_BUBBLE_EDGE_MARGIN + 4;
  const defaultY = window.innerHeight - FLOATING_BUBBLE_SIZE - FLOATING_BUBBLE_EDGE_MARGIN - 4;

  return clampFloatingBubblePosition(defaultX, defaultY);
};

const MessageBoard: React.FC<MessageBoardProps> = ({ mode = 'floating' }) => {
  const {
    isHidden,
    setDragging: setDismissDragging,
    checkDismissZoneHit,
    dismiss,
  } = useBubbleDismiss();
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const { themeTokens } = useTheme();
  const { messages, isLoading, error, isSubmitting, handleSend, handleDelete, handleReaction } =
    useChatLogic();
  const isMobile = useMediaQuery(breakpoints.sm);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(mode === 'floating');
  const [messageToDeleteId, setMessageToDeleteId] = useState<string | null>(null);
  const [lastViewedCount, setLastViewedCount] = useState(0);
  const isEmbedded = mode === 'embedded';
  const [bubblePosition, setBubblePosition] = useState<BubblePosition>(() => {
    if (typeof window === 'undefined') {
      return { x: FLOATING_BUBBLE_EDGE_MARGIN, y: FLOATING_BUBBLE_EDGE_MARGIN };
    }
    const isMobileWidth = window.innerWidth < 640;
    return getDefaultBubblePosition(isMobileWidth);
  });
  const [isDraggingBubble, setIsDraggingBubble] = useState(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: BubblePosition;
  } | null>(null);
  const didDragRef = useRef(false);
  const hasCustomPositionRef = useRef(false);

  useEffect(() => {
    if (isEmbedded) {
      setIsMinimized(false);
      return;
    }

    if (!hasCustomPositionRef.current) {
      setBubblePosition(getDefaultBubblePosition(isMobile));
    }
  }, [isEmbedded, isMobile]);

  useEffect(() => {
    if (typeof window === 'undefined' || isEmbedded) {
      return undefined;
    }

    const handleResize = () => {
      setBubblePosition((previous) => clampFloatingBubblePosition(previous.x, previous.y));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isEmbedded]);

  const handleToggle = () => {
    if (isEmbedded) {
      return;
    }

    if (isMinimized) {
      setLastViewedCount(messages?.length || 0);
    }
    setIsMinimized(!isMinimized);
  };

  const handleBubblePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: bubblePosition,
    };
    didDragRef.current = false;
    setIsDraggingBubble(true);
    setDismissDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignore capture errors from canceled pointer interactions.
    }
  };

  const handleBubblePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (
      !didDragRef.current &&
      (Math.abs(deltaX) > FLOATING_DRAG_THRESHOLD || Math.abs(deltaY) > FLOATING_DRAG_THRESHOLD)
    ) {
      didDragRef.current = true;
    }

    if (!didDragRef.current) {
      return;
    }

    const nextX = dragState.origin.x + deltaX;
    const nextY = dragState.origin.y + deltaY;
    setBubblePosition(clampFloatingBubblePosition(nextX, nextY));
    checkDismissZoneHit(nextX, nextY, FLOATING_BUBBLE_SIZE);
  };

  const handleDragEnd = () => {
    const wasDragged = didDragRef.current;
    if (wasDragged) {
      hasCustomPositionRef.current = true;
    }
    setIsDraggingBubble(false);
    setDismissDragging(false);
    dragStateRef.current = null;
    didDragRef.current = false;
    if (
      wasDragged &&
      checkDismissZoneHit(bubblePosition.x, bubblePosition.y, FLOATING_BUBBLE_SIZE)
    ) {
      dismiss('messages');
    }
  };

  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    handleDragEnd();
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore capture errors from canceled pointer interactions.
    }
  };

  const handleBubbleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (didDragRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    handleToggle();
  };

  const requestDeleteMessage = async (id: string) => {
    setMessageToDeleteId(id);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDeleteId) return;
    await handleDelete(messageToDeleteId);
    setMessageToDeleteId(null);
  };

  const unreadCount = Math.max(0, (messages?.length || 0) - lastViewedCount);
  const messageToDelete =
    messageToDeleteId && messages
      ? messages.find((message) => message.id === messageToDeleteId)
      : null;

  if (!isEmbedded && isMinimized) {
    // Always show messages bubble, ignore hidden state for better UX
    if (false && isHidden('messages')) return null;
    return (
      <button
        type="button"
        onClick={handleBubbleClick}
        onPointerDown={handleBubblePointerDown}
        onPointerMove={handleBubblePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        aria-label="Open messages"
        className="message-launcher-bubble"
        style={{
          ...getFloatingBubbleButtonStyle({
            position: bubblePosition,
            isDragging: isDraggingBubble,
            background: themeTokens.accent,
            color: '#000',
            fontSize: '1rem',
            zIndex: FLOATING_Z_INDEX,
            boxShadow: themeTokens.glow,
          }),
          transition: isDraggingBubble
            ? 'none'
            : `top ${motion.duration.fast} ${motion.easing.easeInOut}, left ${motion.duration.fast} ${motion.easing.easeInOut}, transform ${motion.duration.fast} ${motion.easing.easeInOut}`,
          transform: isDraggingBubble ? 'scale(1.04)' : 'scale(1)',
        }}
      >
        <MessageIcon style={{ width: '30px', height: '30px', color: '#000' }} />
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: colors.error,
              color: '#fff',
              fontSize: '12px',
              fontWeight: 'bold',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              border: '2px solid white',
            }}
          >
            {unreadCount}
          </div>
        )}
      </button>
    );
  }

  const containerStyle: React.CSSProperties = isEmbedded
    ? {
        position: 'relative',
        width: '100%',
        maxHeight: isMobile ? 'min(78vh, 720px)' : 'min(780px, 80vh)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
        border: `1px solid ${colors.borderSecondary}30`,
        overflow: 'hidden',
      }
    : {
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: FLOATING_Z_INDEX,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(16px)',
        borderRadius: 0,
        boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
        border: 'none',
        overflow: 'hidden',
        animation: 'slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      };

  return (
    <div style={containerStyle} className="message-board-container">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ChatWindow
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onClose={isEmbedded ? undefined : handleToggle}
        >
          <MessageList
            messages={messages ?? null}
            isLoading={isLoading}
            error={error}
            currentUser={currentUser}
            onDelete={requestDeleteMessage}
            onReaction={handleReaction}
            isSubmitting={isSubmitting}
            isEditMode={isEditMode}
          />
          <MessageInput
            key={currentUser || 'anonymous'}
            currentUser={currentUser}
            isSubmitting={isSubmitting}
            onSend={handleSend}
            onError={(message) => showToast({ message, type: 'error' })}
          />
        </ChatWindow>
      </div>
      <ConfirmDialog
        isOpen={!!messageToDeleteId}
        title="Delete Message"
        message={
          messageToDelete
            ? `Delete this message from ${messageToDelete.author || 'Anonymous'}?`
            : 'Delete this message?'
        }
        confirmText="Delete"
        onConfirm={confirmDeleteMessage}
        onCancel={() => setMessageToDeleteId(null)}
      />
    </div>
  );
};

export default MessageBoard;
