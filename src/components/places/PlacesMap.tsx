import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import MapLibreGL, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { colors, spacing, radius, typography } from "@/theme/tokens";
import type { Place } from "@/shared/types";
import { getPlaceMeta } from "./lib/placeMeta";

const DEFAULT_CENTER: [number, number] = [-97.74, 30.27];
const DEFAULT_ZOOM = 3;
const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    cartoDarkMatter: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© CARTO, © OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "carto-dark-matter",
      type: "raster",
      source: "cartoDarkMatter",
    },
  ],
};

interface PlacesMapProps {
  places: Place[];
  canEdit?: boolean;
  onUpdatePlace?: (
    id: string,
    updates: Partial<Pick<Place, "lat" | "lng">>,
  ) => Promise<void>;
  onAddPlace?: (
    name: string,
    notes?: string,
    lat?: number,
    lng?: number,
  ) => Promise<void>;
  style?: React.CSSProperties;
}

export interface PlacesMapHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
}

type PinMode = "assign" | "new";

interface PendingPin {
  lng: number;
  lat: number;
}

const hasPlaceDragData = (types: readonly string[]) =>
  types.some((type) => type.toLowerCase() === "placeid");

const PlacesMap = forwardRef<PlacesMapHandle, PlacesMapProps>(
  ({ places, canEdit = false, onUpdatePlace, onAddPlace, style }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const newPlaceInputRef = useRef<HTMLInputElement>(null);
    const mapRef = useRef<MapLibreGL.Map | null>(null);
    const markersRef = useRef<MapLibreGL.Marker[]>([]);
    const pendingMarkerRef = useRef<MapLibreGL.Marker | null>(null);
    const dragCounterRef = useRef(0);

    const [isDropMode, setIsDropMode] = useState(false);
    const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
    const [pinMode, setPinMode] = useState<PinMode>("assign");
    const [selectedPlaceId, setSelectedPlaceId] = useState("");
    const [newPlaceName, setNewPlaceName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        flyTo: (lng: number, lat: number, zoom = 13) => {
          mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 });
        },
      }),
      [],
    );

    const unmappedPlaces = places.filter(
      (p) => typeof p.lat !== "number" || typeof p.lng !== "number",
    );

    const cancelPin = useCallback(() => {
      pendingMarkerRef.current?.remove();
      pendingMarkerRef.current = null;
      setPendingPin(null);
      setSelectedPlaceId("");
      setNewPlaceName("");
      setPinMode("assign");
      setIsDropMode(false);
    }, []);

    const createPendingMarker = useCallback(
      (map: MapLibreGL.Map, lng: number, lat: number) => {
        pendingMarkerRef.current?.remove();

        const el = document.createElement("div");
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

        marker.on("dragend", () => {
          const pos = marker.getLngLat();
          setPendingPin({ lng: pos.lng, lat: pos.lat });
        });

        pendingMarkerRef.current = marker;
      },
      [],
    );

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

    // Click-to-drop mode
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      const canvas = map.getCanvas();

      const handleMapClick = (e: MapLibreGL.MapMouseEvent) => {
        if (!isDropMode) return;
        const { lng, lat } = e.lngLat;
        createPendingMarker(map, lng, lat);
        setPendingPin({ lng, lat });
        setSelectedPlaceId(unmappedPlaces[0]?.id ?? "");
      };

      if (isDropMode) {
        canvas.style.cursor = "crosshair";
        map.on("click", handleMapClick);
      } else {
        canvas.style.cursor = "";
      }

      return () => {
        map.off("click", handleMapClick);
        if (!isDropMode) canvas.style.cursor = "";
      };
    }, [isDropMode, unmappedPlaces, createPendingMarker]);

    // Saved-place markers
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      const placesWithCoords = places.filter(
        (p): p is Place & { lat: number; lng: number } =>
          typeof p.lat === "number" && typeof p.lng === "number",
      );

      const updateMarkers = () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        placesWithCoords.forEach((place) => {
          const meta = getPlaceMeta(place.name);
          const el = document.createElement("div");
          el.style.cssText = `
          width: 14px; height: 14px; border-radius: 50%;
          background: ${meta.color};
          border: 2px solid rgba(255,255,255,0.8);
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          cursor: pointer;
        `;
          el.title = place.name;

          const isVisited = Boolean(place.visitedAt);
          const popupHtml = `
          <div style="
            background: rgba(18,11,6,0.88);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid ${colors.border};
            border-radius: 10px;
            padding: 8px 12px;
            min-width: 100px;
            font-family: ${typography.fontFamily.heading.join(", ")};
          ">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
              <span style="font-size:1.1rem;">${meta.icon}</span>
              <span style="color:${colors.textPrimary};font-size:0.85rem;font-weight:600;letter-spacing:0.02em;">${place.name}</span>
            </div>
            ${isVisited ? `<span style="font-size:0.65rem;color:${colors.secondary};letter-spacing:0.06em;text-transform:uppercase;">✓ Visited</span>` : ""}
            ${place.notes ? `<div style="font-size:0.72rem;color:${colors.textTertiary};margin-top:2px;">${place.notes}</div>` : ""}
          </div>
        `;

          const popup = new MapLibreGL.Popup({
            offset: 12,
            closeButton: false,
            closeOnClick: true,
            className: "places-map-popup",
          }).setHTML(popupHtml);

          const marker = new MapLibreGL.Marker({ element: el })
            .setLngLat([place.lng, place.lat])
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push(marker);
        });

        if (placesWithCoords.length === 1) {
          map.flyTo({
            center: [placesWithCoords[0].lng, placesWithCoords[0].lat],
            zoom: 12,
          });
        } else if (placesWithCoords.length > 1) {
          const bounds = new MapLibreGL.LngLatBounds();
          placesWithCoords.forEach((p) => bounds.extend([p.lng, p.lat]));
          map.fitBounds(bounds, { padding: 56, maxZoom: 14 });
        }
      };

      if (map.isStyleLoaded()) {
        updateMarkers();
      } else {
        map.once("load", updateMarkers);
      }
    }, [places]);

    const handleSavePin = useCallback(async () => {
      if (!pendingPin) return;
      setIsSaving(true);
      try {
        if (pinMode === "assign" && selectedPlaceId && onUpdatePlace) {
          await onUpdatePlace(selectedPlaceId, {
            lat: pendingPin.lat,
            lng: pendingPin.lng,
          });
        } else if (pinMode === "new" && newPlaceName.trim() && onAddPlace) {
          await onAddPlace(
            newPlaceName.trim(),
            undefined,
            pendingPin.lat,
            pendingPin.lng,
          );
        }
        cancelPin();
      } finally {
        setIsSaving(false);
      }
    }, [
      pendingPin,
      pinMode,
      selectedPlaceId,
      newPlaceName,
      onUpdatePlace,
      onAddPlace,
      cancelPin,
    ]);

    // ── Drag-and-drop from cards ──
    const handleDragEnter = useCallback(
      (e: React.DragEvent) => {
        if (!canEdit || !hasPlaceDragData(Array.from(e.dataTransfer.types)))
          return;
        e.preventDefault();
        dragCounterRef.current += 1;
        if (dragCounterRef.current === 1) setIsDragOver(true);
      },
      [canEdit],
    );

    const handleDragOver = useCallback(
      (e: React.DragEvent) => {
        if (!canEdit || !hasPlaceDragData(Array.from(e.dataTransfer.types)))
          return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "link";
      },
      [canEdit],
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current === 0) setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        dragCounterRef.current = 0;
        setIsDragOver(false);

        const placeId = e.dataTransfer.getData("placeId");
        if (!placeId || !mapRef.current || !containerRef.current) return;

        const map = mapRef.current;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const lngLat = map.unproject([x, y]);

        createPendingMarker(map, lngLat.lng, lngLat.lat);
        setPendingPin({ lng: lngLat.lng, lat: lngLat.lat });
        setPinMode("assign");
        setSelectedPlaceId(placeId);
        setIsDropMode(false);
      },
      [createPendingMarker],
    );

    const canSave =
      pendingPin &&
      !isSaving &&
      (pinMode === "assign"
        ? Boolean(selectedPlaceId)
        : newPlaceName.trim().length > 0);

    const glassStyle: React.CSSProperties = {
      background: "rgba(18, 11, 6, 0.72)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${colors.border}`,
      borderRadius: radius.lg,
    };

    useEffect(() => {
      if (pendingPin && pinMode === "new") {
        newPlaceInputRef.current?.focus();
      }
    }, [pendingPin, pinMode]);

    return (
      <div style={{ position: "relative", width: "100%", ...style }}>
        {/* Map canvas */}
        <div
          ref={containerRef}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: radius.xl,
            overflow: "hidden",
            border: isDragOver
              ? `2px solid ${colors.accent}`
              : `1px solid ${colors.borderSecondary}35`,
            background: colors.surface,
          }}
          aria-label="Map of saved places"
        />

        {/* ── Drag-over overlay ── */}
        {isDragOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: radius.xl,
              background: `${colors.accent}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 20,
            }}
          >
            <div
              style={{
                ...glassStyle,
                background: `rgba(18,11,6,0.82)`,
                border: `1.5px solid ${colors.accent}`,
                padding: `${spacing.md} ${spacing.xl}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: spacing.xs,
              }}
            >
              <span style={{ fontSize: "2rem", lineHeight: 1 }}>📍</span>
              <span
                style={{
                  fontFamily: typography.fontFamily.heading.join(", "),
                  fontSize: typography.fontSize.sm,
                  color: colors.accentLight,
                  letterSpacing: "0.06em",
                }}
              >
                Drop to pin this place
              </span>
            </div>
          </div>
        )}

        {/* ── Drop-pin toggle ── */}
        {canEdit && !pendingPin && (
          <button
            type="button"
            onClick={() => {
              setIsDropMode((p) => !p);
              if (isDropMode) cancelPin();
            }}
            style={{
              position: "absolute",
              top: spacing.md,
              right: spacing.md,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: `${spacing.sm} ${spacing.sm}`,
              ...glassStyle,
              background: isDropMode ? colors.accent : "rgba(18, 11, 6, 0.72)",
              color: isDropMode ? "#fff" : colors.textSecondary,
              border: `1px solid ${isDropMode ? colors.accent : colors.border}`,
              borderRadius: radius.lg,
              fontSize: typography.fontSize.xs,
              fontFamily: typography.fontFamily.heading.join(", "),
              cursor: "pointer",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}
            title={isDropMode ? "Cancel pin drop" : "Drop a pin manually"}
          >
            <span style={{ fontSize: "0.9em" }}>📍</span>
            {isDropMode ? "Click map…" : "Drop pin"}
          </button>
        )}

        {/* ── Pin assignment panel ── */}
        {pendingPin && canEdit && (
          <div
            style={{
              position: "absolute",
              bottom: spacing.md,
              left: spacing.md,
              right: spacing.md,
              zIndex: 10,
              ...glassStyle,
              padding: spacing.md,
              display: "flex",
              flexDirection: "column",
              gap: spacing.sm,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  ...typography.presets.eyebrow,
                  color: colors.accentLight,
                }}
              >
                Pin this location
              </span>
              <div
                style={{
                  display: "flex",
                  borderRadius: radius.sm,
                  overflow: "hidden",
                  border: `1px solid ${colors.border}`,
                }}
              >
                {(["assign", "new"] as PinMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPinMode(m)}
                    style={{
                      padding: `3px ${spacing.xs}`,
                      fontSize: typography.fontSize["2xs"],
                      fontFamily: typography.fontFamily.heading.join(", "),
                      letterSpacing: "0.04em",
                      background: pinMode === m ? colors.accent : "transparent",
                      color: pinMode === m ? "#fff" : colors.textTertiary,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {m === "assign" ? "Existing place" : "New place"}
                  </button>
                ))}
              </div>
            </div>

            {pinMode === "assign" ? (
              places.length > 0 ? (
                <select
                  value={selectedPlaceId}
                  onChange={(e) => setSelectedPlaceId(e.target.value)}
                  style={{
                    background: "rgba(18,11,6,0.85)",
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.sm,
                    padding: `${spacing.xs} ${spacing.sm}`,
                    fontSize: typography.fontSize.sm,
                    fontFamily: typography.fontFamily.heading.join(", "),
                    width: "100%",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Select a place to pin…</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p
                  style={{
                    ...typography.presets.bodySm,
                    color: colors.textTertiary,
                    margin: 0,
                  }}
                >
                  No places yet. Switch to New place to create one here.
                </p>
              )
            ) : (
              <input
                ref={newPlaceInputRef}
                type="text"
                value={newPlaceName}
                onChange={(e) => setNewPlaceName(e.target.value)}
                placeholder="Name this place…"
                aria-label="New place name"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSave) void handleSavePin();
                }}
                style={{
                  background: "rgba(18,11,6,0.85)",
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.sm,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.heading.join(", "),
                  width: "100%",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            )}

            <p
              style={{
                ...typography.presets.bodySm,
                color: colors.textTertiary,
                margin: 0,
                opacity: 0.7,
              }}
            >
              Drag the pin to fine-tune the position.
            </p>

            <div
              style={{
                display: "flex",
                gap: spacing.sm,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={cancelPin}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  background: "transparent",
                  color: colors.textTertiary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.sm,
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.heading.join(", "),
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSavePin()}
                disabled={!canSave}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  background: canSave ? colors.accent : colors.border,
                  color: canSave ? "#fff" : colors.textTertiary,
                  border: "none",
                  borderRadius: radius.sm,
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.heading.join(", "),
                  cursor: canSave ? "pointer" : "not-allowed",
                }}
              >
                {isSaving ? "Saving…" : "Save pin"}
              </button>
            </div>
          </div>
        )}
        {/* Hide default MapLibre popup chrome */}
        <style>{`
        .places-map-popup .maplibregl-popup-content {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
        .places-map-popup .maplibregl-popup-tip {
          display: none !important;
        }
      `}</style>
      </div>
    );
  },
);

PlacesMap.displayName = "PlacesMap";

export default PlacesMap;
