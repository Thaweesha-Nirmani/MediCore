import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/constants/query-keys';

import {
  createSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
} from '@/features/suppliers/api/suppliers.api';

import type { SupplierFormPayload, SupplierListQuery } from '@/features/suppliers/types';

export function useSuppliersList(query: SupplierListQuery) {
  return useInfiniteQuery({
    initialPageParam: 1,
    queryKey: [...queryKeys.suppliers.list, query],
    queryFn: ({ pageParam }) => listSuppliers({ ...query, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;

      if (!meta || meta.page >= meta.totalPages) {
        return undefined;
      }

      return meta.page + 1;
    },
  });
}

export function useSupplierDetail(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.suppliers.detail(id || 'unknown'),
    queryFn: () => getSupplier(String(id)),
  });
}

export function useSupplierSearch(search: string, limit = 8) {
  const normalized = search.trim();

  return useQuery({
    enabled: normalized.length >= 2,
    queryKey: [...queryKeys.suppliers.search, normalized, limit],
    queryFn: async () => {
      const response = await listSuppliers({
        page: 1,
        limit,
        search: normalized,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      return response.items;
    },
  });
}

async function invalidateSupplierQueries(id?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.list }),
    queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.search }),
    queryClient.invalidateQueries({ queryKey: queryKeys.purchases.list }),
    id
      ? queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.detail(id) })
      : Promise.resolve(),
  ]);
}

export function useCreateSupplier() {
  return useMutation({
    mutationFn: (payload: SupplierFormPayload) => createSupplier(payload),
    async onSuccess(createdSupplier) {
      await invalidateSupplierQueries(createdSupplier.id);
      queryClient.setQueryData(queryKeys.suppliers.detail(createdSupplier.id), createdSupplier);
    },
  });
}

export function useUpdateSupplier(id: string) {
  return useMutation({
    mutationFn: (payload: SupplierFormPayload) => updateSupplier(id, payload),
    async onSuccess(updatedSupplier) {
      await invalidateSupplierQueries(updatedSupplier.id);
      queryClient.setQueryData(queryKeys.suppliers.detail(updatedSupplier.id), updatedSupplier);
    },
  });
}
