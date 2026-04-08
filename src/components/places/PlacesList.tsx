import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser, useToast } from '@/app/providers';
import { usePlaces } from '@/hooks/places';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import SyncBanner from '../ui/SyncBanner.tsx';
import { colors, spacing, radius, typography, motion } from '../../theme/tokens.ts';
import type { Place, PlaceSuggestion } from '../../shared/types.ts';
import type { PlacesMapHandle } from './PlacesMap.tsx';
const PlacesMap = React.lazy(() => import('./PlacesMap.tsx'));
import PlaceCard from './PlaceCard.tsx';
import PlaceSuggestionCard from './PlaceSuggestionCard.tsx';
import PlaceEditModal from './PlaceEditModal.tsx';
import { buildPlaceSections } from './placeSections.ts';
import { usePlaceSuggestions } from '@/hooks/places';

const glassStyle: React.CSSProperties = {
  background: 'rgba(18, 11, 6, 0.72)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const PlacesList: React.FC = () => {
  const mapRef = useRef<PlacesMapHandle>(null);
  const trayScrollRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const {
    places,
    isLoading,
    isSubmitting,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    addPlace,
    removePlace,
    updatePlace,
    markVisited,
    markUnvisited,
    retrySync,
  } = usePlaces(currentUser);

  const {
    pendingSuggestions,
    addPlaceSuggestion,
    acceptPlaceSuggestion,
    rejectPlaceSuggestion,
    isDegraded: isSuggestionsDegraded,
    isSyncBlocked: isSuggestionsSyncBlocked,
    syncWarning: suggestionsSyncWarning,
    retrySync: retrySuggestionsSync,
  } = usePlaceSuggestions(isLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);
  const [placeToEdit, setPlaceToEdit] = useState<Place | null>(null);

  // Collapsible tray
  const [trayExpanded, setTrayExpanded] = useState(true);

  // Active card highlight
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const sections = useMemo(() => buildPlaceSections(places, pendingSuggestions), [places, pendingSuggestions]);

  const allPlaces = useMemo(
    () => [...sections.queue, ...sections.visited],
    [sections.queue, sections.visited]
  );

  const handleCardTap = useCallback((place: Place) => {
    if (typeof place.lat === 'number' && typeof place.lng === 'number') {
      mapRef.current?.flyTo(place.lng, place.lat);
    }
    // Set active highlight
    clearTimeout(activeTimerRef.current);
    setActiveCardId(place.id);
    activeTimerRef.current = setTimeout(() => setActiveCardId(null), 2500);

    // Scroll card into view
    const el = document.getElementById(`place-card-${place.id}`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  useEffect(() => () => clearTimeout(activeTimerRef.current), []);

  const handleAcceptSuggestion = useCallback(
    async (suggestion: PlaceSuggestion) => {
      if (!currentUser) return;
      setProcessingSuggestionId(suggestion.id);
      try {
        await addPlace(suggestion.name, suggestion.notes);
        await acceptPlaceSuggestion(suggestion.id, currentUser);
        showToast({ message: `"${suggestion.name}" added to places!`, type: 'success' });
      } catch (error) {
        showToast({
          message: error instanceof Error ? error.message : 'Failed to accept suggestion',
          type: 'error',
        });
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [acceptPlaceSuggestion, addPlace, currentUser, showToast]
  );

  const handleRejectSuggestion = useCallback(
    async (suggestionId: string, name: string) => {
      if (!currentUser) return;
      setProcessingSuggestionId(suggestionId);
      try {
        await rejectPlaceSuggestion(suggestionId, currentUser);
        showToast({ message: `"${name}" rejected.`, type: 'info' });
      } catch (error) {
        showToast({
          message: error instanceof Error ? error.message : 'Failed to reject suggestion',
          type: 'error',
        });
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [currentUser, rejectPlaceSuggestion, showToast]
  );

  const handleAddAction = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || isAdding) return;
    if (!currentUser) {
      showToast({ message: 'Pick Aaron or Electra to edit shared places.', type: 'info' });
      return;
    }
    setIsAdding(true);
    setSuggestionError(null);
    try {
      await addPlace(query);
      setSearchQuery('');
      showToast({ message: `"${query}" added!`, type: 'success' });
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'Failed to add place');
      showToast({ message: 'Failed to add place', type: 'error' });
    } finally {
      setIsAdding(false);
    }
  }, [addPlace, currentUser, isAdding, searchQuery, showToast]);

  const handleSuggestAction = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || isSuggesting) return;
    if (!currentUser) {
      showToast({ message: 'Pick Aaron or Electra to suggest places.', type: 'info' });
      return;
    }
    setIsSuggesting(true);
    setSuggestionError(null);
    try {
      await addPlaceSuggestion(query);
      setSearchQuery('');
      showToast({ message: `"${query}" suggested for review!`, type: 'success' });
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'Failed to suggest place');
      showToast({ message: 'Failed to suggest place', type: 'error' });
    } finally {
      setIsSuggesting(false);
    }
  }, [addPlaceSuggestion, currentUser, isSuggesting, searchQuery, showToast]);

  const confirmDelete = useCallback(async () => {
    if (!placeToDelete) return;
    const deleted = placeToDelete;
    try {
      await removePlace(deleted.id);
      showToast({ message: `"${deleted.name}" removed!`, type: 'info' });
    } catch {
      showToast({ message: 'Failed to remove place', type: 'error' });
    } finally {
      setPlaceToDelete(null);
    }
  }, [placeToDelete, removePlace, showToast]);

  const hasPlaces = allPlaces.length > 0;
  const showEmptyState = !isLoading && !hasPlaces;

  return (
    <div
      className="places-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: radius.xl,
      }}
    >
      {/* Sync banner at top */}
      {(isDegraded || isSuggestionsDegraded) && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
          <SyncBanner
            isBlocked={isSyncBlocked || isSuggestionsSyncBlocked}
            onRetry={async () => {
              await Promise.all([retrySync(), retrySuggestionsSync()]);
            }}
            label={
              isSyncBlocked || isSuggestionsSyncBlocked
                ? 'A shared places update conflicted with local edits. Refresh and retry.'
                : syncWarning || suggestionsSyncWarning || 'Places changes are being kept locally until shared sync recovers.'
            }
          />
        </div>
      )}

      {/* Full-height map */}
      <React.Suspense fallback={<div style={{ flex: 1, minHeight: 0, background: 'rgba(0,0,0,0.3)' }} />}>
        <PlacesMap
          ref={mapRef}
          places={places}
          canEdit={Boolean(currentUser)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSubmitSearch={handleAddAction}
          onSuggestPlace={handleSuggestAction}
          isAdding={isAdding}
          isSuggesting={isSuggesting}
          suggestionError={suggestionError}
          onUpdatePlace={updatePlace}
          onAddPlace={addPlace}
          style={{ flex: 1, minHeight: 0 }}
        />
      </React.Suspense>

      {/* Suggestions banner */}
      {sections.suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 56,
            left: spacing.md,
            right: spacing.md,
            zIndex: 15,
            ...glassStyle,
            borderRadius: radius.lg,
            border: `1px solid ${colors.border}`,
            padding: spacing.sm,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs,
            maxHeight: '30vh',
            overflowY: 'auto',
          }}
        >
          <span style={{ ...typography.presets.eyebrow, color: colors.accentLight, fontSize: typography.fontSize['2xs'] }}>
            {sections.suggestions.length} suggestion{sections.suggestions.length === 1 ? '' : 's'} pending
          </span>
          <div style={{ display: 'flex', gap: spacing.sm, overflowX: 'auto', paddingBottom: spacing.xs }}>
            {sections.suggestions.map((suggestion) => (
              <div key={suggestion.id} style={{ flex: '0 0 auto', width: 180 }}>
                <PlaceSuggestionCard
                  suggestion={suggestion}
                  onAccept={() => handleAcceptSuggestion(suggestion)}
                  onReject={() => handleRejectSuggestion(suggestion.id, suggestion.name)}
                  canRespond={Boolean(currentUser)}
                  isProcessing={processingSuggestionId === suggestion.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state overlay */}
      {showEmptyState && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              ...glassStyle,
              borderRadius: radius.xl,
              border: `1px solid ${colors.border}`,
              padding: `${spacing.xl} ${spacing['2xl']}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing.sm,
              pointerEvents: 'auto',
              textAlign: 'center',
              maxWidth: 280,
              animation: 'places-empty-fade-in 0.6s ease-out',
            }}
          >
            <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>🗺️</span>
            <span style={{
              fontFamily: typography.fontFamily.heading.join(', '),
              fontSize: typography.fontSize.lg,
              color: colors.textPrimary,
              letterSpacing: '0.02em',
            }}>
              No places yet
            </span>
            <span style={{
              ...typography.presets.bodySm,
              color: colors.textTertiary,
            }}>
              Search above to add your first spot
            </span>
          </div>
        </div>
      )}

      {/* Overlaid card tray at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 15,
          ...glassStyle,
          borderTop: `1px solid ${colors.border}`,
          transition: `max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)`,
          maxHeight: trayExpanded ? '220px' : '28px',
          overflow: 'hidden',
          display: (isLoading && places.length === 0) || hasPlaces ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        {/* Drag handle / toggle */}
        <button
          onClick={() => setTrayExpanded((v) => !v)}
          aria-label={trayExpanded ? 'Collapse card tray' : 'Expand card tray'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.xs,
            padding: `6px ${spacing.md}`,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 4,
              borderRadius: 2,
              background: colors.textTertiary,
              opacity: 0.5,
              transition: `opacity ${motion.duration.fast}`,
            }}
          />
          <span style={{
            fontSize: typography.fontSize['3xs'],
            color: colors.textTertiary,
            fontFamily: typography.fontFamily.heading.join(', '),
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            opacity: 0.6,
          }}>
            {trayExpanded ? '▾' : `▴ ${allPlaces.length} places`}
          </span>
        </button>

        {/* Card scroll area */}
        {isLoading && places.length === 0 ? (
          <div
            style={{
              padding: `0 ${spacing.md} ${spacing.md}`,
              display: 'flex',
              gap: spacing.md,
              overflowX: 'auto',
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ flex: '0 0 auto', width: 140 }}>
                <MovieCardSkeleton />
              </div>
            ))}
          </div>
        ) : hasPlaces ? (
          <div
            ref={trayScrollRef}
            style={{
              display: 'flex',
              gap: spacing.md,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              padding: `0 ${spacing.md} ${spacing.md}`,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {sections.queue.length > 0 && (
              <>
                <div
                  style={{
                    flex: '0 0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)',
                    ...typography.presets.eyebrow,
                    color: colors.accentLight,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: '0.08em',
                    paddingRight: spacing.xs,
                  }}
                >
                  TO TRY
                </div>
                {sections.queue.map((place, i) => (
                  <div
                    key={place.id}
                    id={`place-card-${place.id}`}
                    onClick={() => handleCardTap(place)}
                    style={{
                      flex: '0 0 auto',
                      width: 140,
                      scrollSnapAlign: 'start',
                      cursor: 'pointer',
                      animation: `place-card-stagger-in 0.3s ease-out ${i * 0.05}s both`,
                    }}
                  >
                    <PlaceCard
                      place={place}
                      canEdit={Boolean(currentUser)}
                      isSubmitting={isSubmitting}
                      isActive={activeCardId === place.id}
                      onMarkVisited={markVisited}
                      onMarkUnvisited={markUnvisited}
                      onDelete={setPlaceToDelete}
                      onEdit={setPlaceToEdit}
                    />
                  </div>
                ))}
              </>
            )}

            {sections.visited.length > 0 && (
              <>
                <div
                  style={{
                    flex: '0 0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)',
                    ...typography.presets.eyebrow,
                    color: colors.textTertiary,
                    fontSize: typography.fontSize['2xs'],
                    letterSpacing: '0.08em',
                    paddingRight: spacing.xs,
                  }}
                >
                  VISITED
                </div>
                {sections.visited.map((place, i) => (
                  <div
                    key={place.id}
                    id={`place-card-${place.id}`}
                    onClick={() => handleCardTap(place)}
                    style={{
                      flex: '0 0 auto',
                      width: 140,
                      scrollSnapAlign: 'start',
                      cursor: 'pointer',
                      animation: `place-card-stagger-in 0.3s ease-out ${(sections.queue.length + i) * 0.05}s both`,
                    }}
                  >
                    <PlaceCard
                      place={place}
                      canEdit={Boolean(currentUser)}
                      isSubmitting={isSubmitting}
                      isActive={activeCardId === place.id}
                      onMarkVisited={markVisited}
                      onMarkUnvisited={markUnvisited}
                      onDelete={setPlaceToDelete}
                      onEdit={setPlaceToEdit}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Modals */}
      {placeToDelete && (
        <ConfirmDialog
          isOpen={Boolean(placeToDelete)}
          title="Remove place"
          message={`Are you sure you want to remove "${placeToDelete.name}" from your list?`}
          onConfirm={confirmDelete}
          onCancel={() => setPlaceToDelete(null)}
          confirmText="Remove"
          variant="danger"
        />
      )}

      {placeToEdit && (
        <PlaceEditModal
          place={placeToEdit}
          onSave={async (id, updates) => { await updatePlace(id, updates); }}
          onClose={() => setPlaceToEdit(null)}
        />
      )}

      <style>{`
        @keyframes places-empty-fade-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes place-card-stagger-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default memo(PlacesList);
