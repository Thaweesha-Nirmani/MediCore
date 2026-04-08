import type { InventoryBatch, InventoryMovement, LowStockAlert } from '@/features/inventory/types';

type BatchLike = Pick<
  InventoryBatch,
  | 'medicineId'
  | 'medicine'
  | 'batchNumber'
  | 'location'
  | 'expiryDate'
  | 'daysToExpire'
  | 'stockStatus'
  | 'availableQuantity'
  | 'quantity'
>;

export function formatInventoryCurrency(amount?: number | null) {
  const value = Number(amount ?? 0);
  return `LKR ${value.toFixed(2)}`;
}

export function formatInventoryDate(value?: string | null) {
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

export function formatInventoryDateTime(value?: string | null) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString();
}

export function getInventoryDisplayName(batch?: Pick<BatchLike, 'medicineId' | 'medicine'> | null) {
  return batch?.medicine?.displayName || batch?.medicine?.name || batch?.medicineId || 'Stock batch';
}

export function getInventoryIdentityLine(batch?: Pick<BatchLike, 'medicine' | 'batchNumber' | 'location'> | null) {
  const medicineLine = [batch?.medicine?.strength, batch?.medicine?.dosageForm].filter(Boolean).join(' | ');
  const batchLine = [`Batch ${batch?.batchNumber || 'N/A'}`, batch?.location || 'MAIN_STORE']
    .filter(Boolean)
    .join(' | ');

  return [medicineLine, batchLine].filter(Boolean).join(' • ');
}

export function getInventoryTagValues(batch?: Pick<BatchLike, 'medicine'> | null) {
  return [
    batch?.medicine?.category || 'General',
    batch?.medicine?.strength,
    batch?.medicine?.dosageForm,
  ].filter(Boolean) as string[];
}

export function getStockStatusLabel(status?: string | null) {
  const normalized = String(status || '').trim().toLowerCase();

  switch (normalized) {
    case 'low_stock':
      return 'Low stock';
    case 'out_of_stock':
      return 'Out of stock';
    case 'expired':
      return 'Expired';
    case 'damaged':
      return 'Damaged';
    case 'quarantined':
      return 'Quarantined';
    case 'disposed':
      return 'Disposed';
    case 'archived':
      return 'Archived';
    default:
      return 'Available';
  }
}

export function getExpirySignal(batch?: Pick<BatchLike, 'stockStatus' | 'daysToExpire' | 'expiryDate'> | null) {
  if (!batch?.expiryDate) {
    return 'No expiry date';
  }

  if (String(batch.stockStatus || '').toLowerCase() === 'expired') {
    return 'Expired';
  }

  if (typeof batch.daysToExpire === 'number') {
    if (batch.daysToExpire < 0) {
      return 'Expired';
    }

    if (batch.daysToExpire <= 7) {
      return `Expires in ${batch.daysToExpire} days`;
    }

    if (batch.daysToExpire <= 30) {
      return `Expiring in ${batch.daysToExpire} days`;
    }
  }

  return formatInventoryDate(batch.expiryDate);
}

export function getMovementTypeLabel(type?: string | null) {
  const normalized = String(type || '').trim().toLowerCase();

  switch (normalized) {
    case 'transfer_in':
      return 'Transfer in';
    case 'transfer_out':
      return 'Transfer out';
    default:
      return normalized
        .split('_')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(' ') || 'Movement';
  }
}

export function getAlertLevelLabel(level?: LowStockAlert['alertLevel']) {
  if (level === 'out_of_stock') {
    return 'Out of stock';
  }

  if (level === 'critical') {
    return 'Critical';
  }

  return 'Low stock';
}

export function formatMovementDelta(item: Pick<InventoryMovement, 'quantityChange'>) {
  const value = Number(item.quantityChange || 0);
  return value > 0 ? `+${value}` : String(value);
}

export function createEmptyAddStockValues() {
  return {
    medicineId: '',
    medicineSearch: '',
    batchNumber: '',
    quantity: '',
    expiryDate: '',
    manufactureDate: '',
    purchasePrice: '',
    sellingPrice: '',
    location: 'MAIN_STORE',
    supplierId: '',
    reorderLevel: '',
    notes: '',
    mergeIfExists: false,
  };
}

export function createEmptyAdjustValues() {
  return {
    action: 'increase' as const,
    quantityChange: '',
    newQuantity: '',
    reason: '',
    toLocation: '',
  };
}

export function mapInventoryToAddStockDefaults(batch: InventoryBatch) {
  return {
    medicineId: batch.medicineId,
    medicineSearch: batch.medicine?.displayName || batch.medicine?.name || '',
    batchNumber: batch.batchNumber || '',
    quantity: String(batch.quantity || ''),
    expiryDate: batch.expiryDate ? String(batch.expiryDate).slice(0, 10) : '',
    manufactureDate: batch.manufactureDate ? String(batch.manufactureDate).slice(0, 10) : '',
    purchasePrice:
      typeof batch.purchasePrice === 'number' && Number.isFinite(batch.purchasePrice)
        ? String(batch.purchasePrice)
        : '',
    sellingPrice:
      typeof batch.sellingPrice === 'number' && Number.isFinite(batch.sellingPrice)
        ? String(batch.sellingPrice)
        : '',
    location: batch.location || 'MAIN_STORE',
    supplierId: batch.supplierId || '',
    reorderLevel:
      typeof batch.reorderLevel === 'number' && Number.isFinite(batch.reorderLevel)
        ? String(batch.reorderLevel)
        : '',
    notes: batch.notes || '',
    mergeIfExists: false,
  };
}
