import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/constants/query-keys';

import {
  archiveReview,
  createReview,
  getReview,
  listReviews,
  updateReview,
} from '@/features/reviews/api/reviews.api';

import type { ReviewListQuery, ReviewPayload } from '@/features/reviews/types';

export function useReviewsList(query: ReviewListQuery) {
  return useInfiniteQuery({
    initialPageParam: 1,
    queryKey: [...queryKeys.reviews.list, query],
    queryFn: ({ pageParam }) => listReviews({ ...query, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;

      if (!meta || meta.page >= meta.totalPages) {
        return undefined;
      }

      return meta.page + 1;
    },
  });
}

export function useReviewDetail(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.reviews.detail(id || 'unknown'),
    queryFn: () => getReview(String(id)),
  });
}

async function invalidateReviewQueries(id?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.reviews.list }),
    id ? queryClient.invalidateQueries({ queryKey: queryKeys.reviews.detail(id) }) : Promise.resolve(),
  ]);
}

export function useCreateReview() {
  return useMutation({
    mutationFn: (payload: ReviewPayload) => createReview(payload),
    async onSuccess(createdReview) {
      await invalidateReviewQueries(createdReview.id);
      queryClient.setQueryData(queryKeys.reviews.detail(createdReview.id), createdReview);
    },
  });
}

export function useUpdateReview(id: string) {
  return useMutation({
    mutationFn: (payload: Partial<ReviewPayload>) => updateReview(id, payload),
    async onSuccess(updatedReview) {
      await invalidateReviewQueries(updatedReview.id);
      queryClient.setQueryData(queryKeys.reviews.detail(updatedReview.id), updatedReview);
    },
  });
}

export function useArchiveReview(id: string) {
  return useMutation({
    mutationFn: () => archiveReview(id),
    async onSuccess(updatedReview) {
      await invalidateReviewQueries(updatedReview.id);
      queryClient.setQueryData(queryKeys.reviews.detail(updatedReview.id), updatedReview);
    },
  });
}
