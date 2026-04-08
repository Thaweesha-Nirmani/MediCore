import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import {
  getExpiryReport,
  getPurchaseReport,
  getSalesReport,
  getStockReport,
  listReports,
} from '@/features/reports/api/reports.api';

export function useReportsCatalog() {
  return useQuery({
    queryKey: ['reports', 'catalog'],
    queryFn: listReports,
  });
}

export function useSalesReport(params: { dateFrom?: string; dateTo?: string; topLimit?: number }) {
  return useQuery({
    queryKey: [...queryKeys.reports.sales, params],
    queryFn: () => getSalesReport(params),
  });
}

export function useStockReport(params: {
  search?: string;
  location?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...queryKeys.reports.stock, params],
    queryFn: () => getStockReport(params),
  });
}

export function useExpiryReport(params: {
  search?: string;
  location?: string;
  window?: 'all' | '7' | '30';
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...queryKeys.reports.expiry, params],
    queryFn: () => getExpiryReport(params),
  });
}

export function usePurchaseReport(params: { dateFrom?: string; dateTo?: string; topLimit?: number }) {
  return useQuery({
    queryKey: [...queryKeys.reports.purchases, params],
    queryFn: () => getPurchaseReport(params),
  });
}
