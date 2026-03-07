import React, { useEffect, useRef } from 'react';
import { colors, spacing, radius, typography } from '@/design-system/tokens';
import type { Place } from '@/types';

const DEFAULT_CENTER = { lat: 30.27, lng: -97.74 };
const DEFAULT_ZOOM = 4;
const GOOGLE_PLACES_API_KEY =
  ((import.meta.env || {}) as Record<string, string | undefined>).VITE_GOOGLE_PLACES_API_KEY || '';

interface PlacesMapProps {
  places: Place[];
  style?: React.CSSProperties;
}

/**
 * Renders a Google Map with markers for places that have lat/lng.
 * Uses the same API key as Places autocomplete; script may already be loaded.
 */
const PlacesMap: React.FC<PlacesMapProps> = ({ places, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<any>(null);

  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!GOOGLE_PLACES_API_KEY || !containerRef.current) return;

    const placesWithCoords = places.filter(
      (p): p is Place & { lat: number; lng: number } =>
        typeof p.lat === 'number' && typeof p.lng === 'number'
    );

    const updateMarkersAndBounds = (map: any) => {
      markersRef.current.forEach((m: any) => m.setMap(null));
      markersRef.current = [];

      if (placesWithCoords.length === 0) return;

      const { google } = window as any;
      const bounds = new google.maps.LatLngBounds();
      placesWithCoords.forEach((place) => {
        const position = { lat: place.lat, lng: place.lng };
        const marker = new google.maps.Marker({
          position,
          map,
          title: place.name,
        });
        markersRef.current.push(marker);
        bounds.extend(position);
      });

      if (placesWithCoords.length === 1) {
        map.setCenter({ lat: placesWithCoords[0].lat, lng: placesWithCoords[0].lng });
        map.setZoom(12);
      } else {
        map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
      }
    };

    const initMap = () => {
      const { google } = window as any;
      if (!containerRef.current || !google?.maps) return;

      const map = new google.maps.Map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapRef.current = map;
      updateMarkersAndBounds(map);
    };

    if ((window as any).google?.maps?.Map) {
      if (mapRef.current) {
        updateMarkersAndBounds(mapRef.current);
      } else {
        initMap();
      }
      return;
    }

    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener('load', initMap);
      return () => existing.removeEventListener('load', initMap);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, [places]);

  if (!GOOGLE_PLACES_API_KEY) {
    return (
      <div
        style={{
          padding: spacing.lg,
          background: colors.surface,
          borderRadius: radius.lg,
          border: `1px solid ${colors.borderSecondary}35`,
          color: colors.textTertiary,
          fontSize: typography.fontSize.sm,
          ...style,
        }}
      >
        Add VITE_GOOGLE_PLACES_API_KEY to .env to show the map.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 280,
        borderRadius: radius.lg,
        overflow: 'hidden',
        border: `1px solid ${colors.borderSecondary}35`,
        background: colors.surface,
        ...style,
      }}
      aria-label="Map of saved places"
    />
  );
};

export default PlacesMap;
