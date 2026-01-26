import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';
import { useSuggestions } from '../hooks/useSuggestions';
import { User, MovieSuggestion } from '../types';
import { CheckIcon, TrashIcon } from './icons';

interface SuggestionListProps {
  currentUser: User;
  onMovieAdded?: () => void;
}

type TabType = 'pending' | 'accepted' | 'rejected';

const SuggestionList: React.FC<SuggestionListProps> = ({ currentUser, onMovieAdded }) => {
  const {
    pendingSuggestions,
    acceptedSuggestions,
    rejectedSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    isLoading,
  } = useSuggestions();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (suggestion: MovieSuggestion) => {
    setProcessingId(suggestion.id);
    try {
      await acceptSuggestion(suggestion.id, currentUser);
      onMovieAdded?.();
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (suggestion: MovieSuggestion) => {
    setProcessingId(suggestion.id);
    try {
      await rejectSuggestion(suggestion.id, currentUser);
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getSuggestions = (): MovieSuggestion[] => {
    switch (activeTab) {
      case 'pending':
        return pendingSuggestions;
      case 'accepted':
        return acceptedSuggestions;
      case 'rejected':
        return rejectedSuggestions;
    }
  };

  const currentSuggestions = getSuggestions();

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: pendingSuggestions.length },
    { key: 'accepted', label: 'Accepted', count: acceptedSuggestions.length },
    { key: 'rejected', label: 'Rejected', count: rejectedSuggestions.length },
  ];

  if (isLoading) {
    return (
      <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          Loading suggestions...
        </div>
      </Card>
    );
  }

  const totalSuggestions =
    pendingSuggestions.length + acceptedSuggestions.length + rejectedSuggestions.length;

  if (totalSuggestions === 0) {
    return null; // Don't show if no suggestions
  }

  return (
    <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
      <div style={{ padding: spacing.xl }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.lg,
            flexWrap: 'wrap',
            gap: spacing.sm,
          }}
        >
          <h3
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: colors.secondary,
              background: shadows.textGradientBlue,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))',
            }}
          >
            🎁 Movie Suggestions
          </h3>
          {pendingSuggestions.length > 0 && (
            <span
              style={{
                backgroundColor: colors.accent,
                color: colors.textPrimary,
                padding: `${spacing.xs} ${spacing.md}`,
                borderRadius: radius.full,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                boxShadow: shadows.glow,
                animation: 'pulse 2s infinite',
              }}
            >
              {pendingSuggestions.length} new
            </span>
          )}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            marginBottom: spacing.lg,
            borderBottom: `1px solid ${colors.borderSecondary}`,
            paddingBottom: spacing.sm,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: activeTab === tab.key ? colors.surfaceElevated : 'transparent',
                border: 'none',
                borderRadius: radius.md,
                color: activeTab === tab.key ? colors.textPrimary : colors.textSecondary,
                fontSize: typography.fontSize.sm,
                fontWeight:
                  activeTab === tab.key
                    ? typography.fontWeight.semibold
                    : typography.fontWeight.normal,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: typography.fontFamily.body.join(', '),
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Suggestions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {currentSuggestions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: spacing.xl,
                color: colors.textTertiary,
                fontSize: typography.fontSize.base,
              }}
            >
              No {activeTab} suggestions
            </div>
          ) : (
            currentSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                style={{
                  padding: spacing.lg,
                  backgroundColor: 'rgba(27, 40, 69, 0.6)',
                  borderRadius: radius.md,
                  border: `1px solid ${colors.borderSecondary}40`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: spacing.md,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4
                      style={{
                        margin: 0,
                        marginBottom: spacing.xs,
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.textPrimary,
                      }}
                    >
                      {suggestion.title}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: typography.fontSize.sm,
                        color: colors.textSecondary,
                      }}
                    >
                      Suggested by{' '}
                      <span style={{ color: colors.accent }}>{suggestion.suggestedBy}</span>
                    </p>
                    {suggestion.reason && (
                      <p
                        style={{
                          margin: 0,
                          marginTop: spacing.sm,
                          fontSize: typography.fontSize.sm,
                          color: colors.textTertiary,
                          fontStyle: 'italic',
                          lineHeight: typography.lineHeight.relaxed,
                        }}
                      >
                        "{suggestion.reason}"
                      </p>
                    )}
                  </div>

                  {activeTab === 'pending' && (
                    <div style={{ display: 'flex', gap: spacing.sm, flexShrink: 0 }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAccept(suggestion)}
                        disabled={processingId === suggestion.id}
                        isLoading={processingId === suggestion.id}
                        style={{
                          backgroundColor: colors.success,
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                        }}
                      >
                        <CheckIcon style={{ width: '1rem', height: '1rem' }} />
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReject(suggestion)}
                        disabled={processingId === suggestion.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                          opacity: 0.7,
                        }}
                      >
                        <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                        Reject
                      </Button>
                    </div>
                  )}

                  {activeTab !== 'pending' && suggestion.respondedBy && (
                    <span
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.textTertiary,
                        flexShrink: 0,
                      }}
                    >
                      {activeTab === 'accepted' ? 'Added' : 'Rejected'} by {suggestion.respondedBy}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

export default SuggestionList;
