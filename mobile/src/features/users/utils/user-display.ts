import { getRoleLabel, normalizeAppRole } from '@/constants/auth';

import type { UserItem, UserStatus } from '@/features/users/types';

export function formatUserStatus(value?: string | null) {
  const normalized = String(value || '').trim().toLowerCase() as UserStatus;

  if (normalized === 'inactive') {
    return 'Inactive';
  }

  if (normalized === 'pending') {
    return 'Pending';
  }

  return 'Active';
}

export function formatUserRole(value?: string | null) {
  return getRoleLabel(value);
}

export function formatUserLastLogin(value?: string | null) {
  if (!value) {
    return 'No recorded sign-in';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No recorded sign-in';
  }

  return date.toLocaleString('en-LK', {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getUserMetaLine(user: UserItem) {
  const parts = [user.userId, user.contactNumber].filter(Boolean);
  return parts.join(' | ') || 'Staff profile';
}

export function getUserStatusColor(status: string, colors: {
  success: string;
  warning: string;
  danger: string;
}) {
  const normalized = formatUserStatus(status);

  if (normalized === 'Pending') {
    return colors.warning;
  }

  if (normalized === 'Inactive') {
    return colors.danger;
  }

  return colors.success;
}

export function getDefaultUserColor(role?: string | null) {
  const normalizedRole = normalizeAppRole(role);

  if (normalizedRole === 'admin') {
    return '#2E73C7';
  }

  if (normalizedRole === 'cashier') {
    return '#3AA6D9';
  }

  if (normalizedRole === 'inventory_manager') {
    return '#3ED6C6';
  }

  if (normalizedRole === 'purchasing_manager') {
    return '#55C89B';
  }

  if (normalizedRole === 'supplier_manager') {
    return '#59B5BF';
  }

  return '#6FA9FF';
}
