import { useEffect, useRef } from 'react';
import { GOOGLE_PLACES_API_KEY } from '../config/googlePlaces';

/** Minimal type for Google Places Autocomplete (loaded from script). */
interface GooglePlacesAutocomplete {
  getPlace: () => { name?: string; formatted_address?: string };
  addListener: (event: string, fn: () => void) => void;
}

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: { types?: string[]; fields?: string[] }
          ) => GooglePlacesAutocomplete;
        };
      };
    };
  }
}

/**
 * Loads the Google Maps Places script and attaches Autocomplete to the given input element.
 * Only runs when VITE_GOOGLE_PLACES_API_KEY is set. Calls onPlaceSelect with the selected place name.
 */
export function usePlacesAutocomplete(
  inputRef: React.RefObject<HTMLInputElement | null>,
  onPlaceSelect: (name: string) => void
): void {
  const autocompleteRef = useRef<GooglePlacesAutocomplete | null>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;

  useEffect(() => {
    if (!GOOGLE_PLACES_API_KEY || !inputRef.current) return;

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;
      if (autocompleteRef.current) return;

      const Autocomplete = window.google.maps.places.Autocomplete;
      const autocomplete = new Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['formatted_address', 'name'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const name = place.name || place.formatted_address || '';
        if (name.trim()) onPlaceSelectRef.current(name.trim());
      });

      autocompleteRef.current = autocomplete;
    };

    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener('load', initAutocomplete);
      return () => existing.removeEventListener('load', initAutocomplete);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initAutocomplete;
    document.head.appendChild(script);

    return () => {
      autocompleteRef.current = null;
    };
  }, [inputRef]);
}
