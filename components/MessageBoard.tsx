import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useChatLogic } from '../hooks/useChatLogic';
import ChatWindow from './message-board/ChatWindow';
import MessageList from './message-board/MessageList';
import MessageInput from './message-board/MessageInput';
import Toast from './ui/Toast';
import { spacing, colors, shadows, radius, zIndex, motion } from '../design-system/tokens';
import { MessageIcon } from './icons';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';

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
  const { currentUser } = useUser();
  const {
    messages,
    isLoading,
    error,
    isSubmitting,
    handleSend,
    handleDelete,
    handleReaction,
    toast,
  } = useChatLogic();
  const isMobile = useMediaQuery(breakpoints.sm);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(mode === 'floating');
  const [lastViewedCount, setLastViewedCount] = useState(0);
  const isEmbedded = mode === 'embedded';
  const [bubblePosition, setBubblePosition] = useState<BubblePosition>(() =>
    getDefaultBubblePosition(isMobile)
  );
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
    if (event.pointerType === 'mouse' && event.button !== 0) {
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
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBubblePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!didDragRef.current && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
      didDragRef.current = true;
    }

    if (!didDragRef.current) {
      return;
    }

    const nextX = dragState.origin.x + deltaX;
    const nextY = dragState.origin.y + deltaY;
    setBubblePosition(clampBubblePosition(nextX, nextY));
  };

  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (didDragRef.current) {
      hasCustomPositionRef.current = true;
    }

    setIsDraggingBubble(false);
    dragStateRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch (error) {
      // Ignore capture errors from canceled pointer interactions.
    }
  };

  const handleBubbleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (didDragRef.current) {
      event.preventDefault();
      event.stopPropagation();
      didDragRef.current = false;
      return;
    }

    handleToggle();
  };

  const unreadCount = Math.max(0, (messages?.length || 0) - lastViewedCount);

  if (!isEmbedded && isMinimized) {
    return (
      <button
        onClick={handleBubbleClick}
        onPointerDown={handleBubblePointerDown}
        onPointerMove={handleBubblePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        aria-label="Open messages"
        className="gel-bubble"
        style={{
          position: 'fixed',
          top: `${bubblePosition.y}px`,
          left: `${bubblePosition.x}px`,
          width: `${BUBBLE_SIZE}px`,
          height: `${BUBBLE_SIZE}px`,
          borderRadius: '50%',
          backgroundColor: colors.accent,
          border: `3px solid ${colors.surfaceElevated}`,
          boxShadow: shadows.glow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDraggingBubble ? 'grabbing' : 'grab',
          zIndex: FLOATING_Z_INDEX,
          transition: isDraggingBubble
            ? 'none'
            : `transform ${motion.duration.fast} ${motion.easing.easeInOut}`,
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

  return (
    <div
      style={
        isEmbedded
          ? {
              position: 'relative',
              width: '100%',
              maxHeight: isMobile ? 'min(78vh, 720px)' : 'min(780px, 80vh)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: colors.surfaceElevated,
              borderRadius: radius.lg,
              boxShadow: shadows.cardElevated,
              border: `1px solid ${colors.accentMuted}`,
              overflow: 'hidden',
            }
          : {
              position: 'fixed',
              bottom: `max(${spacing.lg}, env(safe-area-inset-bottom))`,
              left: isMobile ? spacing.md : spacing.lg,
              right: isMobile ? spacing.md : 'auto',
              width: isMobile ? 'auto' : 'min(420px, 90vw)',
              maxHeight: isMobile ? 'min(72vh, 640px)' : 'min(600px, 70vh)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: FLOATING_Z_INDEX,
              backgroundColor: colors.surfaceElevated,
              borderRadius: radius.lg,
              boxShadow: shadows.cardElevated,
              border: `1px solid ${colors.accentMuted}`,
              overflow: 'hidden',
              animation: 'slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }
      }
      className="message-board-container"
    >
      <div
        style={{
          padding: `${spacing.sm} ${spacing.md}`,
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold',
          cursor: isEmbedded ? 'default' : 'pointer',
          borderBottom: `1px solid ${colors.accentMuted}`,
        }}
        onClick={handleToggle}
      >
        <span>Messages</span>
        {!isEmbedded && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleToggle();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
              color: colors.textPrimary,
            }}
            aria-label="Minimize"
          >
            −
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {toast && <Toast message={toast.message} type={toast.type} />}

        <ChatWindow isEditMode={isEditMode} onToggleEditMode={() => setIsEditMode(!isEditMode)}>
          <MessageList
            messages={messages ?? null}
            isLoading={isLoading}
            error={error}
            currentUser={currentUser}
            onDelete={handleDelete}
            onReaction={handleReaction}
            isSubmitting={isSubmitting}
            isEditMode={isEditMode}
          />
          <MessageInput
            key={currentUser || 'anonymous'}
            currentUser={currentUser}
            isSubmitting={isSubmitting}
            onSend={handleSend}
            onError={(msg) => console.error(msg)}
          />
        </ChatWindow>
      </div>
    </div>
  );
};

export default MessageBoard;
