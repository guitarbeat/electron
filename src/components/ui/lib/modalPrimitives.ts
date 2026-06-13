import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { colors, radius, spacing, zIndex } from '@/theme/tokens';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const trapFocusOnTab = (
  event: KeyboardEvent | ReactKeyboardEvent,
  container: HTMLElement | null
): void => {
  if (event.key !== 'Tab' || !container) return;

  const focusableNodes = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((node) => !node.hasAttribute('disabled'));

  if (!focusableNodes.length) {
    event.preventDefault();
    return;
  }

  const [first] = focusableNodes;
  const last = focusableNodes[focusableNodes.length - 1] ?? first;
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

export const isFocusWithin = (container: HTMLElement | null): boolean => {
  if (!container) return false;
  const active = document.activeElement as HTMLElement | null;
  return active !== null && container.contains(active);
};

export const getModalOverlayStyle = (
  backgroundColor: string = colors.overlay,
  alignItems: CSSProperties['alignItems'] = 'center',
  padding: CSSProperties['padding'] = spacing.md
): CSSProperties => ({
  position: 'fixed',
  inset: 0,
  backgroundColor,
  backdropFilter: 'blur(4px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems,
  zIndex: zIndex.modal,
  padding,
});

export const getModalCloseButtonStyle = (): CSSProperties => ({
  position: 'absolute',
  top: spacing.sm,
  right: spacing.sm,
  width: '34px',
  height: '34px',
  borderRadius: radius.full,
  border: `1px solid ${colors.borderSubtle}`,
  background: colors.surface2,
  color: colors.textPrimary,
  cursor: 'pointer',
  lineHeight: 1,
});
