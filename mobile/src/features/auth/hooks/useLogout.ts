import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { queryClient } from '@/api/queryClient';
import { appRoutes } from '@/constants/routes';
import { logger } from '@/utils/logger';

import { logout } from '@/features/auth/api/auth.api';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';

export function useLogout() {
  const router = useRouter();
  const { clearAuthSession, session } = useAuthSession();

  return useMutation({
    mutationFn: async () => {
      try {
        if (session?.accessToken) {
          await logout(session.refreshToken);
        }
      } catch (error) {
        logger.warn('Remote logout failed, clearing local session only', error);
      } finally {
        queryClient.clear();
        await clearAuthSession();
        router.replace(appRoutes.login);
      }
    },
  });
}
