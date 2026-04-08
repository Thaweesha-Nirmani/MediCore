import { appRoles } from '@/constants/auth';

import { getDefaultUserColor } from '@/features/users/utils/user-display';

import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserFormValues,
  UserItem,
  UserStatus,
} from '@/features/users/types';

export const USER_STATUS_OPTIONS: UserStatus[] = ['active', 'pending', 'inactive'];
export const USER_ROLE_OPTIONS = [
  appRoles.admin,
  appRoles.pharmacist,
  appRoles.cashier,
  appRoles.inventoryManager,
  appRoles.purchasingManager,
  appRoles.supplierManager,
] as const;

export function createEmptyUserFormValues(): UserFormValues {
  return {
    name: '',
    email: '',
    password: '',
    contactNumber: '',
    role: appRoles.pharmacist,
    status: 'active',
    color: getDefaultUserColor(appRoles.pharmacist),
  };
}

export function createUserFormValues(item: UserItem): UserFormValues {
  return {
    name: item.name || '',
    email: item.email || '',
    password: '',
    contactNumber: item.contactNumber || '',
    role: item.role || appRoles.pharmacist,
    status: (String(item.status || 'active').toLowerCase() as UserStatus) || 'active',
    color: item.color || getDefaultUserColor(item.role),
  };
}

export function validateUserForm(values: UserFormValues, mode: 'create' | 'edit') {
  const errors: Partial<Record<keyof UserFormValues, string>> = {};
  const email = values.email.trim().toLowerCase();
  const digits = values.contactNumber.trim().replace(/[^\d+]/g, '');

  if (!values.name.trim()) {
    errors.name = 'Name is required.';
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (mode === 'create') {
    if (!values.password.trim()) {
      errors.password = 'Password is required.';
    } else if (values.password.trim().length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
  }

  if (digits && !/^\+?\d{10,15}$/.test(digits)) {
    errors.contactNumber = 'Contact number must contain 10 to 15 digits.';
  }

  if (!values.role) {
    errors.role = 'Role is required.';
  }

  if (!values.status) {
    errors.status = 'Status is required.';
  }

  return errors;
}

export function toCreateUserPayload(values: UserFormValues): CreateUserPayload {
  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password.trim(),
    contactNumber: values.contactNumber.trim() ? values.contactNumber.trim() : undefined,
    role: values.role,
    status: values.status,
  };
}

export function toUpdateUserPayload(values: UserFormValues): UpdateUserPayload {
  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    contactNumber: values.contactNumber.trim() ? values.contactNumber.trim() : '',
    role: values.role,
    color: values.color.trim() || undefined,
  };
}
