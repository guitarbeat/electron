import React, { useState } from 'react';
import BottomSheet from '../../ui/BottomSheet';
import { ChevronDownIcon } from '../../common/icons';
import { typography } from '../../../design-system/tokens';
import { SortMode } from '../types';

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'title', label: 'A-Z' },
  { id: 'year', label: 'Year' },
];

interface WatchlistMoreMenuProps {
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  isMobile: boolean;
}

const WatchlistMoreMenu: React.FC<WatchlistMoreMenuProps> = ({ sortMode, setSortMode, isMobile }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          className="watchlist-more-trigger"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          style={{ fontFamily: typography.fontFamily.body.join(', ') }}
        >
          <span>Sort</span>
          <ChevronDownIcon size={14} aria-hidden />
        </button>
        <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Filters">
          <div className="watchlist-more-menu">
            <p className="watchlist-more-menu__label">Sort by</p>
            <div className="watchlist-more-menu__list">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`watchlist-more-menu__item${sortMode === option.id ? ' is-active' : ''}`}
                  onClick={() => {
                    setSortMode(option.id);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <details className="watchlist-more">
      <summary className="watchlist-more-trigger">
        <span>Sort</span>
        <ChevronDownIcon size={14} aria-hidden />
      </summary>
      <div className="watchlist-more-menu" role="menu" aria-label="More options">
        <p className="watchlist-more-menu__label">Sort by</p>
        <div className="watchlist-more-menu__list">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`watchlist-more-menu__item${sortMode === option.id ? ' is-active' : ''}`}
              onClick={() => setSortMode(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
};

export default WatchlistMoreMenu;
