import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/constants/query-keys';

import {
  archiveMedicine,
  autocompleteMedicines,
  checkMedicineDuplicates,
  createMedicine,
  getExpiryAlerts,
  getMedicine,
  getMedicineByBarcode,
  listMedicines,
  restoreMedicine,
  updateMedicine,
} from '@/features/medicines/api/medicines.api';

import type { MedicineFormPayload, MedicineListQuery } from '@/features/medicines/types';

async function invalidateMedicineQueries(id?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.medicines.list }),
    queryClient.invalidateQueries({ queryKey: queryKeys.medicines.autocomplete }),
    queryClient.invalidateQueries({ queryKey: queryKeys.medicines.expiry }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lowStock }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.expiry }),
    id ? queryClient.invalidateQueries({ queryKey: queryKeys.medicines.detail(id) }) : Promise.resolve(),
  ]);
}

export function useMedicinesList(query: MedicineListQuery) {
  return useInfiniteQuery({
    initialPageParam: 1,
    queryKey: [...queryKeys.medicines.list, query],
    queryFn: ({ pageParam }) =>
      listMedicines({
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

export function useMedicineDetail(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.medicines.detail(id || 'unknown'),
    queryFn: () => getMedicine(String(id)),
  });
}

export function useMedicineAutocomplete(search: string, limit = 8) {
  const normalizedSearch = search.trim();

  return useQuery({
    enabled: normalizedSearch.length >= 2,
    queryKey: [...queryKeys.medicines.autocomplete, normalizedSearch, limit],
    queryFn: () => autocompleteMedicines(normalizedSearch, limit),
  });
}

export function useMedicineDuplicateCheck(
  params: {
    name?: string;
    genericName?: string;
    brandName?: string;
    excludeId?: string;
  },
  enabled = true
) {
  const hasQuery = Boolean(params.name || params.genericName || params.brandName);

  return useQuery({
    enabled: enabled && hasQuery,
    queryKey: ['medicines', 'duplicate-check', params],
    queryFn: () => checkMedicineDuplicates(params),
  });
}

export function useMedicineBarcodeLookup() {
  return useMutation({
    mutationFn: (barcode: string) => getMedicineByBarcode(barcode),
  });
}

export function useMedicineExpiryAlerts() {
  return useQuery({
    queryKey: queryKeys.medicines.expiry,
    queryFn: () => getExpiryAlerts(),
  });
}

export function useCreateMedicine() {
  return useMutation({
    mutationFn: (payload: MedicineFormPayload) => createMedicine(payload),
    async onSuccess(createdMedicine) {
      await invalidateMedicineQueries(createdMedicine.id);
      queryClient.setQueryData(queryKeys.medicines.detail(createdMedicine.id), createdMedicine);
    },
  });
}

export function useUpdateMedicine(id: string) {
  return useMutation({
    mutationFn: (payload: MedicineFormPayload) => updateMedicine(id, payload),
    async onSuccess(updatedMedicine) {
      await invalidateMedicineQueries(id);
      queryClient.setQueryData(queryKeys.medicines.detail(updatedMedicine.id), updatedMedicine);
    },
  });
}

export function useArchiveMedicine(id: string) {
  return useMutation({
    mutationFn: () => archiveMedicine(id),
    async onSuccess(archivedMedicine) {
      await invalidateMedicineQueries(id);
      queryClient.setQueryData(queryKeys.medicines.detail(archivedMedicine.id), archivedMedicine);
    },
  });
}

export function useRestoreMedicine(id: string) {
  return useMutation({
    mutationFn: () => restoreMedicine(id),
    async onSuccess(restoredMedicine) {
      await invalidateMedicineQueries(id);
      queryClient.setQueryData(queryKeys.medicines.detail(restoredMedicine.id), restoredMedicine);
    },
  });
}
