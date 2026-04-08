import type { ReviewItem, ReviewModuleSource, ReviewStatus } from '@/features/reviews/types';

export const REVIEW_MODULE_OPTIONS: ReviewModuleSource[] = [
  'general',
  'dashboard',
  'medicines',
  'inventory',
  'sales',
  'purchases',
  'reports',
];

export const REVIEW_STATUS_OPTIONS: ReviewStatus[] = ['open', 'acknowledged', 'resolved'];

export function formatReviewStatus(value?: string | null) {
  const normalized = String(value || '').trim().toLowerCase() as ReviewStatus;

  if (normalized === 'acknowledged') {
    return 'Acknowledged';
  }

  if (normalized === 'resolved') {
    return 'Resolved';
  }

  if (normalized === 'archived') {
    return 'Archived';
  }

  return 'Open';
}

export function formatReviewModule(value?: string | null) {
  const normalized = String(value || 'general').trim().toLowerCase();

  if (normalized === 'dashboard') return 'Dashboard';
  if (normalized === 'medicines') return 'Medicines';
  if (normalized === 'inventory') return 'Inventory';
  if (normalized === 'sales') return 'Sales';
  if (normalized === 'purchases') return 'Purchases';
  if (normalized === 'reports') return 'Reports';
  if (normalized === 'reviews') return 'Reviews';
  return 'General';
}

export function formatReviewDate(value?: string | null) {
  if (!value) {
    return 'Recent update';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Recent update';
  }

  return date.toLocaleString('en-LK', {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getReviewStatusColor(status: string, colors: {
  success: string;
  warning: string;
  danger: string;
  info: string;
}) {
  const normalized = formatReviewStatus(status);

  if (normalized === 'Resolved') {
    return colors.success;
  }

  if (normalized === 'Acknowledged') {
    return colors.info;
  }

  if (normalized === 'Archived') {
    return colors.danger;
  }

  return colors.warning;
}

export function getReviewOwnerLine(review: ReviewItem) {
  return review.createdBy?.name || review.createdBy?.email || 'Current team member';
}
