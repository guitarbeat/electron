import React, { useEffect, useRef } from 'react';
import MapLibreGL from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { colors, spacing, radius, typography } from '@/theme/tokens';
import type { Place } from '@/shared/types';

const DEFAULT_CENTER: [number, number] = [-97.74, 30.27];
const DEFAULT_ZOOM = 3;
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

interface PlacesMapProps {
  places: Place[];
  style?: React.CSSProperties;
}

const PlacesMap: React.FC<PlacesMapProps> = ({ places, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const markersRef = useRef<MapLibreGL.Marker[]>([]);

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
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

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

      if (placesWithCoords.length === 0) return;

      placesWithCoords.forEach((place) => {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 14px;
          height: 14px;
          border-radius: 50%;
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
      } else {
        const bounds = new MapLibreGL.LngLatBounds();
        placesWithCoords.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
      }
    };

    if (map.isStyleLoaded()) {
      updateMarkers();
    } else {
      map.once('load', updateMarkers);
    }
  }, [places]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 'clamp(220px, 38vh, 340px)',
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
