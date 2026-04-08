import { apiClient } from '@/api/client';
import type { ApiSuccess, PaginatedMeta } from '@/api/types';

import type { SupplierFormPayload, SupplierItem, SupplierListQuery } from '@/features/suppliers/types';

export async function listSuppliers(params: SupplierListQuery = {}) {
  const response = await apiClient.get<ApiSuccess<SupplierItem[]>>('/suppliers', { params });
  return {
    items: response.data.data,
    meta: response.data.meta as PaginatedMeta | undefined,
  };
}

export async function getSupplier(id: string) {
  const response = await apiClient.get<ApiSuccess<SupplierItem>>(`/suppliers/${id}`);
  return response.data.data;
}

export async function createSupplier(payload: SupplierFormPayload) {
  const response = await apiClient.post<ApiSuccess<SupplierItem>>('/suppliers', payload);
  return response.data.data;
}

export async function updateSupplier(id: string, payload: SupplierFormPayload) {
  const response = await apiClient.patch<ApiSuccess<SupplierItem>>(`/suppliers/${id}`, payload);
  return response.data.data;
}
