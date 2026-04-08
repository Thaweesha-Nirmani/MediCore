import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/constants/query-keys';

import {
  adjustInventory,
  createInventory,
  getExpiryInventory,
  getInventoryByMedicine,
  getInventoryItem,
  getLowStock,
  listInventory,
  listInventoryMovements,
  listMedicinesForStock,
  updateInventory,
} from '@/features/inventory/api/inventory.api';

import type {
  AddStockPayload,
  AdjustInventoryPayload,
  InventoryListQuery,
  MovementListQuery,
} from '@/features/inventory/types';

export function useInventoryList(query: InventoryListQuery) {
  return useInfiniteQuery({
    initialPageParam: 1,
    queryKey: [...queryKeys.inventory.list, query],
    queryFn: ({ pageParam }) => listInventory({ ...query, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;

      if (!meta || meta.page >= meta.totalPages) {
        return undefined;
      }

      return meta.page + 1;
    },
  });
}

export function useInventoryItem(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.inventory.detail(id || 'unknown'),
    queryFn: () => getInventoryItem(String(id)),
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: queryKeys.inventory.lowStock,
    queryFn: () => getLowStock(),
  });
}

export function useExpiryInventory() {
  return useQuery({
    queryKey: queryKeys.inventory.expiry,
    queryFn: () => getExpiryInventory(),
  });
}

export function useInventoryMovements(query: MovementListQuery) {
  return useInfiniteQuery({
    initialPageParam: 1,
    queryKey: [...queryKeys.inventory.movements, query],
    queryFn: ({ pageParam }) => listInventoryMovements({ ...query, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;

      if (!meta || meta.page >= meta.totalPages) {
        return undefined;
      }

      return meta.page + 1;
    },
  });
}

export function useInventoryByMedicine(medicineId?: string, query: InventoryListQuery = {}) {
  return useInfiniteQuery({
    enabled: Boolean(medicineId),
    initialPageParam: 1,
    queryKey: [...queryKeys.inventory.medicine(medicineId || 'unknown'), query],
    queryFn: ({ pageParam }) =>
      getInventoryByMedicine(String(medicineId), {
        ...query,
        page: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;

      if (!meta || meta.page >= meta.totalPages) {
        return undefined;
      }

      return meta.page + 1;
    },
  });
}

export function useMedicineSearchForStock(search: string, limit = 8) {
  const normalizedSearch = search.trim();

  return useQuery({
    enabled: normalizedSearch.length >= 2,
    queryKey: ['inventory', 'medicine-search', normalizedSearch, limit],
    queryFn: () => listMedicinesForStock(normalizedSearch, limit),
  });
}

async function invalidateInventoryQueries() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lowStock }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.expiry }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.movements }),
    queryClient.invalidateQueries({ queryKey: queryKeys.medicines.list }),
  ]);
}

export function useCreateInventory() {
  return useMutation({
    mutationFn: (payload: AddStockPayload) => createInventory(payload),
    async onSuccess(createdBatch) {
      await invalidateInventoryQueries();
      queryClient.setQueryData(queryKeys.inventory.detail(createdBatch.id), createdBatch);
    },
  });
}

export function useUpdateInventory(id: string) {
  return useMutation({
    mutationFn: (payload: Partial<AddStockPayload> & { adjustmentReason?: string }) =>
      updateInventory(id, payload),
    async onSuccess(updatedBatch) {
      await invalidateInventoryQueries();
      queryClient.setQueryData(queryKeys.inventory.detail(updatedBatch.id), updatedBatch);
    },
  });
}

export function useAdjustInventory() {
  return useMutation({
    mutationFn: (payload: AdjustInventoryPayload) => adjustInventory(payload),
    async onSuccess() {
      await invalidateInventoryQueries();
    },
  });
}
