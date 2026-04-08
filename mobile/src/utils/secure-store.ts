import * as SecureStore from 'expo-secure-store';

const AUTH_SESSION_KEY = 'th_mobile_auth_session';
let memorySessionFallback: PersistedSession | null = null;

export type PersistedSession = {
  accessToken: string;
  refreshToken?: string;
  user?: unknown;
};

async function canUseSecureStore() {
  if (
    typeof SecureStore.getItemAsync !== 'function' ||
    typeof SecureStore.setItemAsync !== 'function' ||
    typeof SecureStore.deleteItemAsync !== 'function'
  ) {
    return false;
  }

  if (typeof SecureStore.isAvailableAsync !== 'function') {
    return true;
  }

  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function savePersistedSession(session: PersistedSession) {
  memorySessionFallback = session;

  if (!(await canUseSecureStore())) {
    return;
  }

  try {
    await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Keep the in-memory fallback so auth bootstrap does not crash on native module mismatch.
  }
}

export async function getPersistedSession(): Promise<PersistedSession | null> {
  if (!(await canUseSecureStore())) {
    return memorySessionFallback;
  }

  let raw = null;

  try {
    raw = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
  } catch {
    return memorySessionFallback;
  }

  if (!raw) {
    return memorySessionFallback;
  }

  try {
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return memorySessionFallback;
  }
}

export async function clearPersistedSession() {
  memorySessionFallback = null;

  if (!(await canUseSecureStore())) {
    return;
  }

  try {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
  } catch {
    // No-op: clearing the in-memory fallback is enough to keep the app stable.
  }
}
