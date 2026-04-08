import type {
  DashboardActivityItem,
  DashboardFastMovingMedicine,
} from '@/features/dashboard/types';

export function formatDashboardCurrency(amount?: number | null) {
  const value = Number(amount ?? 0);
  return `LKR ${value.toFixed(2)}`;
}

export function formatDashboardDateTime(value?: string | null) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString();
}

export function formatActivityType(type?: DashboardActivityItem['type']) {
  if (!type) {
    return 'Activity';
  }

  return type.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getActivityAmountLabel(item: DashboardActivityItem) {
  if (item.type === 'inventory') {
    const quantity = Number(item.amount || 0);
    return quantity > 0 ? `+${quantity} units` : `${quantity} units`;
  }

  return formatDashboardCurrency(item.amount);
}

export function getFastMovingCaption(item: DashboardFastMovingMedicine) {
  const parts = [item.genericName, item.barcode].filter(Boolean);
  return parts.join(' | ') || 'Medicine';
}
