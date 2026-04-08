import { apiClient } from '@/api/client';
import type { ApiSuccess } from '@/api/types';

import type {
  ExpiryReportResponse,
  PurchaseReportResponse,
  ReportCatalogItem,
  SalesReportResponse,
  StockReportResponse,
} from '@/features/reports/types';

export async function listReports() {
  const response = await apiClient.get<ApiSuccess<ReportCatalogItem[]>>('/reports');
  return {
    items: response.data.data,
    meta: response.data.meta as { total: number } | undefined,
  };
}

export async function getSalesReport(params?: { dateFrom?: string; dateTo?: string; topLimit?: number }) {
  const response = await apiClient.get<ApiSuccess<SalesReportResponse>>('/reports/sales', { params });
  return response.data.data;
}

export async function getStockReport(params?: {
  search?: string;
  location?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const response = await apiClient.get<ApiSuccess<StockReportResponse['items']>>('/reports/stock', { params });
  return {
    items: response.data.data,
    meta: response.data.meta as StockReportResponse['meta'],
  };
}

export async function getExpiryReport(params?: {
  search?: string;
  location?: string;
  window?: 'all' | '7' | '30';
  page?: number;
  limit?: number;
}) {
  const response = await apiClient.get<ApiSuccess<ExpiryReportResponse['items']>>('/reports/expiry', { params });
  return {
    items: response.data.data,
    meta: response.data.meta as ExpiryReportResponse['meta'],
  };
}

export async function getPurchaseReport(params?: { dateFrom?: string; dateTo?: string; topLimit?: number }) {
  const response = await apiClient.get<ApiSuccess<PurchaseReportResponse>>('/reports/purchases', { params });
  return response.data.data;
}
