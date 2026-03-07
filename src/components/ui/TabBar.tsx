import React, { useRef } from 'react';
import { MainTab } from '@/types';
import { spacing } from '@/design-system/tokens';
import './ui.css';

interface TabBarItem {
  id: MainTab;
  label: string;
  icon?: string;
}

interface TabBarProps {
  tabs: TabBarItem[];
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
  mobileFixed?: boolean;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onChange, mobileFixed = false }) => {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = tabs.length - 1;
    let nextIndex = index;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = index === lastIndex ? 0 : index + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = index === 0 ? lastIndex : index - 1;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    const nextTab = tabs[nextIndex];
    if (nextTab) {
      onChange(nextTab.id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <nav
      className={`app-tabbar ${mobileFixed ? 'app-tabbar--mobile' : ''}`}
      aria-label="Primary navigation"
    >
      <div
        className="app-tabbar__inner"
        role="tablist"
        aria-orientation="horizontal"
        style={{ gap: spacing.xs, ['--tab-count' as string]: String(tabs.length) }}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`app-tabbar__tab ${isActive ? 'is-active' : ''}`}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.icon && (
                <span className="app-tabbar__icon" aria-hidden>
                  {tab.icon}
                </span>
              )}
              <span className="app-tabbar__label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;
