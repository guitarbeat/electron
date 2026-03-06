import React from 'react';

interface MinecraftLauncherProps {
  className?: string;
}

const MinecraftLauncher: React.FC<MinecraftLauncherProps> = ({ className = '' }) => {
  const serverAddress = '64.181.223.201';
  const serverPort = '19132';

  const launchMinecraft = () => {
    // For Windows - try to launch Minecraft with server connection
    const minecraftUrl = `minecraft://${serverAddress}:${serverPort}`;
    
    // Try to open the Minecraft protocol handler
    window.open(minecraftUrl, '_blank');
    
    // Fallback: Copy server info to clipboard
    const serverInfo = `Server: ${serverAddress}\nPort: ${serverPort}`;
    navigator.clipboard.writeText(serverInfo).then(() => {
      alert('Minecraft launch attempted! If it didn\'t work, server info copied to clipboard:\n' + serverInfo);
    }).catch(() => {
      alert('Minecraft launch attempted! Server info:\n' + serverInfo);
    });
  };

  return (
    <button
      onClick={launchMinecraft}
      className={`minecraft-launcher-btn ${className}`}
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
        transition: 'all 0.3s ease'
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
  );
};

export default MinecraftLauncher;
