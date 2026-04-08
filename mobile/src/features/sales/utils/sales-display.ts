import type { BillingLookupMedicine, SaleRecord } from '@/features/sales/types';

export function formatSalesCurrency(amount?: number | null) {
  const value = Number(amount ?? 0);
  return `LKR ${value.toFixed(2)}`;
}

export function formatSalesDate(value?: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleString('en-LK', {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getLookupSecondaryLabel(medicine: BillingLookupMedicine) {
  const parts = [medicine.genericName, medicine.strength, medicine.dosageForm].filter(Boolean);
  return parts.join(' • ') || medicine.category || 'Medicine';
}

export function formatPaymentMethodLabel(value?: string | null) {
  const normalized = String(value || 'cash').trim().replace(/_/g, ' ');
  if (!normalized) return 'Cash';
  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getSaleHeadline(sale: Pick<SaleRecord, 'billNumber' | 'customerName'>) {
  return sale.customerName?.trim() || sale.billNumber;
}

export function getSalesStockTone(
  availableQuantity?: number | null,
  stockStatus?: string | null
) {
  const available = Number(availableQuantity ?? 0);
  const normalizedStatus = String(stockStatus || '').toLowerCase();

  if (
    available <= 0 ||
    normalizedStatus.includes('out') ||
    normalizedStatus.includes('expired')
  ) {
    return 'danger';
  }

  if (available <= 5 || normalizedStatus.includes('low')) {
    return 'warning';
  }

  return 'success';
}

export function getSalesStockLabel(
  availableQuantity?: number | null,
  stockStatus?: string | null
) {
  const available = Number(availableQuantity ?? 0);
  const tone = getSalesStockTone(availableQuantity, stockStatus);

  if (tone === 'danger') {
    return available <= 0 ? 'Out of stock' : 'Unavailable';
  }

  if (tone === 'warning') {
    return `${available} left`;
  }

  return `${available} in stock`;
}

export function getExpiryIndicator(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: 'Expired',
      tone: 'danger' as const,
    };
  }

  if (diffDays <= 30) {
    return {
      label: `Expires in ${diffDays}d`,
      tone: 'warning' as const,
    };
  }

  return {
    label: formatSalesDate(value),
    tone: 'neutral' as const,
  };
}
