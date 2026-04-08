import { useEffect } from 'react';

import { toApiError } from '@/api/errors';
import { authStore, useAuthStore, type AuthSession, type MobileUser } from '@/store/auth-store';
import {
  clearPersistedSession,
  getPersistedSession,
  savePersistedSession,
} from '@/utils/secure-store';

import { getCurrentUser, refresh } from '@/features/auth/api/auth.api';

let bootstrapRequested = false;
let bootstrapPromise: Promise<void> | null = null;

function toSession(
  payload?: Partial<AuthSession> & {
    user?: MobileUser | null;
  }
): AuthSession | null {
  if (!payload?.accessToken) {
    return null;
  }

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: payload.user || undefined,
  };
}

async function applySession(session: AuthSession | null) {
  if (!session) {
    await clearPersistedSession();
    authStore.getState().clearSession();
    return;
  }

  authStore.getState().setSession(session);
  await savePersistedSession(session);
}

async function restoreVerifiedSession() {
  const persisted = await getPersistedSession();
  const fallbackSession = toSession({
    accessToken: persisted?.accessToken,
    refreshToken: persisted?.refreshToken,
    user: persisted?.user as MobileUser | undefined,
  });

  if (!fallbackSession) {
    await applySession(null);
    return;
  }

  try {
    if (fallbackSession.refreshToken) {
      const refreshed = await refresh(fallbackSession.refreshToken);

      await applySession(
        toSession({
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          user: refreshed.user,
        })
      );
      return;
    }

    authStore.getState().setSession(fallbackSession);
    const currentUser = await getCurrentUser();
    await applySession({
      ...fallbackSession,
      user: currentUser,
    });
  } catch (error) {
    const apiError = toApiError(error);

    if ([401, 403, 422].includes(apiError.status || 0)) {
      await applySession(null);
      return;
    }

    if (fallbackSession.user) {
      await applySession(fallbackSession);
      return;
    }

    await applySession(null);
  }
}

async function bootstrapAuthState() {
  const state = authStore.getState();

  if (state.hasHydrated || state.isBootstrapping) {
    return;
  }

  authStore.getState().setBootstrapping(true);

  try {
    if (!bootstrapPromise) {
      bootstrapPromise = restoreVerifiedSession();
    }

    await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
    authStore.getState().setBootstrapping(false);
    authStore.getState().setHydrated(true);
  }
}

export function useAuthBootstrap() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (!bootstrapRequested) {
      bootstrapRequested = true;
      void bootstrapAuthState();
    }
  }, []);

  return {
    hasHydrated,
    isBootstrapping,
    isAuthenticated: Boolean(session?.accessToken),
    session,
  };
}
