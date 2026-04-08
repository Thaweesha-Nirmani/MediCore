import { apiClient } from '@/api/client';
import type { ApiSuccess, PaginatedMeta } from '@/api/types';

import type {
  DashboardActivityItem,
  DashboardFastMovingMedicine,
  DashboardSummary,
} from '@/features/dashboard/types';

export async function getDashboardSummary() {
  const response = await apiClient.get<ApiSuccess<DashboardSummary>>('/dashboard');
  return response.data.data;
}

export async function getDashboardActivity(limit = 10) {
  const response = await apiClient.get<ApiSuccess<DashboardActivityItem[]>>('/dashboard/activity', {
    params: { limit },
  });

  return {
    items: response.data.data,
    meta: response.data.meta as PaginatedMeta | undefined,
  };
}

export async function getFastMovingMedicines(limit = 5, days = 30) {
  const response = await apiClient.get<ApiSuccess<DashboardFastMovingMedicine[]>>('/dashboard/fast-moving', {
    params: { limit, days },
  });

  return {
    items: response.data.data,
    meta: response.data.meta as PaginatedMeta | undefined,
  };
}
