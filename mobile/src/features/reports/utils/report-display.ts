import type { ReportFilterValues, StockReportItem } from '@/features/reports/types';

function isValidDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }

  const date = new Date(trimmed);
  return !Number.isNaN(date.getTime());
}

export function formatReportCurrency(amount?: number | null) {
  const value = Number(amount ?? 0);
  return `LKR ${value.toFixed(2)}`;
}

export function formatReportDate(value?: string | null) {
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

export function formatStatusLabel(value?: string | null) {
  return (
    String(value || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase()) || 'Unknown'
  );
}

export function createDefaultReportFilters(): ReportFilterValues {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 29);

  return {
    reportType: 'sales',
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: today.toISOString().slice(0, 10),
    topLimit: '5',
    search: '',
    location: '',
    status: '',
    window: 'all',
  };
}

export function getStockReportCaption(item: StockReportItem) {
  return [item.batchNumber, item.location, item.expiryStatus].filter(Boolean).join(' | ');
}

export function validateReportFilters(filters: ReportFilterValues) {
  const errors: Partial<Record<keyof ReportFilterValues, string>> = {};

  if (filters.reportType === 'sales' || filters.reportType === 'purchases') {
    if (!isValidDate(filters.dateFrom)) {
      errors.dateFrom = 'Use the date format YYYY-MM-DD.';
    }

    if (!isValidDate(filters.dateTo)) {
      errors.dateTo = 'Use the date format YYYY-MM-DD.';
    }

    if (!errors.dateFrom && !errors.dateTo) {
      const from = new Date(filters.dateFrom);
      const to = new Date(filters.dateTo);
      if (from > to) {
        errors.dateTo = 'End date must be after the start date.';
      }
    }

    const topLimit = Number(filters.topLimit);
    if (!filters.topLimit.trim()) {
      errors.topLimit = 'Enter how many top results to show.';
    } else if (!Number.isInteger(topLimit) || topLimit <= 0) {
      errors.topLimit = 'Top results must be a whole number greater than 0.';
    } else if (topLimit > 25) {
      errors.topLimit = 'Top results must be 25 or fewer for mobile readability.';
    }
  }

  if (filters.search.trim().length > 80) {
    errors.search = 'Search must be 80 characters or fewer.';
  }

  if (filters.location.trim().length > 60) {
    errors.location = 'Location must be 60 characters or fewer.';
  }

  if (filters.status.trim().length > 40) {
    errors.status = 'Status filter must be 40 characters or fewer.';
  }

  return errors;
}
