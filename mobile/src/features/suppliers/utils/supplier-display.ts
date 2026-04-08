import type { SupplierItem } from '@/features/suppliers/types';

export function formatSupplierStatus(status?: string | null) {
  const normalized = String(status || 'Active').trim().toLowerCase();

  if (!normalized) {
    return 'Active';
  }

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatSupplierAddress(supplier: Pick<SupplierItem, 'address'>) {
  return [
    supplier.address?.street,
    supplier.address?.city,
    supplier.address?.state,
    supplier.address?.postalCode,
    supplier.address?.country,
  ]
    .filter(Boolean)
    .join(', ') || 'Address not set';
}

export function getSupplierPrimaryContact(
  supplier: Pick<SupplierItem, 'contactPerson' | 'contactNumber' | 'contact' | 'email'>
) {
  return supplier.contactPerson || supplier.contactNumber || supplier.contact || supplier.email || 'Primary contact not set';
}

export function getSupplierContactLine(
  supplier: Pick<
    SupplierItem,
    'contactPerson' | 'contactNumber' | 'contact' | 'alternateContact' | 'email'
  >
) {
  return [
    supplier.contactPerson,
    supplier.contactNumber || supplier.contact,
    supplier.email,
    supplier.alternateContact,
  ]
    .filter(Boolean)
    .join(' • ') || 'Primary contact not set';
}

export function formatSupplierDate(value?: string | null) {
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
