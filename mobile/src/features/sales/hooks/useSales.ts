import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/constants/query-keys';

import {
  createSale,
  getSale,
  lookupMedicineByBarcode,
  listSales,
  searchBillingMedicines,
} from '@/features/sales/api/sales.api';

import type { CreateSalePayload, SalesHistoryQuery } from '@/features/sales/types';

export function useSalesHistory(query: SalesHistoryQuery) {
  return useInfiniteQuery({
    initialPageParam: 1,
    queryKey: [...queryKeys.sales.history, query],
    queryFn: ({ pageParam }) =>
      listSales({
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

export function useSaleDetail(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.sales.detail(id || 'unknown'),
    queryFn: () => getSale(String(id)),
  });
}

export function useSaleMedicineSearch(search: string, limit = 10, includeOutOfStock = false) {
  const normalizedSearch = search.trim();

  return useQuery({
    enabled: normalizedSearch.length >= 2,
    queryKey: [...queryKeys.sales.search, normalizedSearch, limit, includeOutOfStock],
    queryFn: () => searchBillingMedicines(normalizedSearch, limit, includeOutOfStock),
  });
}

export function useSaleBarcodeLookup() {
  return useMutation({
    mutationFn: (barcode: string) => lookupMedicineByBarcode(barcode),
  });
}

export function useCreateSale() {
  return useMutation({
    mutationFn: (payload: CreateSalePayload) => createSale(payload),
    async onSuccess(createdSale) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sales.history }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lowStock }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.expiry }),
        queryClient.invalidateQueries({ queryKey: queryKeys.medicines.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reports.sales }),
      ]);

      queryClient.setQueryData(queryKeys.sales.detail(createdSale.id), createdSale);
    },
  });
}
