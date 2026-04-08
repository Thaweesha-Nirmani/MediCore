import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/constants/query-keys';

import {
  createPurchase,
  getPurchase,
  listPurchases,
  receivePurchase,
} from '@/features/purchases/api/purchases.api';

import type {
  CreatePurchasePayload,
  PurchaseListQuery,
  ReceivePurchasePayload,
} from '@/features/purchases/types';

export function usePurchasesList(query: PurchaseListQuery) {
  return useInfiniteQuery({
    initialPageParam: 1,
    queryKey: [...queryKeys.purchases.list, query],
    queryFn: ({ pageParam }) => listPurchases({ ...query, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;

      if (!meta || meta.page >= meta.totalPages) {
        return undefined;
      }

      return meta.page + 1;
    },
  });
}

export function usePurchaseDetail(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.purchases.detail(id || 'unknown'),
    queryFn: () => getPurchase(String(id)),
  });
}

async function invalidatePurchaseQueries(id?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.purchases.list }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lowStock }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.expiry }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.movements }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.stock }),
    id
      ? queryClient.invalidateQueries({ queryKey: queryKeys.purchases.detail(id) })
      : Promise.resolve(),
  ]);
}

export function useCreatePurchase() {
  return useMutation({
    mutationFn: (payload: CreatePurchasePayload) => createPurchase(payload),
    async onSuccess(createdPurchase) {
      await invalidatePurchaseQueries(createdPurchase.id);
      queryClient.setQueryData(queryKeys.purchases.detail(createdPurchase.id), createdPurchase);
    },
  });
}

export function useReceivePurchase(id: string) {
  return useMutation({
    mutationFn: (payload: ReceivePurchasePayload) => receivePurchase(id, payload),
    async onSuccess(updatedPurchase) {
      await invalidatePurchaseQueries(updatedPurchase.id);
      queryClient.setQueryData(queryKeys.purchases.detail(updatedPurchase.id), updatedPurchase);
    },
  });
}
