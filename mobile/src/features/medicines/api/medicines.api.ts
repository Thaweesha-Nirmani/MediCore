import { apiClient } from '@/api/client';
import type { ApiSuccess } from '@/api/types';

import type {
  ExpiryAlertsResponse,
  MedicineAutocompleteItem,
  MedicineDetail,
  MedicineDuplicateCheckResponse,
  MedicineFormPayload,
  MedicineItem,
  MedicineListMeta,
  MedicineListQuery,
} from '@/features/medicines/types';

export async function listMedicines(params: MedicineListQuery = {}) {
  const response = await apiClient.get<ApiSuccess<MedicineItem[]>>('/medicines', { params });
  return {
    items: response.data.data,
    meta: response.data.meta as MedicineListMeta | undefined,
  };
}

export async function getMedicine(id: string) {
  const response = await apiClient.get<ApiSuccess<MedicineDetail>>(`/medicines/${id}`);
  return response.data.data;
}

export async function autocompleteMedicines(search: string, limit = 10) {
  const response = await apiClient.get<ApiSuccess<MedicineAutocompleteItem[]>>(
    '/medicines/autocomplete',
    {
      params: { q: search, limit },
    }
  );
  return response.data.data;
}

export async function autocompleteGenericNames(search: string, limit = 10) {
  const response = await apiClient.get<ApiSuccess<string[]>>(
    '/medicines/generic-names/autocomplete',
    {
      params: { q: search, limit },
    }
  );
  return response.data.data;
}

export async function getMedicineByBarcode(barcode: string) {
  const response = await apiClient.get<ApiSuccess<MedicineDetail>>(`/medicines/barcode/${barcode}`);
  return response.data.data;
}

export async function getExpiryAlerts() {
  const response = await apiClient.get<ApiSuccess<ExpiryAlertsResponse>>('/medicines/expiry/alerts');
  return response.data.data;
}

export async function checkMedicineDuplicates(params: {
  batchNumber?: string;
  excludeId?: string;
}) {
  const response = await apiClient.get<ApiSuccess<MedicineDuplicateCheckResponse>>(
    '/medicines/duplicate-check',
    { params }
  );
  return response.data.data;
}

export async function createMedicine(payload: MedicineFormPayload) {
  const response = await apiClient.post<ApiSuccess<MedicineDetail>>('/medicines', payload);
  return response.data.data;
}

export async function updateMedicine(id: string, payload: MedicineFormPayload) {
  const response = await apiClient.patch<ApiSuccess<MedicineDetail>>(`/medicines/${id}`, payload);
  return response.data.data;
}

export async function archiveMedicine(id: string) {
  const response = await apiClient.delete<ApiSuccess<MedicineDetail>>(`/medicines/${id}`);
  return response.data.data;
}

export async function restoreMedicine(id: string) {
  const response = await apiClient.post<ApiSuccess<MedicineDetail>>(`/medicines/${id}/restore`);
  return response.data.data;
}
