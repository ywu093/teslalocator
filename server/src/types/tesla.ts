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

export interface TeslaVehicleData {
  id_s: string;
  vehicle_id: number;
  display_name: string;
  state: string;
  vin: string;
}

export interface TeslaDriveState {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number | null;
  timestamp: number;
}
