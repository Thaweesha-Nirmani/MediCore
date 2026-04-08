import { apiClient } from '@/api/client';
import type { ApiSuccess, PaginatedMeta } from '@/api/types';

import type {
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  UserItem,
  UserListQuery,
} from '@/features/users/types';

export async function listUsers(params: UserListQuery = {}) {
  const response = await apiClient.get<ApiSuccess<UserItem[]>>('/users', { params });
  return {
    items: response.data.data,
    meta: response.data.meta as PaginatedMeta | undefined,
  };
}

export async function getUser(id: string) {
  const response = await apiClient.get<ApiSuccess<UserItem>>(`/users/${id}`);
  return response.data.data;
}

export async function createUser(payload: CreateUserPayload) {
  const response = await apiClient.post<ApiSuccess<{ user: UserItem }>>('/auth/register', payload);
  return response.data.data.user;
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const response = await apiClient.patch<ApiSuccess<UserItem>>(`/users/${id}`, payload);
  return response.data.data;
}

export async function updateUserStatus(id: string, payload: UpdateUserStatusPayload) {
  const response = await apiClient.patch<ApiSuccess<UserItem>>(`/users/${id}/status`, payload);
  return response.data.data;
}
