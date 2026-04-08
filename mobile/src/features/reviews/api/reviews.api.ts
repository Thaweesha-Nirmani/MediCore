import { apiClient } from '@/api/client';
import type { ApiSuccess, PaginatedMeta } from '@/api/types';

import type { ReviewItem, ReviewListQuery, ReviewPayload } from '@/features/reviews/types';

export async function listReviews(params: ReviewListQuery = {}) {
  const response = await apiClient.get<ApiSuccess<ReviewItem[]>>('/reviews', { params });
  return {
    items: response.data.data,
    meta: response.data.meta as PaginatedMeta | undefined,
  };
}

export async function getReview(id: string) {
  const response = await apiClient.get<ApiSuccess<ReviewItem>>(`/reviews/${id}`);
  return response.data.data;
}

export async function createReview(payload: ReviewPayload) {
  const response = await apiClient.post<ApiSuccess<ReviewItem>>('/reviews', payload);
  return response.data.data;
}

export async function updateReview(id: string, payload: Partial<ReviewPayload>) {
  const response = await apiClient.patch<ApiSuccess<ReviewItem>>(`/reviews/${id}`, payload);
  return response.data.data;
}

export async function archiveReview(id: string) {
  const response = await apiClient.delete<ApiSuccess<ReviewItem>>(`/reviews/${id}`);
  return response.data.data;
}
