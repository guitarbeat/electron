import React from 'react';
import Button from '@/ui/Button';
import { MagicWandIcon } from '@/common/icons';

interface SurpriseButtonProps {
  onClick: () => void;
  /** True while any async action in the parent is in flight — dims and disables the button. */
  isBusy?: boolean;
  /** Whether there are items to pick from; dims and disables when false. */
  canSurprise: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * "Surprise me" wand button shared by both the watchlist and places toolbars.
 */
const SurpriseButton: React.FC<SurpriseButtonProps> = ({
  onClick,
  isBusy = false,
  canSurprise,
  className,
  ariaLabel = 'Pick randomly',
}) => (
  <Button
    type="button"
    variant="ghost"
    onClick={onClick}
    disabled={isBusy || !canSurprise}
    title="Surprise me"
    aria-label={ariaLabel}
    className={className}
    style={{
      minWidth: '44px',
      minHeight: '2.75rem',
      flex: '0 0 auto',
      opacity: canSurprise && !isBusy ? 1 : 0.5,
    }}
  >
    <MagicWandIcon style={{ width: 18, height: 18 }} />
  </Button>
);

export default SurpriseButton;
