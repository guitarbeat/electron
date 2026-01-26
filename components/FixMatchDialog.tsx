import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { colors, radius, spacing, typography, zIndex, shadows, motion } from '../design-system/tokens';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import IconButton from './ui/IconButton';
import { MagicWandIcon, XIcon, SearchIcon, Spinner } from './icons';

interface FixMatchDialogProps {
  isOpen: boolean;
  movieTitle: string;
  onClose: () => void;
  onSearch: (searchTerm: string) => Promise<boolean>;
}

const FixMatchDialog: React.FC<FixMatchDialogProps> = ({
  isOpen,
  movieTitle,
  onClose,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState(movieTitle);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.classList.remove('modal-open');
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const success = await onSearch(searchTerm);
      if (success) {
        onClose();
      } else {
        setError('No match found. Please try a different title.');
      }
    } catch (err) {
      setError('An error occurred while searching.');
    } finally {
      setIsSearching(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: zIndex.modal,
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? 'auto' : 'none',
      transition: 'opacity 0.2s ease-out',
    }} onClick={onClose}>
      <Card
        variant="elevated"
        style={{
          width: '90%',
          maxWidth: '400px',
          padding: spacing.lg,
          transform: isOpen ? 'scale(1)' : 'scale(0.95)',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: spacing.md,
          position: 'relative'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: typography.fontSize.xl, 
            fontWeight: typography.fontWeight.bold,
            color: colors.textPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            textShadow: `0 0 15px ${colors.accent}60`,
            letterSpacing: '-0.02em',
          }}>
            <MagicWandIcon style={{ color: colors.accent, filter: `drop-shadow(0 0 5px ${colors.accent})` }} />
            Resolve Match
          </h3>
          <IconButton
            onClick={onClose}
            variant="ghost"
            size="sm"
            style={{ 
              color: colors.textTertiary,
              transition: 'all 0.2s ease',
            }}
          >
            <XIcon />
          </IconButton>
        </div>

        <p style={{ 
          fontSize: typography.fontSize.sm, 
          color: colors.textSecondary, 
          marginBottom: spacing.xl,
          lineHeight: typography.lineHeight.normal,
          opacity: 0.8,
        }}>
          If the current details aren't right, type the exact movie or show title below to fetch a fresh set of metadata.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: spacing.lg }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Movie title..."
              autoFocus
              icon={<SearchIcon />}
              style={{ width: '100%' }}
              disabled={isSearching}
            />
            {error && (
              <p style={{ 
                color: colors.error, 
                fontSize: typography.fontSize.xs, 
                marginTop: spacing.sm,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}>
                <span>⚠️</span> {error}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md }}>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSearching}
              style={{ fontWeight: typography.fontWeight.semibold }}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSearching || !searchTerm.trim()}
              style={{ 
                minWidth: '120px',
                fontWeight: typography.fontWeight.bold,
                boxShadow: `0 0 20px ${colors.accent}40`,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}
            >
              {isSearching ? (
                <>
                  <Spinner style={{ width: '16px', height: '16px', marginRight: spacing.sm }} />
                  Updating...
                </>
              ) : (
                'Save Match'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>,
    document.body
  );
};

export default FixMatchDialog;
