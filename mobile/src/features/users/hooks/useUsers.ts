import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/constants/query-keys';

import {
  createUser,
  getUser,
  listUsers,
  updateUser,
  updateUserStatus,
} from '@/features/users/api/users.api';

import type {
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  UserListQuery,
} from '@/features/users/types';

export function useUsersList(query: UserListQuery) {
  return useInfiniteQuery({
    initialPageParam: 1,
    queryKey: [...queryKeys.users.list, query],
    queryFn: ({ pageParam }) => listUsers({ ...query, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;

      if (!meta || meta.page >= meta.totalPages) {
        return undefined;
      }

      return meta.page + 1;
    },
  });
}

export function useUserDetail(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.users.detail(id || 'unknown'),
    queryFn: () => getUser(String(id)),
  });
}

async function invalidateUserQueries(id?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.users.list }),
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
    id ? queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) }) : Promise.resolve(),
  ]);
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    async onSuccess(createdUser) {
      await invalidateUserQueries(createdUser.id);
      queryClient.setQueryData(queryKeys.users.detail(createdUser.id), createdUser);
    },
  });
}

export function useUpdateUser(id: string) {
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(id, payload),
    async onSuccess(updatedUser) {
      await invalidateUserQueries(updatedUser.id);
      queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), updatedUser);
    },
  });
}

export function useUpdateUserStatus(id: string) {
  return useMutation({
    mutationFn: (payload: UpdateUserStatusPayload) => updateUserStatus(id, payload),
    async onSuccess(updatedUser) {
      await invalidateUserQueries(updatedUser.id);
      queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), updatedUser);
    },
  });
}
