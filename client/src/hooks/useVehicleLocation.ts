import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { configService } from '../services/configService';

export const useVehicleLocation = (vehicleId: string | null, vehicleState: string) => {
  const pollingInterval = configService.getPollingInterval();

  return useQuery({
    queryKey: ['vehicle-location', vehicleId],
    queryFn: () => api.getVehicleLocation(vehicleId!),
    enabled: !!vehicleId,
    refetchInterval: vehicleState === 'online' ? pollingInterval : false,
    retry: 1,
    staleTime: vehicleState === 'online' ? 5000 : 60000,
  });
};
