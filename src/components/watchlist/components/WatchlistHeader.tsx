import React from 'react';
import { spacing, typography } from '@/design-system/tokens';

interface WatchlistHeaderProps {
  title?: string;
  subtitle?: string;
}

const WatchlistHeader: React.FC<WatchlistHeaderProps> = ({ title = 'Watchlist', subtitle }) => {
  return (
    <header className="watchlist-header">
      <h1 className="watchlist-title">{title}</h1>
      {subtitle && <p className="watchlist-subtitle">{subtitle}</p>}
    </header>
  );
};

export default WatchlistHeader;
