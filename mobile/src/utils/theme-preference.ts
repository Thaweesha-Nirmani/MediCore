import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { ThemePreference } from '@/theme/theme';

const THEME_PREFERENCE_KEY = 'medicore_theme_preference';

let memoryThemePreference: ThemePreference = 'system';

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

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function getWebPreference() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(THEME_PREFERENCE_KEY);
  } catch {
    return null;
  }
}

function setWebPreference(preference: ThemePreference) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_PREFERENCE_KEY, preference);
  } catch {
    // Ignore storage errors and keep the in-memory fallback.
  }
}

export async function getStoredThemePreference(): Promise<ThemePreference> {
  const webPreference = getWebPreference();

  if (isThemePreference(webPreference)) {
    memoryThemePreference = webPreference;
    return webPreference;
  }

  if (!(await canUseSecureStore())) {
    return memoryThemePreference;
  }

  try {
    const stored = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);

    if (isThemePreference(stored)) {
      memoryThemePreference = stored;
      return stored;
    }
  } catch {
    return memoryThemePreference;
  }

  return memoryThemePreference;
}

export async function saveThemePreference(preference: ThemePreference) {
  memoryThemePreference = preference;
  setWebPreference(preference);

  if (!(await canUseSecureStore())) {
    return;
  }

  try {
    await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, preference);
  } catch {
    // The in-memory and web fallbacks are enough to keep the UI stable.
  }
}
