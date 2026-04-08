import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import {
  getDashboardActivity,
  getDashboardSummary,
  getFastMovingMedicines,
} from '@/features/dashboard/api/dashboard.api';

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: getDashboardSummary,
  });
}

export function useDashboardActivity(limit = 8) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.activity, limit],
    queryFn: () => getDashboardActivity(limit),
  });
}

export function useFastMovingMedicines(limit = 5, days = 30) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.fastMoving, limit, days],
    queryFn: () => getFastMovingMedicines(limit, days),
  });
}
