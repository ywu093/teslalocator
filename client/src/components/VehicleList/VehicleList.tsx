import { Vehicle, VehicleLocation } from '../../types/vehicle';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';

interface VehicleListProps {
  vehicles: Vehicle[];
  locations: Map<string, VehicleLocation>;
  onVehicleClick: (vehicleId: string) => void;
  selectedVehicleId: string | null;
}

const getStateColor = (state: string) => {
  switch (state) {
    case 'online':
      return 'bg-green-500';
    case 'asleep':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

const getStateText = (state: string) => {
  return state.charAt(0).toUpperCase() + state.slice(1);
};

const VehicleItem = ({
  vehicle,
  location,
  isSelected,
  onClick,
}: {
  vehicle: Vehicle;
  location: VehicleLocation | undefined;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const address = useReverseGeocode(location?.location.latitude, location?.location.longitude);

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{vehicle.name}</h3>
          <p className="text-sm text-gray-600">{vehicle.model}</p>
        </div>
        <div className="flex items-center space-x-2">
          {isSelected && (
            <span className="text-xs text-blue-500 font-medium">Tracking</span>
          )}
          <div className={`w-3 h-3 rounded-full ${getStateColor(vehicle.state)}`} title={vehicle.state} />
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Status:</span>
          <span className={`font-medium ${vehicle.state === 'online' ? 'text-green-600' : 'text-gray-600'}`}>
            {getStateText(vehicle.state)}
          </span>
        </div>

        {location && (
          <>
            {location.location.speed !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Speed:</span>
                <span className="text-gray-800">{Math.round(location.location.speed)} mph</span>
              </div>
            )}

            <div className="text-sm mt-1">
              <span className="text-gray-500">GPS:</span>
              <span className="text-gray-700 ml-1">
                {location.location.latitude.toFixed(5)}, {location.location.longitude.toFixed(5)}
              </span>
            </div>

            {address && (
              <div className="text-sm mt-1">
                <span className="text-gray-500">Address:</span>
                <p className="text-gray-700 text-xs mt-0.5 leading-relaxed">{address}</p>
              </div>
            )}

            <div className="text-xs text-gray-400 mt-2">
              Updated: {new Date(location.timestamp).toLocaleTimeString()}
            </div>
          </>
        )}

        {!location && (
          <div className="text-xs text-gray-400 italic">Loading location...</div>
        )}
      </div>
    </div>
  );
};

export const VehicleList = ({ vehicles, locations, onVehicleClick, selectedVehicleId }: VehicleListProps) => {
  return (
    <div className="bg-white shadow-lg h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">My Teslas</h2>
        <p className="text-sm text-gray-500">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="divide-y divide-gray-200">
        {vehicles.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No vehicles found</p>
            <p className="text-sm mt-2">Check your Tesla API credentials</p>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <VehicleItem
              key={vehicle.id}
              vehicle={vehicle}
              location={locations.get(vehicle.id)}
              isSelected={selectedVehicleId === vehicle.id}
              onClick={() => onVehicleClick(vehicle.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
