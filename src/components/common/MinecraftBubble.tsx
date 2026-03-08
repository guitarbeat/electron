import React, { useState, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { useFloatingBubbleDrag } from '@/hooks/useFloatingBubbleDrag';
import {
  getFloatingBubbleButtonStyle,
  FLOATING_BUBBLE_SIZE,
  FLOATING_BUBBLE_EDGE_MARGIN,
} from '../ui/floatingBubbleStyles';

interface MinecraftBubbleProps {
  className?: string;
}

const MinecraftBubble: React.FC<MinecraftBubbleProps> = ({ className = '' }) => {
  const { showToast } = useToast();
  const serverAddress = import.meta.env.VITE_MINECRAFT_SERVER_ADDRESS || 'localhost';
  const serverPort = import.meta.env.VITE_MINECRAFT_SERVER_PORT || '25565';

  const [showTooltip, setShowTooltip] = useState(false);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    // Try modern clipboard API first (works on HTTPS/localhost)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.warn('Modern clipboard API failed:', error);
      }
    }

    // Fallback for HTTP environments using execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      return successful;
    } catch (error) {
      console.warn('Fallback clipboard method failed:', error);
      return false;
    }
  }, []);

  const launchMinecraft = useCallback(async () => {
    const minecraftUrl = `minecraft://${serverAddress}:${serverPort}`;
    const serverInfo = `Server: ${serverAddress}\nPort: ${serverPort}`;

    try {
      // Try to open the Minecraft protocol handler
      const newWindow = window.open(minecraftUrl, '_blank');

      // Check if window.open was blocked or failed
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        throw new Error('Popup blocked or protocol not supported');
      }

      // Attempt to copy server info to clipboard as backup
      try {
        const copied = await copyToClipboard(serverInfo);
        if (copied) {
          showToast({
            message: 'Minecraft launch attempted! Server info copied to clipboard as backup.',
            type: 'info',
            duration: 3000,
          });
        } else {
          showToast({
            message: `Minecraft launch attempted! Server info: ${serverInfo.replace('\n', ', ')}`,
            type: 'info',
            duration: 5000,
          });
        }
      } catch (clipboardError) {
        // Clipboard failed, but protocol launch succeeded
        showToast({
          message: `Minecraft launch attempted! Server info: ${serverInfo.replace('\n', ', ')}`,
          type: 'info',
          duration: 3000,
        });
      }
    } catch (error) {
      // Protocol launch failed, try to copy server info
      try {
        const copied = await copyToClipboard(serverInfo);
        if (copied) {
          showToast({
            message: 'Minecraft protocol not supported. Server info copied to clipboard.',
            type: 'info',
            duration: 5000,
          });
        } else {
          showToast({
            message: `Minecraft protocol not supported. Please manually add server: ${serverInfo.replace(
              '\n',
              ', '
            )}`,
            type: 'error',
            duration: 8000,
          });
        }
      } catch (clipboardError) {
        // Both protocol and clipboard failed
        showToast({
          message: `Minecraft protocol not supported. Server info: ${serverInfo.replace('\n', ', ')}`,
          type: 'error',
          duration: 8000,
        });
      }
    }
  }, [copyToClipboard, serverAddress, serverPort, showToast]);

  const { position: bubblePosition, isDragging, bubbleProps } = useFloatingBubbleDrag({
    initialPosition: () => {
      const x = window.innerWidth - FLOATING_BUBBLE_SIZE - FLOATING_BUBBLE_EDGE_MARGIN - 80;
      const y = window.innerHeight - FLOATING_BUBBLE_SIZE - FLOATING_BUBBLE_EDGE_MARGIN - 80;
      return { x, y };
    },
    snapToEdge: true,
    onClick: () => {
      void launchMinecraft();
    },
  });

  return (
    <>
      <button
        className={`minecraft-bubble ${className}`}
        style={getFloatingBubbleButtonStyle(bubblePosition, isDragging)}
        {...bubbleProps}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={`Launch Minecraft on server ${serverAddress}:${serverPort}`}
      >
        <span role="img" aria-label="Pickaxe" style={{ fontSize: '24px' }}>
          ⛏️
        </span>
      </button>

      {showTooltip && !isDragging && (
        <div
          style={{
            position: 'fixed',
            left: bubblePosition.x + FLOATING_BUBBLE_SIZE / 2,
            top: bubblePosition.y - 10,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1001,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          Launch Minecraft
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid rgba(0, 0, 0, 0.9)',
            }}
          />
        </div>
      )}
    </>
  );
};

export default MinecraftBubble;
