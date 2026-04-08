import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { getStoredThemePreference, saveThemePreference } from '@/utils/theme-preference';

import { AppTheme, ThemeMode, ThemePreference, getThemeByMode } from '@/theme/theme';

type ThemeContextValue = AppTheme & {
  resolvedThemeMode: ThemeMode;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let isMounted = true;

    void getStoredThemePreference().then((storedPreference) => {
      if (isMounted) {
        setThemePreferenceState(storedPreference);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedThemeMode: ThemeMode =
    themePreference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themePreference;
  const theme = getThemeByMode(resolvedThemeMode);
  const value = useMemo(
    () => ({
      ...theme,
      resolvedThemeMode,
      themePreference,
      async setThemePreference(preference: ThemePreference) {
        setThemePreferenceState(preference);
        await saveThemePreference(preference);
      },
    }),
    [resolvedThemeMode, theme, themePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return theme;
}
