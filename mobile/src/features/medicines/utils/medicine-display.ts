import type { MedicineItem } from '@/features/medicines/types';

type MedicineIdentitySource = Pick<
  MedicineItem,
  | 'displayName'
  | 'name'
  | 'genericName'
  | 'brandName'
  | 'strength'
  | 'dosageForm'
  | 'medicineId'
  | 'barcode'
  | 'category'
  | 'expiryStatus'
  | 'daysToExpire'
  | 'stockStatus'
>;

export function formatMedicineCurrency(amount?: number | null) {
  const value = Number(amount ?? 0);
  return `LKR ${value.toFixed(2)}`;
}

export function formatMedicineDate(value?: string | Date | null) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getMedicineDisplayName(medicine?: Pick<MedicineIdentitySource, 'displayName' | 'name'> | null) {
  return medicine?.displayName || medicine?.name || 'Medicine';
}

export function getMedicineIdentityLine(medicine?: MedicineIdentitySource | null) {
  const base = medicine?.genericName || medicine?.brandName || 'Generic name not set';
  const presentation = [medicine?.strength, medicine?.dosageForm].filter(Boolean).join(' | ');

  return [base, presentation].filter(Boolean).join(' | ');
}

export function getMedicineTagValues(medicine?: MedicineIdentitySource | null) {
  return [medicine?.strength, medicine?.dosageForm, medicine?.category || 'General'].filter(Boolean) as string[];
}

export function getMedicineSearchMetaLine(medicine?: MedicineIdentitySource | null) {
  const parts = [
    medicine?.medicineId ? `ID ${medicine.medicineId}` : null,
    medicine?.barcode ? `Barcode ${medicine.barcode}` : 'No barcode',
    medicine?.category || 'General',
  ].filter(Boolean);

  return parts.join(' | ');
}

export function getExpiryStatusLabel(
  medicine?: Pick<MedicineItem, 'expiryStatus' | 'daysToExpire'> | null
) {
  if (!medicine?.expiryStatus || medicine.expiryStatus === 'no_expiry') {
    return 'No expiry tracked';
  }

  if (medicine.expiryStatus === 'expired') {
    return 'Expired';
  }

  if (medicine.expiryStatus === 'expiring_in_7_days') {
    return `Expires in ${medicine.daysToExpire ?? 0} days`;
  }

  if (medicine.expiryStatus === 'expiring_in_30_days') {
    return typeof medicine.daysToExpire === 'number'
      ? `Expiring in ${medicine.daysToExpire} days`
      : 'Expiring soon';
  }

  return 'Valid';
}

export function getStockStatusLabel(status?: MedicineItem['stockStatus']) {
  if (!status || status === 'available') {
    return 'Available';
  }

  if (status === 'low_stock') {
    return 'Low stock';
  }

  return 'Out of stock';
}
