import React, { useState, useRef, useEffect } from 'react';
import { colors, radius, shadows, spacing, typography, zIndex } from '../../design-system/tokens';

interface MenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

interface MenuItemProps {
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
}

export const Menu: React.FC<MenuProps> = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer', display: 'flex' }}>
        {trigger}
      </div>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            [align]: 0,
            marginTop: spacing.xs,
            minWidth: '180px',
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.md,
            boxShadow: shadows.cardElevated,
            border: `1px solid ${colors.borderInset}`,
            zIndex: zIndex.dropdown,
            overflow: 'hidden',
            animation: 'scale-in 0.15s ease-out',
            transformOrigin: align === 'right' ? 'top right' : 'top left',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const MenuItem: React.FC<MenuItemProps> = ({
  onClick,
  children,
  variant = 'default',
  icon,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={(e) => {
        onClick(e);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: `${spacing.sm} ${spacing.md}`,
        background: isHovered
          ? variant === 'danger'
            ? `${colors.error}20`
            : colors.surface
          : 'transparent',
        border: 'none',
        color: variant === 'danger' ? colors.error : colors.textPrimary,
        cursor: 'pointer',
        fontSize: typography.fontSize.sm,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        transition: 'background-color 0.2s',
        outline: 'none',
        fontFamily: typography.fontFamily.body.join(','),
      }}
    >
      {icon && <span style={{ opacity: 0.8 }}>{icon}</span>}
      {children}
    </button>
  );
};
