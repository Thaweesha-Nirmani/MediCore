import { apiClient } from '@/api/client';
import type { ApiSuccess, PaginatedMeta } from '@/api/types';
import type { MedicineAutocompleteItem } from '@/features/medicines/types';

import type {
  AddStockPayload,
  AdjustInventoryPayload,
  InventoryBatch,
  InventoryExpiryResponse,
  InventoryListQuery,
  InventoryMovement,
  LowStockResponse,
  MovementListQuery,
} from '@/features/inventory/types';

export async function listInventory(params: InventoryListQuery = {}) {
  const response = await apiClient.get<ApiSuccess<InventoryBatch[]>>('/inventory', { params });
  return {
    items: response.data.data,
    meta: response.data.meta as PaginatedMeta | undefined,
  };
}

export async function getLowStock() {
  const response = await apiClient.get<ApiSuccess<LowStockResponse>>('/inventory/low-stock');
  return response.data.data;
}

export async function getExpiryInventory() {
  const response = await apiClient.get<ApiSuccess<InventoryExpiryResponse>>('/inventory/expiry');
  return response.data.data;
}

export async function getInventoryItem(id: string) {
  const response = await apiClient.get<ApiSuccess<InventoryBatch>>(`/inventory/${id}`);
  return response.data.data;
}

export async function createInventory(payload: AddStockPayload) {
  const response = await apiClient.post<ApiSuccess<InventoryBatch>>('/inventory', payload);
  return response.data.data;
}

export async function updateInventory(id: string, payload: Partial<AddStockPayload> & { adjustmentReason?: string }) {
  const response = await apiClient.patch<ApiSuccess<InventoryBatch>>(`/inventory/${id}`, payload);
  return response.data.data;
}

export async function adjustInventory(payload: AdjustInventoryPayload) {
  const response = await apiClient.post<ApiSuccess<InventoryBatch | { source: InventoryBatch; target: InventoryBatch }>>(
    '/inventory/adjust',
    payload
  );
  return response.data.data;
}

export async function listInventoryMovements(params: MovementListQuery = {}) {
  const response = await apiClient.get<ApiSuccess<InventoryMovement[]>>('/inventory/movements', {
    params,
  });
  return {
    items: response.data.data,
    meta: response.data.meta as PaginatedMeta | undefined,
  };
}

export async function getInventoryByMedicine(medicineId: string, params: InventoryListQuery = {}) {
  const response = await apiClient.get<ApiSuccess<InventoryBatch[]>>(`/inventory/medicine/${medicineId}`, {
    params,
  });
  return {
    items: response.data.data,
    meta: response.data.meta as PaginatedMeta | undefined,
  };
}

export async function listMedicinesForStock(search: string, limit = 8) {
  const response = await apiClient.get<ApiSuccess<MedicineAutocompleteItem[]>>('/medicines/autocomplete', {
    params: { q: search, limit },
  });
  return response.data.data;
}
