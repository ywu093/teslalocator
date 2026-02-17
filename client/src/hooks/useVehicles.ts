import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const useVehicles = () => {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.getVehicles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60000, // Refresh every minute
  });
};
