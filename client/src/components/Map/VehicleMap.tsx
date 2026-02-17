import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Vehicle, VehicleLocation } from '../../types/vehicle';
import { VehicleMarker } from './VehicleMarker';
import { configService } from '../../services/configService';

interface VehicleMapProps {
  vehicles: Vehicle[];
  locations: Map<string, VehicleLocation>;
  selectedVehicleId: string | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -36.8485,
  lng: 174.7633,
};

export const VehicleMap = ({ vehicles, locations, selectedVehicleId }: VehicleMapProps) => {
  const [center, setCenter] = useState(defaultCenter);
  const mapRef = useRef<google.maps.Map | null>(null);

  const apiKey = configService.getGoogleMapsApiKey() || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Center on first vehicle if available
    if (vehicles.length > 0 && locations.size > 0) {
      const firstVehicle = vehicles[0];
      const firstLocation = locations.get(firstVehicle.id);
      if (firstLocation) {
        setCenter({
          lat: firstLocation.location.latitude,
          lng: firstLocation.location.longitude,
        });
      }
    }
  }, [vehicles, locations]);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Auto-follow selected vehicle: pan on selection and on every location update
  const prevSelectedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedVehicleId || !mapRef.current) return;
    const location = locations.get(selectedVehicleId);
    if (!location) return;

    const newPos = {
      lat: location.location.latitude,
      lng: location.location.longitude,
    };

    // Zoom in when first selecting a vehicle
    if (prevSelectedRef.current !== selectedVehicleId) {
      mapRef.current.setZoom(15);
      prevSelectedRef.current = selectedVehicleId;
    }

    mapRef.current.panTo(newPos);
  }, [selectedVehicleId, locations]);

  // Reset tracking ref when deselected
  useEffect(() => {
    if (!selectedVehicleId) {
      prevSelectedRef.current = null;
    }
  }, [selectedVehicleId]);

  const centerOnVehicle = (vehicleId: string) => {
    const location = locations.get(vehicleId);
    if (location && mapRef.current) {
      mapRef.current.panTo({
        lat: location.location.latitude,
        lng: location.location.longitude,
      });
      mapRef.current.setZoom(15);
    }
  };

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold">Google Maps API key not configured</p>
          <p className="text-sm text-gray-600 mt-2">Please set VITE_GOOGLE_MAPS_API_KEY in .env</p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={locations.size > 0 ? 13 : 6}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: false,
        }}
      >
        {vehicles.map((vehicle) => {
          const location = locations.get(vehicle.id);
          return (
            <VehicleMarker
              key={vehicle.id}
              vehicle={vehicle}
              location={location || null}
              onClick={() => centerOnVehicle(vehicle.id)}
            />
          );
        })}
      </GoogleMap>
    </LoadScript>
  );
};
