import { useState, useEffect, useRef } from 'react';

const addressCache = new Map<string, string>();

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export const useReverseGeocode = (latitude: number | undefined, longitude: number | undefined): string | null => {
  const [address, setAddress] = useState<string | null>(null);
  const prevKeyRef = useRef<string>('');

  useEffect(() => {
    if (latitude == null || longitude == null) return;

    const key = getCacheKey(latitude, longitude);
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    // Check cache first
    const cached = addressCache.get(key);
    if (cached) {
      setAddress(cached);
      return;
    }

    // Use Google Maps Geocoder (available when Maps JS API is loaded)
    if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: latitude, lng: longitude } },
        (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const addr = results[0].formatted_address;
            addressCache.set(key, addr);
            setAddress(addr);
          } else {
            console.warn('Geocoder failed:', status);
          }
        }
      );
    } else {
      // Retry after a short delay (Maps JS may still be loading)
      const timer = setTimeout(() => {
        if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              if (status === 'OK' && results && results.length > 0) {
                const addr = results[0].formatted_address;
                addressCache.set(key, addr);
                setAddress(addr);
              } else {
                console.warn('Geocoder failed:', status);
              }
            }
          );
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [latitude, longitude]);

  return address;
};
