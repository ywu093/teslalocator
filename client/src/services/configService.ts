const STORAGE_KEYS = {
  GOOGLE_MAPS_API_KEY: 'teslalocator_google_maps_api_key',
  POLLING_INTERVAL: 'teslalocator_polling_interval',
};

export const configService = {
  getGoogleMapsApiKey(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_MAPS_API_KEY);
  },

  setGoogleMapsApiKey(key: string): void {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_MAPS_API_KEY, key);
  },

  getPollingInterval(): number {
    const stored = localStorage.getItem(STORAGE_KEYS.POLLING_INTERVAL);
    return stored ? parseInt(stored) : 10000; // Default 10 seconds
  },

  setPollingInterval(interval: number): void {
    localStorage.setItem(STORAGE_KEYS.POLLING_INTERVAL, interval.toString());
  },
};
