import React from 'react';
import { useToast } from '@/context/ToastContext';

interface MinecraftLauncherProps {
  className?: string;
}

const MinecraftLauncher: React.FC<MinecraftLauncherProps> = ({ className = '' }) => {
  const { showToast } = useToast();
  const serverAddress = import.meta.env.VITE_MINECRAFT_SERVER_ADDRESS || 'localhost';
  const serverPort = import.meta.env.VITE_MINECRAFT_SERVER_PORT || '25565';

  const copyToClipboard = async (text: string): Promise<boolean> => {
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
  };

  const launchMinecraft = async () => {
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
  };

  return (
    <div className={`minecraft-launcher ${className}`}>
      <button
        onClick={launchMinecraft}
        className="minecraft-launcher-btn"
        aria-label={`Launch Minecraft on server ${serverAddress}:${serverPort}`}
      >
        <span className="minecraft-icon" role="img" aria-label="Pickaxe">
          ⛏️
        </span>
        Launch Minecraft
      </button>
    </div>
  );
};

export default MinecraftLauncher;
