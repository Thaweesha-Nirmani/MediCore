import { apiClient } from '@/api/client';
import type { ApiSuccess, PaginatedMeta } from '@/api/types';

import type {
  BillingLookupMedicine,
  CreateSalePayload,
  RefundSalePayload,
  SaleDetail,
  SaleRecord,
  SalesHistoryQuery,
} from '@/features/sales/types';

export async function listSales(params: SalesHistoryQuery = {}) {
  const response = await apiClient.get<ApiSuccess<SaleRecord[]>>('/sales', { params });
  return {
    items: response.data.data,
    meta: response.data.meta as PaginatedMeta | undefined,
  };
}

export async function getSale(id: string) {
  const response = await apiClient.get<ApiSuccess<SaleDetail>>(`/sales/${id}`);
  return response.data.data;
}

export async function getInvoice(id: string) {
  const response = await apiClient.get<ApiSuccess<SaleDetail>>(`/sales/invoices/${id}`);
  return response.data.data;
}

export async function searchBillingMedicines(search: string, limit = 10, includeOutOfStock = false) {
  const response = await apiClient.get<ApiSuccess<BillingLookupMedicine[]>>('/sales/search-medicines', {
    params: { search, limit, includeOutOfStock },
  });
  return response.data.data;
}

export async function lookupMedicineByBarcode(barcode: string) {
  const response = await apiClient.get<ApiSuccess<BillingLookupMedicine>>(`/sales/barcode/${barcode}`);
  return response.data.data;
}

export async function createSale(payload: CreateSalePayload) {
  const response = await apiClient.post<ApiSuccess<SaleDetail>>('/sales', payload);
  return response.data.data;
}

export async function refundSale(id: string, payload: RefundSalePayload) {
  const response = await apiClient.post<ApiSuccess<SaleDetail>>(`/sales/${id}/refund`, payload);
  return response.data.data;
}
