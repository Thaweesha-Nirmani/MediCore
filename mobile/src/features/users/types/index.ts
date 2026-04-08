import type { ListQuery } from '@/api/types';
import type { AppRole } from '@/constants/auth';

export type UserStatus = 'active' | 'inactive' | 'pending';

export type UserItem = {
  id: string;
  _id?: string;
  userId?: string;
  name: string;
  email: string;
  contactNumber?: string;
  role: AppRole | string;
  status: UserStatus | string;
  active?: boolean;
  initials?: string;
  color?: string;
  lastLogin?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type UserListQuery = ListQuery & {
  role?: AppRole | string;
  status?: UserStatus | string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'email' | 'role' | 'status' | 'lastLogin';
  sortOrder?: 'asc' | 'desc';
  order?: 'asc' | 'desc';
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  contactNumber?: string;
  role: AppRole | string;
  status: UserStatus | string;
};

export type UpdateUserPayload = {
  name: string;
  email: string;
  contactNumber?: string;
  color?: string;
  role?: AppRole | string;
};

export type UpdateUserStatusPayload = {
  status: UserStatus | string;
};

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  contactNumber: string;
  role: AppRole | string;
  status: UserStatus | string;
  color: string;
};
