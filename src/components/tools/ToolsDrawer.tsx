import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import './ToolsDrawer.css';

export type ToolId = 'messages' | 'spin' | 'snake' | 'food-drop' | 'quiz' | 'matchmaker';

interface ToolOption {
  id: ToolId;
  label: string;
}

interface ToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  options: ToolOption[];
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ToolsDrawer: React.FC<ToolsDrawerProps> = ({
  isOpen,
  onClose,
  activeTool,
  onSelectTool,
  options,
  children,
}) => {
  const isMobile = useMediaQuery(breakpoints.sm);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      previousFocusRef.current?.focus();
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && panelRef.current) {
        const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
        if (!nodes.length) {
          event.preventDefault();
          return;
        }

        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="tools-drawer" aria-hidden={false}>
      <button className="tools-drawer__backdrop" type="button" onClick={onClose} aria-label="Close tools" />
      <section
        ref={panelRef}
        id="tools-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Tools"
        className={`tools-drawer__panel${isMobile ? ' is-mobile' : ''}`}
      >
        <header className="tools-drawer__header">
          <h2 className="tools-drawer__title">Tools</h2>
          <button type="button" className="tools-drawer__close" onClick={onClose}>
            Close
          </button>
        </header>

        <div className={`tools-drawer__body${isMobile ? ' is-mobile' : ''}`}>
          <nav className="tools-drawer__nav" aria-label="Tool chooser">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`tools-drawer__nav-btn${activeTool === option.id ? ' is-active' : ''}`}
                onClick={() => onSelectTool(option.id)}
              >
                {option.label}
              </button>
            ))}
          </nav>
          <div className="tools-drawer__content">{children}</div>
        </div>
      </section>
    </div>,
    document.body
  );
};

export default ToolsDrawer;
