import axios from 'axios';

import { env } from '@/constants/env';
import { authStore } from '@/store/auth-store';

import { ApiError } from '@/api/errors';
import type { ApiEnvelope } from '@/api/types';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl || undefined,
  timeout: env.requestTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});

const UNAVAILABLE_MESSAGE =
  'Unable to connect right now. Please try again in a moment.';
const NETWORK_MESSAGE =
  'Unable to connect right now. Check your connection and try again.';

apiClient.interceptors.request.use((config) => {
  if (!env.isApiBaseUrlConfigured) {
    return Promise.reject(
      new ApiError(UNAVAILABLE_MESSAGE, {
        status: 500,
        details: {
          reason: env.apiBaseUrlMessage || 'API base URL is not configured',
        },
      })
    );
  }

  const token = authStore.getState().session?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error?.response) {
      console.error('[API] Network Error Details:', {
        message: error.message,
        code: error.code,
        configUrl: error.config?.url,
        baseURL: error.config?.baseURL,
        apiBaseUrl: env.apiBaseUrl,
        isApiBaseUrlConfigured: env.isApiBaseUrlConfigured,
      });
      return Promise.reject(
        new ApiError(NETWORK_MESSAGE, {
          status: 503,
          details: {
            apiBaseUrl: env.apiBaseUrl,
          },
        })
      );
    }

    const status = error?.response?.status;
    const payload = error?.response?.data as ApiEnvelope<unknown> | undefined;
    const message =
      (payload && 'error' in payload && payload.error?.message) ||
      error?.message ||
      'Request failed';

    return Promise.reject(
      new ApiError(message, {
        status,
        details: payload && 'error' in payload ? payload.error?.details : undefined,
      })
    );
  }
);
