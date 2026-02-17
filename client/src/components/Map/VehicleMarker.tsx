import { Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useMemo } from 'react';
import { Vehicle, VehicleLocation } from '../../types/vehicle';

interface VehicleMarkerProps {
  vehicle: Vehicle;
  location: VehicleLocation | null;
  onClick: () => void;
}

/**
 * Creates a Tesla-style top-down car marker as a data URI SVG.
 * Using a data URI gives us full control over gradients and styling
 * that the Google Maps Symbol path doesn't support.
 */
function createTeslaMarkerIcon(heading: number, isOnline: boolean): google.maps.Icon {
  const primaryColor = isOnline ? '#3b82f6' : '#94a3b8';
  const accentColor = isOnline ? '#60a5fa' : '#b0bec5';
  const glowColor = isOnline ? 'rgba(59,130,246,0.3)' : 'rgba(148,163,184,0.2)';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="${glowColor}"/><g transform="rotate(${heading}, 24, 24)"><path d="M24 6C20 6 16 8 15 12L14 18C13.5 20 13 22 13 24L13 34C13 37 14 39 16 40L17 40.5C18 41 20 41.5 24 41.5C28 41.5 30 41 31 40.5L32 40C34 39 35 37 35 34L35 24C35 22 34.5 20 34 18L33 12C32 8 28 6 24 6Z" fill="${primaryColor}" stroke="white" stroke-width="1.2"/><path d="M17 16L18 12.5C19 10.5 21 9.5 24 9.5C27 9.5 29 10.5 30 12.5L31 16C31 17 30 17.5 28 17.5L20 17.5C18 17.5 17 17 17 16Z" fill="${accentColor}" opacity="0.7"/><path d="M18 33L17.5 36C17.5 37.5 19 38.5 24 38.5C29 38.5 30.5 37.5 30.5 36L30 33C30 32 28 31.5 24 31.5C20 31.5 18 32 18 33Z" fill="${accentColor}" opacity="0.5"/><ellipse cx="24" cy="23" rx="6" ry="4" fill="${accentColor}" opacity="0.25"/><g transform="translate(17.75, 18.5) scale(0.5)" fill="white" opacity="0.7"><path d="M12.5 0C11.4 0 8.5 0.3 7.3 1.8C7.3 1.8 10.3 2.5 12.5 2.5C14.7 2.5 17.7 1.8 17.7 1.8C16.5 0.3 13.6 0 12.5 0ZM3.6 2.3C3.6 2.3 0 3.2 0 4.6C0.8 4.4 2.2 4 3.4 3.8C5.3 3.5 6.9 3.4 7.7 3.3L12.5 18L17.3 3.3C18.1 3.4 19.7 3.5 21.6 3.8C22.8 4 24.2 4.4 25 4.6C25 3.2 21.4 2.3 21.4 2.3C19.7 3 16.2 3.2 12.5 3.2C8.8 3.2 5.3 3 3.6 2.3Z"/></g><ellipse cx="13" cy="18" rx="1.5" ry="1" fill="${primaryColor}" stroke="white" stroke-width="0.6"/><ellipse cx="35" cy="18" rx="1.5" ry="1" fill="${primaryColor}" stroke="white" stroke-width="0.6"/><rect x="16" y="7.5" width="3" height="1" rx="0.5" fill="white" opacity="0.9"/><rect x="29" y="7.5" width="3" height="1" rx="0.5" fill="white" opacity="0.9"/><rect x="15.5" y="39.5" width="4" height="0.8" rx="0.4" fill="%23ef4444" opacity="0.8"/><rect x="28.5" y="39.5" width="4" height="0.8" rx="0.4" fill="%23ef4444" opacity="0.8"/></g></svg>`;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(48, 48),
    anchor: new google.maps.Point(24, 24),
  };
}

export const VehicleMarker = ({ vehicle, location, onClick }: VehicleMarkerProps) => {
  const [showInfo, setShowInfo] = useState(false);

  const icon = useMemo(() => {
    if (!location) return undefined;
    return createTeslaMarkerIcon(location.location.heading, vehicle.state === 'online');
  }, [location?.location.heading, vehicle.state]);

  if (!location) return null;

  const position = {
    lat: location.location.latitude,
    lng: location.location.longitude,
  };

  return (
    <>
      <Marker
        position={position}
        onClick={() => {
          setShowInfo(true);
          onClick();
        }}
        icon={icon}
      />
      {showInfo && (
        <InfoWindow
          position={position}
          onCloseClick={() => setShowInfo(false)}
        >
          <div className="p-2 min-w-[180px]">
            <h3 className="font-bold text-base text-gray-900">{vehicle.name}</h3>
            <p className="text-sm text-gray-500">{vehicle.model}</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${vehicle.state === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
                  {vehicle.state.charAt(0).toUpperCase() + vehicle.state.slice(1)}
                </span>
              </div>
              {location.location.speed !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Speed</span>
                  <span className="text-gray-800">{Math.round(location.location.speed)} mph</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">GPS</span>
                <span className="text-gray-700 text-xs">
                  {location.location.latitude.toFixed(5)}, {location.location.longitude.toFixed(5)}
                </span>
              </div>
              <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                Updated: {new Date(location.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};
