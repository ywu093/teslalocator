import axios from 'axios';
import { VehiclesResponse, VehicleLocation } from '../types/vehicle';

function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return 'http://localhost:3001';
  return '';
}
const API_URL = getApiUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  async getVehicles(): Promise<VehiclesResponse> {
    const response = await apiClient.get<VehiclesResponse>('/api/vehicles');
    return response.data;
  },

  async getVehicleLocation(vehicleId: string): Promise<VehicleLocation> {
    const response = await apiClient.get<VehicleLocation>(`/api/vehicles/${vehicleId}/location`);
    return response.data;
  },

  async wakeVehicle(vehicleId: string): Promise<void> {
    await apiClient.post(`/api/vehicles/${vehicleId}/wake`);
  },

  async getSettingsStatus(): Promise<{ configured: boolean; hasFleetCredentials: boolean; region: string; clientId: string; clientSecret: string; domain: string }> {
    const response = await apiClient.get('/api/settings/status');
    return response.data;
  },

  async updateFleetConfig(clientId: string, clientSecret: string, region: string, domain: string): Promise<void> {
    await apiClient.post('/api/settings/fleet-config', { clientId, clientSecret, region, domain });
  },

  async getAuthUrl(): Promise<{ authUrl: string; redirectUri: string }> {
    const response = await apiClient.get('/api/settings/auth-url');
    return response.data;
  },
};
