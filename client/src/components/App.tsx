import { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VehicleMap } from './Map/VehicleMap';
import { VehicleList } from './VehicleList/VehicleList';
import { Header } from './Layout/Header';
import { SettingsModal } from './Settings/SettingsModal';
import { useVehicles } from '../hooks/useVehicles';
import { useVehicleLocation } from '../hooks/useVehicleLocation';
import { Vehicle, VehicleLocation } from '../types/vehicle';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Component that polls location for a single vehicle.
 * This avoids calling hooks inside a loop/map which violates Rules of Hooks.
 */
const VehicleLocationTracker = ({
  vehicle,
  onLocationUpdate
}: {
  vehicle: Vehicle;
  onLocationUpdate: (vehicleId: string, location: VehicleLocation | null) => void;
}) => {
  const { data } = useVehicleLocation(vehicle.id, vehicle.state);

  useEffect(() => {
    onLocationUpdate(vehicle.id, data || null);
  }, [data, vehicle.id, onLocationUpdate]);

  return null; // This component only polls data, renders nothing
};

const AppContent = () => {
  const { data: vehiclesData, isLoading, error } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Map<string, VehicleLocation>>(new Map());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Handle OAuth callback redirect from Tesla
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_success') === 'true') {
      setAuthMessage('Successfully connected to Tesla!');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setAuthMessage(null), 5000);
    } else if (params.get('auth_error')) {
      setAuthMessage(`Tesla auth error: ${params.get('auth_error')}`);
      window.history.replaceState({}, '', window.location.pathname);
      setSettingsOpen(true);
    }
  }, []);

  const vehicles = vehiclesData?.vehicles || [];

  const handleLocationUpdate = useCallback((vehicleId: string, location: VehicleLocation | null) => {
    setLocations(prev => {
      const next = new Map(prev);
      if (location) {
        next.set(vehicleId, location);
      }
      return next;
    });
  }, []);

  const handleVehicleClick = (vehicleId: string) => {
    setSelectedVehicleId(prev => prev === vehicleId ? null : vehicleId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your Tesla vehicles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <p className="text-red-600 font-semibold text-lg">Error loading vehicles</p>
            <p className="text-gray-600 mt-2">{(error as Error).message}</p>
            <button
              onClick={() => setSettingsOpen(true)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Settings
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Configure your Tesla credentials and Google Maps API key
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Location trackers - one per vehicle, each safely uses its own hooks */}
      {vehicles.map(vehicle => (
        <VehicleLocationTracker
          key={vehicle.id}
          vehicle={vehicle}
          onLocationUpdate={handleLocationUpdate}
        />
      ))}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {authMessage && (
        <div className={`fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-medium ${
          authMessage.includes('error') ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {authMessage}
          <button onClick={() => setAuthMessage(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}
      <div className="flex flex-col h-screen overflow-hidden">
        <Header onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Responsive */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 lg:block absolute lg:relative z-10 lg:z-0 bottom-0 lg:bottom-auto lg:h-full max-h-64 lg:max-h-full">
            <VehicleList
              vehicles={vehicles}
              locations={locations}
              onVehicleClick={handleVehicleClick}
              selectedVehicleId={selectedVehicleId}
            />
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <VehicleMap vehicles={vehicles} locations={locations} selectedVehicleId={selectedVehicleId} />
          </div>
        </div>
      </div>
    </>
  );
};

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};
