import { useMemo } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { clearPersistedSession, savePersistedSession } from '@/utils/secure-store';

import type { AuthResponse } from '@/features/auth/types';

export function useAuthSession() {
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMemo(
    () => ({
      session,
      user: session?.user,
      isAuthenticated: Boolean(session?.accessToken),
      async applyAuthResponse(response: AuthResponse) {
        const nextSession = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user,
        };

        setSession(nextSession);
        await savePersistedSession(nextSession);
      },
      async clearAuthSession() {
        clearSession();
        await clearPersistedSession();
      },
    }),
    [clearSession, session, setSession]
  );
}
