import React from 'react';
import { useToast } from '../../../context/ToastContext';

interface MinecraftLauncherProps {
  className?: string;
}

const MinecraftLauncher: React.FC<MinecraftLauncherProps> = ({ className = '' }) => {
  const { showToast } = useToast();
  const serverAddress = '64.181.223.201';
  const serverPort = '25565'; // Java Edition server port
  const webInterfacePort = '8123';

  const launchMinecraft = async () => {
    const minecraftUrl = `minecraft://${serverAddress}:${serverPort}`;
    const serverInfo = `Server: ${serverAddress}\nPort: ${serverPort}\nWeb Interface: http://${serverAddress}:${webInterfacePort}`;

    try {
      // Try to open the Minecraft protocol handler
      const newWindow = window.open(minecraftUrl, '_blank');

      // Check if window.open was blocked or failed
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        throw new Error('Popup blocked or protocol not supported');
      }

      // Attempt to copy server info to clipboard as backup
      try {
        await navigator.clipboard.writeText(serverInfo);
        showToast({
          message: 'Minecraft launch attempted! Server info copied to clipboard as backup.',
          type: 'info',
          duration: 3000,
        });
      } catch (clipboardError) {
        // Clipboard failed, but protocol launch succeeded
        showToast({
          message: "Minecraft launch attempted! If it didn't work, add server manually.",
          type: 'info',
          duration: 3000,
        });
      }
    } catch (error) {
      // Protocol launch failed, try to copy server info
      try {
        await navigator.clipboard.writeText(serverInfo);
        showToast({
          message: 'Minecraft protocol not supported. Server info copied to clipboard.',
          type: 'info',
          duration: 5000,
        });
      } catch (clipboardError) {
        // Both protocol and clipboard failed
        showToast({
          message: `Minecraft protocol not supported. Server: ${serverAddress}, Port: ${serverPort}`,
          type: 'error',
          duration: 8000,
        });
      }
    }
  };

  const openWebInterface = () => {
    window.open(`http://${serverAddress}:${webInterfacePort}`, '_blank');
    showToast({
      message: 'Opening Minecraft web interface...',
      type: 'info',
      duration: 2000,
    });
  };

  return (
    <div
      className={`minecraft-launcher ${className}`}
      style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
    >
      <button
        onClick={launchMinecraft}
        className="minecraft-launcher-btn"
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#45a049';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#4CAF50';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span style={{ fontSize: '20px' }}>⛏️</span>
        Launch Minecraft
      </button>

      <button
        onClick={openWebInterface}
        className="web-interface-btn"
        style={{
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1976D2';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2196F3';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span style={{ fontSize: '16px' }}>🌐</span>
        Web Interface
      </button>
    </div>
  );
};

export default MinecraftLauncher;
