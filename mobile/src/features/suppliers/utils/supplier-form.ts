import type {
  SupplierFormPayload,
  SupplierFormValues,
  SupplierItem,
} from '@/features/suppliers/types';

export function createEmptySupplierFormValues(): SupplierFormValues {
  return {
    name: '',
    contactNumber: '',
    contactPerson: '',
    alternateContact: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Sri Lanka',
    status: 'Active',
    notes: '',
  };
}

export function mapSupplierToFormValues(supplier: SupplierItem): SupplierFormValues {
  return {
    name: supplier.name || '',
    contactNumber: supplier.contactNumber || supplier.contact || '',
    contactPerson: supplier.contactPerson || '',
    alternateContact: supplier.alternateContact || '',
    email: supplier.email || '',
    street: supplier.address?.street || '',
    city: supplier.address?.city || '',
    state: supplier.address?.state || '',
    postalCode: supplier.address?.postalCode || '',
    country: supplier.address?.country || 'Sri Lanka',
    status:
      supplier.status === 'Inactive' || supplier.status === 'Archived'
        ? supplier.status
        : 'Active',
    notes: supplier.notes || '',
  };
}

export function validateSupplierForm(values: SupplierFormValues) {
  const errors: Partial<Record<keyof SupplierFormValues, string>> = {};
  const name = values.name.trim();
  const contactNumber = values.contactNumber.trim();
  const email = values.email.trim();

  if (name.length < 2) {
    errors.name = 'Enter the supplier name used by your purchasing team.';
  }

  const digits = contactNumber.replace(/[^\d+]/g, '');

  if (digits.length < 7) {
    errors.contactNumber = 'Enter a valid phone number with at least 7 digits.';
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!['Active', 'Inactive', 'Archived'].includes(values.status)) {
    errors.status = 'Choose a valid supplier status.';
  }

  return errors;
}

export function toSupplierPayload(values: SupplierFormValues): SupplierFormPayload {
  const payload: SupplierFormPayload = {
    name: values.name.trim(),
    contactNumber: values.contactNumber.trim(),
    status: values.status,
  };

  if (values.contactPerson.trim()) {
    payload.contactPerson = values.contactPerson.trim();
  }

  if (values.alternateContact.trim()) {
    payload.alternateContact = values.alternateContact.trim();
  }

  if (values.email.trim()) {
    payload.email = values.email.trim();
  }

  if (values.notes.trim()) {
    payload.notes = values.notes.trim();
  }

  payload.address = {
    street: values.street.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    postalCode: values.postalCode.trim(),
    country: values.country.trim() || 'Sri Lanka',
  };

  return payload;
}
