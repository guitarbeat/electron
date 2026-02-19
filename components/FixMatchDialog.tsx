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
  movieTitle: string;
  onClose: () => void;
  onSelect: (metadata: MetadataResult) => Promise<void>;
}

const FixMatchDialog: React.FC<FixMatchDialogProps> = ({
  isOpen,
  movieTitle,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState(movieTitle);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MetadataResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm(movieTitle);
      setResults([]);
      setError(null);
    }
  }, [isOpen, movieTitle]);

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
    setResults([]);

    try {
      const searchResults = await searchMovies(searchTerm);
      if (searchResults.length > 0) {
        setResults(searchResults);
      } else {
        setError('No matches found. Please try a different title.');
      }
    } catch (err) {
      setError('An error occurred while searching.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (result: MetadataResult) => {
    setIsSearching(true);
    try {
      // Result from 'search' might be partial (OMDb search doesn't give plot/rating)
      // So we fetch the full metadata for the specific title/ID
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
    >
      <Card
        variant="elevated"
        style={{
          width: '90%',
          maxWidth: '400px',
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
            Resolve Match
          </h3>
          <IconButton
            onClick={onClose}
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
            marginBottom: spacing.xl,
            lineHeight: typography.lineHeight.normal,
            opacity: 0.8,
          }}
        >
          If the current details aren't right, type the exact movie or show title below to fetch a
          fresh set of metadata.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: spacing.lg }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Movie title..."
              autoFocus
              style={{ width: '100%' }}
              disabled={isSearching}
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
        </form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: spacing.md,
            marginTop: spacing.md,
          }}
        >
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
            onClick={handleSubmit} // Re-bind Search to handleSubmit
            type="button"
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
              'Search Results'
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div
            style={{
              marginTop: spacing.md,
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '4px',
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
                padding: `${spacing.sm} ${spacing.md}`,
                margin: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderBottom: `1px solid ${colors.borderSecondary}10`,
                fontWeight: typography.fontWeight.bold,
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}
            >
              Search Results
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {results.map((result, idx) => (
                <div
                  key={result.id || idx}
                  onClick={() => handleSelect(result)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(result);
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,105,180,0.08)';
                    e.currentTarget.style.outline = `2px solid ${colors.accent}`;
                    e.currentTarget.style.outlineOffset = '-2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.outline = 'none';
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select ${result.title} (${result.year})`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.md,
                    borderBottom:
                      idx === results.length - 1 ? 'none' : `1px solid ${colors.borderSecondary}10`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,105,180,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.currentTarget) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '56px',
                      backgroundColor: colors.background,
                      borderRadius: radius.sm,
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: shadows.card,
                    }}
                  >
                    {result.posterUrl ? (
                      <img
                        src={result.posterUrl}
                        alt=""
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
                        <MagicWandIcon style={{ width: '16px' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: typography.fontSize.sm,
                        color: colors.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: typography.fontWeight.semibold,
                      }}
                    >
                      {result.title}
                    </h4>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '2px',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                        {result.year}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          padding: '1px 4px',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          color: colors.textTertiary,
                          textTransform: 'uppercase',
                          fontWeight: typography.fontWeight.bold,
                        }}
                      >
                        {result.type || 'Movie'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ padding: '4px 12px', fontSize: '11px', height: '28px' }}
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>,
    document.body
  );
};

export default FixMatchDialog;
