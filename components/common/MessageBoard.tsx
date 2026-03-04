import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { useChatLogic } from '../../hooks/useChatLogic';
import { useTheme } from '../../context/ThemeContext';
import ChatWindow from '../message-board/ChatWindow';
import MessageList from '../message-board/MessageList';
import MessageInput from '../message-board/MessageInput';
import ConfirmDialog from '../ui/ConfirmDialog';
import { spacing, colors, shadows, motion, typography } from '../../design-system/tokens';
import { MessageIcon } from './icons';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import { useBubbleDismiss } from '../../context/BubbleDismissContext';

interface MessageBoardProps {
  mode?: 'floating' | 'embedded';
}

interface BubblePosition {
  x: number;
  y: number;
}

const BUBBLE_SIZE = 60;
const BUBBLE_EDGE_MARGIN = 16;
const DRAG_THRESHOLD = 4;
const FLOATING_Z_INDEX = 220;

const clampBubblePosition = (x: number, y: number): BubblePosition => {
  if (typeof window === 'undefined') {
    return { x, y };
  }

  const maxX = Math.max(BUBBLE_EDGE_MARGIN, window.innerWidth - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN);
  const maxY = Math.max(BUBBLE_EDGE_MARGIN, window.innerHeight - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN);

  return {
    x: Math.min(Math.max(x, BUBBLE_EDGE_MARGIN), maxX),
    y: Math.min(Math.max(y, BUBBLE_EDGE_MARGIN), maxY),
  };
};

const getDefaultBubblePosition = (isMobile: boolean): BubblePosition => {
  if (typeof window === 'undefined') {
    return { x: BUBBLE_EDGE_MARGIN, y: BUBBLE_EDGE_MARGIN };
  }

  const defaultX = isMobile
    ? window.innerWidth - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN
    : BUBBLE_EDGE_MARGIN + 4;
  const defaultY = window.innerHeight - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN - 4;

  return clampBubblePosition(defaultX, defaultY);
};

const MessageBoard: React.FC<MessageBoardProps> = ({ mode = 'floating' }) => {
  const { isHidden, setDragging: setDismissDragging, checkDismissZoneHit, dismiss } = useBubbleDismiss();
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
  const isEmbedded = mode === 'floating';
  const [bubblePosition, setBubblePosition] = useState<BubblePosition>(() => {
    if (typeof window === 'undefined') {
      return { x: BUBBLE_EDGE_MARGIN, y: BUBBLE_EDGE_MARGIN };
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
      setBubblePosition((previous) => clampBubblePosition(previous.x, previous.y));
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
      (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)
    ) {
      didDragRef.current = true;
    }

    if (!didDragRef.current) {
      return;
    }

    const nextX = dragState.origin.x + deltaX;
    const nextY = dragState.origin.y + deltaY;
    setBubblePosition(clampBubblePosition(nextX, nextY));
    checkDismissZoneHit(nextX, nextY, BUBBLE_SIZE);
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
    if (wasDragged && checkDismissZoneHit(bubblePosition.x, bubblePosition.y, BUBBLE_SIZE)) {
      dismiss('messages');
      return;
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
          position: 'fixed',
          top: `${bubblePosition.y}px`,
          left: `${bubblePosition.x}px`,
          width: `${BUBBLE_SIZE}px`,
          height: `${BUBBLE_SIZE}px`,
          borderRadius: '50%',
          backgroundColor: themeTokens.accent,
          border: `3px solid ${colors.surfaceElevated}`,
          boxShadow: themeTokens.glow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDraggingBubble ? 'grabbing' : 'grab',
          zIndex: FLOATING_Z_INDEX,
          transition: isDraggingBubble
            ? 'none'
            : `top ${motion.duration.fast} ${motion.easing.easeInOut}, left ${motion.duration.fast} ${motion.easing.easeInOut}, transform ${motion.duration.fast} ${motion.easing.easeInOut}`,
          transform: isDraggingBubble ? 'scale(1.04)' : 'scale(1)',
          padding: 0,
          touchAction: 'none',
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

  const isBottomHalf =
    bubblePosition.y > (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);
  const isRightHalf =
    bubblePosition.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);

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
        width: isMobile ? 'calc(100vw - 32px)' : '400px',
        maxHeight: isMobile ? 'min(72vh, 640px)' : 'min(600px, 70vh)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: FLOATING_Z_INDEX,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
        border: `1px solid ${colors.borderSecondary}30`,
        overflow: 'hidden',
        animation: 'slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        transformOrigin: `${isBottomHalf ? 'bottom' : 'top'} ${isRightHalf ? 'right' : 'left'}`,
        ...(isBottomHalf
          ? { bottom: `calc(100vh - ${bubblePosition.y}px - ${BUBBLE_SIZE}px)` }
          : { top: `${bubblePosition.y}px` }),
        ...(isRightHalf
          ? { right: `calc(100vw - ${bubblePosition.x}px - ${BUBBLE_SIZE}px)` }
          : { left: `${bubblePosition.x}px` }),
        ...(isMobile && {
          left: '16px',
          right: '16px',
          bottom: isBottomHalf ? '16px' : 'auto',
          top: !isBottomHalf ? '16px' : 'auto',
        }),
      };

  return (
    <div style={containerStyle} className="message-board-container">
      {isEmbedded ? (
        <div
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: 'transparent',
            color: colors.textPrimary,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 'bold',
            borderBottom: `1px solid ${colors.borderSecondary}20`,
          }}
        >
          <span
            style={{
              fontFamily: typography.fontFamily.heading.join(', '),
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wide,
              textShadow: shadows.textGlow,
            }}
          >
            Messages
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          style={{
            width: '100%',
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: 'transparent',
            color: colors.textPrimary,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 'bold',
            cursor: 'pointer',
            border: 'none',
            borderBottom: `1px solid ${colors.borderSecondary}20`,
          }}
          aria-label="Minimize messages panel"
        >
          <span
            style={{
              fontFamily: typography.fontFamily.heading.join(', '),
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wide,
              textShadow: shadows.textGlow,
            }}
          >
            Messages
          </span>
          <span
            style={{
              fontSize: '20px',
              lineHeight: 1,
              color: colors.textPrimary,
            }}
            aria-hidden
          >
            −
          </span>
        </button>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ChatWindow isEditMode={isEditMode} onToggleEditMode={() => setIsEditMode(!isEditMode)}>
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
