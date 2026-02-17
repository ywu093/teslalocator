export interface Vehicle {
  id: string;
  name: string;
  model: string;
  state: 'online' | 'asleep' | 'offline';
  vin: string;
}

export interface VehicleLocation {
  vehicleId: string;
  location: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number | null;
  };
  timestamp: string;
  state: string;
}

export interface VehiclesResponse {
  vehicles: Vehicle[];
}
