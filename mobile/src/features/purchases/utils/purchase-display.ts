import type { PurchaseOrder } from '@/features/purchases/types';

export function formatPurchaseCurrency(amount?: number | null) {
  const value = Number(amount ?? 0);
  return `LKR ${value.toFixed(2)}`;
}

export function formatPurchaseDate(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return date.toLocaleDateString('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatPurchaseDateTime(value?: string | null) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString('en-LK', {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatOrderStatus(value?: string | null) {
  return String(value || 'placed')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatReceiveStatus(value?: string | null) {
  return String(value || 'not_received')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getPurchaseHeadline(purchase: Pick<PurchaseOrder, 'purchaseNumber' | 'supplierName'>) {
  return purchase.purchaseNumber || purchase.supplierName;
}

export function getOutstandingQuantity(purchase: Pick<PurchaseOrder, 'items'>) {
  return purchase.items.reduce((sum, item) => sum + Number(item.remainingQuantity || 0), 0);
}

export function getReceivedQuantity(purchase: Pick<PurchaseOrder, 'items'>) {
  return purchase.items.reduce((sum, item) => sum + Number(item.receivedQuantity || 0), 0);
}
