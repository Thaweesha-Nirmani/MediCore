import { apiClient } from '@/api/client';
import type { ApiSuccess } from '@/api/types';

import type { AuthResponse, LoginPayload } from '@/features/auth/types';

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<ApiSuccess<AuthResponse>>('/auth/login', payload);
  return response.data.data;
}

export async function refresh(refreshToken: string) {
  const response = await apiClient.post<ApiSuccess<AuthResponse>>('/auth/refresh', { refreshToken });
  return response.data.data;
}

export async function logout(refreshToken?: string) {
  const response = await apiClient.post<ApiSuccess<{ loggedOut: boolean }>>('/auth/logout', {
    refreshToken,
  });
  return response.data.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get<ApiSuccess<AuthResponse['user']>>('/auth/me');
  return response.data.data;
}
