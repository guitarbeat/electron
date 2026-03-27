import React, { useEffect, useRef, useState, useCallback } from 'react';
import MapLibreGL from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { colors, spacing, radius, typography, motion } from '@/theme/tokens';
import type { Place } from '@/shared/types';
import { PlusIcon, Spinner } from '@/common/icons';

const DEFAULT_CENTER: [number, number] = [-97.74, 30.27];
const DEFAULT_ZOOM = 3;
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

interface PlacesMapProps {
  places: Place[];
  canEdit?: boolean;
  // Search / add a place
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSubmitSearch: () => Promise<void> | void;
  isAdding: boolean;
  suggestionError: string | null;
  // Pin-drop callbacks
  onUpdatePlace?: (id: string, updates: Partial<Pick<Place, 'lat' | 'lng'>>) => Promise<void>;
  onAddPlace?: (name: string, notes?: string, lat?: number, lng?: number) => Promise<void>;
  style?: React.CSSProperties;
}

type PinMode = 'assign' | 'new';

interface PendingPin {
  lng: number;
  lat: number;
}

const PlacesMap: React.FC<PlacesMapProps> = ({
  places,
  canEdit = false,
  searchQuery = '',
  setSearchQuery = () => undefined,
  onSubmitSearch = () => undefined,
  isAdding = false,
  suggestionError = null,
  onUpdatePlace,
  onAddPlace,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const markersRef = useRef<MapLibreGL.Marker[]>([]);
  const pendingMarkerRef = useRef<MapLibreGL.Marker | null>(null);

  const [isDropMode, setIsDropMode] = useState(false);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [pinMode, setPinMode] = useState<PinMode>('assign');
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [newPlaceName, setNewPlaceName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const unmappedPlaces = places.filter(
    (p) => typeof p.lat !== 'number' || typeof p.lng !== 'number'
  );

  const cancelPin = useCallback(() => {
    pendingMarkerRef.current?.remove();
    pendingMarkerRef.current = null;
    setPendingPin(null);
    setSelectedPlaceId('');
    setNewPlaceName('');
    setPinMode('assign');
    setIsDropMode(false);
  }, []);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new MapLibreGL.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      renderWorldCopies: false,
      attributionControl: { compact: true },
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      pendingMarkerRef.current?.remove();
      pendingMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Drop-mode cursor + click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const canvas = map.getCanvas();

    const handleMapClick = (e: MapLibreGL.MapMouseEvent) => {
      if (!isDropMode) return;
      const { lng, lat } = e.lngLat;

      pendingMarkerRef.current?.remove();

      const el = document.createElement('div');
      el.style.cssText = `
        width: 18px; height: 18px; border-radius: 50%;
        background: ${colors.accentLight};
        border: 2.5px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.6);
        cursor: grab;
      `;

      const marker = new MapLibreGL.Marker({ element: el, draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        setPendingPin({ lng: pos.lng, lat: pos.lat });
      });

      pendingMarkerRef.current = marker;
      setPendingPin({ lng, lat });
      setSelectedPlaceId(unmappedPlaces[0]?.id ?? '');
    };

    if (isDropMode) {
      canvas.style.cursor = 'crosshair';
      map.on('click', handleMapClick);
    } else {
      canvas.style.cursor = '';
    }

    return () => {
      map.off('click', handleMapClick);
      if (!isDropMode) canvas.style.cursor = '';
    };
  }, [isDropMode, unmappedPlaces]);

  // Render saved-place markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const placesWithCoords = places.filter(
      (p): p is Place & { lat: number; lng: number } =>
        typeof p.lat === 'number' && typeof p.lng === 'number'
    );

    const updateMarkers = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      placesWithCoords.forEach((place) => {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 14px; height: 14px; border-radius: 50%;
          background: ${colors.accent};
          border: 2px solid rgba(255,255,255,0.8);
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          cursor: pointer;
        `;
        el.title = place.name;

        const marker = new MapLibreGL.Marker({ element: el })
          .setLngLat([place.lng, place.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });

      if (placesWithCoords.length === 1) {
        map.flyTo({ center: [placesWithCoords[0].lng, placesWithCoords[0].lat], zoom: 12 });
      } else if (placesWithCoords.length > 1) {
        const bounds = new MapLibreGL.LngLatBounds();
        placesWithCoords.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, { padding: 56, maxZoom: 14 });
      }
    };

    if (map.isStyleLoaded()) {
      updateMarkers();
    } else {
      map.once('load', updateMarkers);
    }
  }, [places]);

  const handleSavePin = useCallback(async () => {
    if (!pendingPin) return;
    setIsSaving(true);
    try {
      if (pinMode === 'assign' && selectedPlaceId && onUpdatePlace) {
        await onUpdatePlace(selectedPlaceId, { lat: pendingPin.lat, lng: pendingPin.lng });
      } else if (pinMode === 'new' && newPlaceName.trim() && onAddPlace) {
        await onAddPlace(newPlaceName.trim(), undefined, pendingPin.lat, pendingPin.lng);
      }
      cancelPin();
    } finally {
      setIsSaving(false);
    }
  }, [pendingPin, pinMode, selectedPlaceId, newPlaceName, onUpdatePlace, onAddPlace, cancelPin]);

  const canSave =
    pendingPin &&
    !isSaving &&
    (pinMode === 'assign' ? Boolean(selectedPlaceId) : newPlaceName.trim().length > 0);

  const glassStyle: React.CSSProperties = {
    background: 'rgba(18, 11, 6, 0.72)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
  };

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      {/* Map */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 'clamp(360px, 52vh, 580px)',
          borderRadius: radius.xl,
          overflow: 'hidden',
          border: `1px solid ${colors.borderSecondary}35`,
          background: colors.surface,
        }}
        aria-label="Map of saved places"
      />

      {/* ── Floating search bar ── */}
      <div
        style={{
          position: 'absolute',
          top: spacing.md,
          left: spacing.md,
          right: canEdit ? '120px' : spacing.md,
          zIndex: 10,
        }}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); void onSubmitSearch(); }}
          style={{ display: 'flex', gap: spacing.xs }}
        >
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Add a place…"
            aria-label="Place name"
            style={{
              flex: 1,
              ...glassStyle,
              color: colors.textPrimary,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.heading.join(', '),
              padding: `${spacing.sm} ${spacing.md}`,
              outline: 'none',
              border: `1px solid ${searchQuery ? colors.accent : colors.border}`,
              transition: `border-color ${motion.duration.fast}`,
              minWidth: 0,
            }}
          />
          {searchQuery.trim() && canEdit && (
            <button
              type="submit"
              disabled={isAdding}
              style={{
                ...glassStyle,
                padding: `${spacing.sm} ${spacing.md}`,
                color: isAdding ? colors.textTertiary : colors.accentLight,
                cursor: isAdding ? 'not-allowed' : 'pointer',
                border: `1px solid ${colors.accent}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Add place"
            >
              {isAdding ? <Spinner /> : <PlusIcon />}
            </button>
          )}
        </form>

        {suggestionError && (
          <div
            style={{
              marginTop: spacing.xs,
              padding: `${spacing.xs} ${spacing.sm}`,
              ...glassStyle,
              borderColor: 'rgba(220,80,60,0.5)',
              color: '#f87171',
              fontSize: typography.fontSize.xs,
            }}
          >
            {suggestionError}
          </div>
        )}
      </div>

      {/* ── Drop-pin toggle ── */}
      {canEdit && !pendingPin && (
        <button
          onClick={() => { setIsDropMode((p) => !p); if (isDropMode) cancelPin(); }}
          style={{
            position: 'absolute',
            top: spacing.md,
            right: spacing.md,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: `${spacing.sm} ${spacing.sm}`,
            ...glassStyle,
            background: isDropMode ? colors.accent : 'rgba(18, 11, 6, 0.72)',
            color: isDropMode ? '#fff' : colors.textSecondary,
            border: `1px solid ${isDropMode ? colors.accent : colors.border}`,
            borderRadius: radius.lg,
            fontSize: typography.fontSize.xs,
            fontFamily: typography.fontFamily.heading.join(', '),
            cursor: 'pointer',
            transition: `all ${motion.duration.fast} ${motion.easing.easeOut}`,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
          title={isDropMode ? 'Cancel pin drop' : 'Drop a pin manually'}
        >
          <span style={{ fontSize: '0.9em' }}>📍</span>
          {isDropMode ? 'Click map…' : 'Drop pin'}
        </button>
      )}

      {/* ── Pin assignment panel (floats at bottom of map) ── */}
      {pendingPin && canEdit && (
        <div
          style={{
            position: 'absolute',
            bottom: spacing.md,
            left: spacing.md,
            right: spacing.md,
            zIndex: 10,
            ...glassStyle,
            padding: spacing.md,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm,
            animation: `fade-in ${motion.duration.fast} ${motion.easing.easeOut}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ ...typography.presets.eyebrow, color: colors.accentLight }}>
              Pin this location
            </span>
            <div style={{ display: 'flex', borderRadius: radius.sm, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
              {(['assign', 'new'] as PinMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPinMode(m)}
                  style={{
                    padding: `3px ${spacing.xs}`,
                    fontSize: typography.fontSize['2xs'],
                    fontFamily: typography.fontFamily.heading.join(', '),
                    letterSpacing: '0.04em',
                    background: pinMode === m ? colors.accent : 'transparent',
                    color: pinMode === m ? '#fff' : colors.textTertiary,
                    border: 'none',
                    cursor: 'pointer',
                    transition: `background ${motion.duration.fast}`,
                  }}
                >
                  {m === 'assign' ? 'Existing place' : 'New place'}
                </button>
              ))}
            </div>
          </div>

          {pinMode === 'assign' ? (
            unmappedPlaces.length > 0 ? (
              <select
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                style={{
                  background: 'rgba(18,11,6,0.85)',
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.sm,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.heading.join(', '),
                  width: '100%',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select a place to pin…</option>
                {unmappedPlaces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <p style={{ ...typography.presets.bodySm, color: colors.textTertiary, margin: 0 }}>
                All places already have pins. Switch to "New place" to add one here.
              </p>
            )
          ) : (
            <input
              type="text"
              value={newPlaceName}
              onChange={(e) => setNewPlaceName(e.target.value)}
              placeholder="Name this place…"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && canSave) void handleSavePin(); }}
              style={{
                background: 'rgba(18,11,6,0.85)',
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.sm,
                padding: `${spacing.xs} ${spacing.sm}`,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.heading.join(', '),
                width: '100%',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          )}

          <p style={{ ...typography.presets.bodySm, color: colors.textTertiary, margin: 0, opacity: 0.7 }}>
            Drag the pin to fine-tune the position.
          </p>

          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
            <button
              onClick={cancelPin}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                background: 'transparent',
                color: colors.textTertiary,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.sm,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.heading.join(', '),
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSavePin()}
              disabled={!canSave}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                background: canSave ? colors.accent : colors.border,
                color: canSave ? '#fff' : colors.textTertiary,
                border: 'none',
                borderRadius: radius.sm,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.heading.join(', '),
                cursor: canSave ? 'pointer' : 'not-allowed',
                transition: `all ${motion.duration.fast}`,
              }}
            >
              {isSaving ? 'Saving…' : 'Save pin'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacesMap;
