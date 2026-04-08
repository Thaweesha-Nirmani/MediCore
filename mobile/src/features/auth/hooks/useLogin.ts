import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { getDefaultAppRoute } from '@/navigation/tabs';

import { login } from '@/features/auth/api/auth.api';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';

import type { LoginPayload } from '@/features/auth/types';

export function useLogin() {
  const router = useRouter();
  const { applyAuthResponse } = useAuthSession();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    async onSuccess(response) {
      await applyAuthResponse(response);
      router.replace(getDefaultAppRoute(response.user?.role));
    },
  });
}
