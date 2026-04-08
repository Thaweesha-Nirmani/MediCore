import type { PaginatedMeta } from '@/api/types';

export type SupplierItem = {
  id: string;
  name: string;
  contactNumber?: string;
  contact?: string;
  contactPerson?: string;
  alternateContact?: string;
  email?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  status: string;
  active: boolean;
  isDeleted: boolean;
  notes?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  audit?: {
    createdAt?: string | null;
    updatedAt?: string | null;
    deletedAt?: string | null;
    createdBy?: unknown;
    updatedBy?: unknown;
    deletedBy?: unknown;
  };
};

export type SupplierListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'Active' | 'Inactive' | 'Archived';
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
};

export type SupplierListResponse = {
  items: SupplierItem[];
  meta?: PaginatedMeta;
};

export type SupplierFormValues = {
  name: string;
  contactNumber: string;
  contactPerson: string;
  alternateContact: string;
  email: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status: 'Active' | 'Inactive' | 'Archived';
  notes: string;
};

export type SupplierFormPayload = {
  name: string;
  contactNumber: string;
  contactPerson?: string;
  alternateContact?: string;
  email?: string;
  status?: 'Active' | 'Inactive' | 'Archived';
  notes?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};
