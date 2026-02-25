import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MagicWandIcon, XIcon, Spinner } from './icons';
import {
  colors,
  radius,
  spacing,
  typography,
  zIndex,
  shadows,
  motion,
} from '../design-system/tokens';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import IconButton from './ui/IconButton';
import { searchMovies, MetadataResult, fetchMovieMetadata } from '../services/metadataService';

interface FixMatchDialogProps {
  isOpen: boolean;
  movie: { id: string; title: string } | null;
  onClose: () => void;
  onSelect: (metadata: MetadataResult) => Promise<void>;
  onRename: (newName: string) => Promise<void>;
}

const FixMatchDialog: React.FC<FixMatchDialogProps> = ({
  isOpen,
  movie,
  onClose,
  onSelect,
  onRename,
}) => {
  const [searchTerm, setSearchTerm] = useState(movie?.title || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [results, setResults] = useState<MetadataResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && movie) {
      setSearchTerm(movie.title);
      setResults([]);
      setError(null);
    }
  }, [isOpen, movie]);

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

  if (!isOpen || !movie) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const searchResults = await searchMovies(searchTerm);
      if (searchResults.length > 0) {
        setResults(searchResults);
      } else {
        setError('No matches found. Please try a different title or use Rename Only.');
      }
    } catch (err) {
      setError('An error occurred while searching.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRenameOnly = async () => {
    if (!searchTerm.trim() || searchTerm === movie.title) return;
    setIsRenaming(true);
    try {
      await onRename(searchTerm.trim());
      onClose();
    } catch (err) {
      setError('Failed to rename movie.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleSelect = async (result: MetadataResult) => {
    setIsSearching(true);
    try {
      const fullMetadata = await fetchMovieMetadata(result.title!, result.type, result.id);
      await onSelect(fullMetadata);
      onClose();
    } catch (err) {
      setError('Failed to update metadata.');
    } finally {
      setIsSearching(false);
    }
  };

  return createPortal(
    <div
      style={{
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
      }}
      onClick={onClose}
      role="button"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClose();
      }}
    >
      <Card
        variant="elevated"
        style={{
          width: '90%',
          maxWidth: '460px',
          padding: spacing.lg,
          transform: isOpen ? 'scale(1)' : 'scale(0.95)',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e?.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
            position: 'relative',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.textPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              textShadow: `0 0 15px ${colors.accent}60`,
              letterSpacing: '-0.02em',
            }}
          >
            <MagicWandIcon
              style={{ color: colors.accent, filter: `drop-shadow(0 0 5px ${colors.accent})` }}
            />
            Edit Movie Details
          </h3>
          <IconButton
            onClick={onClose}
            role="button"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onClose();
            }}
            variant="ghost"
            size="sm"
            aria-label="Close"
            style={{
              color: colors.textTertiary,
              transition: 'all 0.2s ease',
            }}
          >
            <XIcon />
          </IconButton>
        </div>

        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.textSecondary,
            marginBottom: spacing.lg,
            lineHeight: typography.lineHeight.normal,
            opacity: 0.8,
          }}
        >
          Update the title to rename it, or search to find better poster and details from the movie
          database.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: spacing.md }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Movie title..."
              autoFocus
              style={{ width: '100%' }}
              disabled={isSearching || isRenaming}
            />
            {error && (
              <p
                style={{
                  color: colors.error,
                  fontSize: typography.fontSize.xs,
                  marginTop: spacing.sm,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                <span>⚠️</span> {error}
              </p>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              marginBottom: spacing.xl,
            }}
          >
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRenameOnly}
              disabled={
                isSearching || isRenaming || !searchTerm.trim() || searchTerm === movie.title
              }
              style={{ flex: 1, fontSize: '0.7rem' }}
            >
              {isRenaming ? 'Renaming...' : 'Rename Only'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSearching || isRenaming || !searchTerm.trim()}
              style={{
                flex: 1,
                fontSize: '0.7rem',
                boxShadow: `0 0 15px ${colors.accent}30`,
              }}
            >
              {isSearching ? (
                <>
                  <Spinner style={{ width: '12px', height: '12px', marginRight: spacing.xs }} />
                  Searching...
                </>
              ) : (
                'Search & Match'
              )}
            </Button>
          </div>
        </form>

        {results.length > 0 && (
          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '2px',
              borderRadius: radius.md,
              border: `1px solid ${colors.borderSecondary}20`,
              backgroundColor: 'rgba(0,0,0,0.2)',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                color: colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: `${spacing.xs} ${spacing.md}`,
                margin: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderBottom: `1px solid ${colors.borderSecondary}10`,
                fontWeight: typography.fontWeight.bold,
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}
            >
              Pick the correct match
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {results.map((result, idx) => (
                <div
                  key={result.id || idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(result)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(result);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.sm,
                    borderBottom:
                      idx === results.length - 1 ? 'none' : `1px solid ${colors.borderSecondary}10`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,105,180,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '48px',
                      backgroundColor: colors.background,
                      borderRadius: radius.sm,
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {result.posterUrl ? (
                      <img
                        src={result.posterUrl}
                        alt={`Poster for ${result.title}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.2,
                        }}
                      >
                        <MagicWandIcon style={{ width: '14px' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: typography.fontSize.xs,
                        color: colors.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: typography.fontWeight.semibold,
                      }}
                    >
                      {result.title}
                    </h4>
                    <span style={{ fontSize: '10px', color: colors.textSecondary }}>
                      {result.year} • {result.type || 'Movie'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{ padding: '2px 8px', fontSize: '10px', height: '24px' }}
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: spacing.md,
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            role="button"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onClose();
            }}
            disabled={isSearching || isRenaming}
            style={{ color: colors.textTertiary }}
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>,
    document.body
  );
};

export default FixMatchDialog;
