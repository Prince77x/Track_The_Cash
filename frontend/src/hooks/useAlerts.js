import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../api/alertsApi.js';

export const useAlerts = (filters) => {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => alertsApi.getAlerts(filters),
    refetchInterval: 10000,
  });
};

export default useAlerts;
