import { apiClient } from '@/api/client';
import type { ApiSuccess, PaginatedMeta } from '@/api/types';

import type {
  CreatePurchasePayload,
  PurchaseListQuery,
  PurchaseOrder,
  ReceivePurchasePayload,
} from '@/features/purchases/types';

export async function listPurchases(params: PurchaseListQuery = {}) {
  const response = await apiClient.get<ApiSuccess<PurchaseOrder[]>>('/purchases', { params });
  return {
    items: response.data.data,
    meta: response.data.meta as PaginatedMeta | undefined,
  };
}

export async function getPurchase(id: string) {
  const response = await apiClient.get<ApiSuccess<PurchaseOrder>>(`/purchases/${id}`);
  return response.data.data;
}

export async function createPurchase(payload: CreatePurchasePayload) {
  const response = await apiClient.post<ApiSuccess<PurchaseOrder>>('/purchases', payload);
  return response.data.data;
}

export async function receivePurchase(id: string, payload: ReceivePurchasePayload) {
  const response = await apiClient.post<ApiSuccess<PurchaseOrder>>(`/purchases/${id}/receive`, payload);
  return response.data.data;
}
