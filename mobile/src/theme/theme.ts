import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';

import { palette } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type AppTheme = {
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceStrong: string;
    surfaceMuted: string;
    surfaceElevated: string;
    text: string;
    heading: string;
    mutedText: string;
    border: string;
    borderSoft: string;
    borderStrong: string;
    primary: string;
    primarySoft: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    shadow: string;
    shadowStrong: string;
    glow: string;
    overlay: string;
    tabInactive: string;
  };
  gradients: {
    appBackground: readonly [string, string, ...string[]];
    hero: readonly [string, string, ...string[]];
    button: readonly [string, string, ...string[]];
    accent: readonly [string, string, ...string[]];
    destructive: readonly [string, string, ...string[]];
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  effects: {
    blurSoft: number;
    blurStrong: number;
  };
  spacing: typeof spacing;
  navigationTheme: Theme;
};

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';

export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    background: palette.sky,
    surface: 'rgba(255,255,255,0.34)',
    surfaceStrong: 'rgba(255,255,255,0.56)',
    surfaceMuted: 'rgba(255,255,255,0.22)',
    surfaceElevated: 'rgba(255,255,255,0.74)',
    text: palette.ink700,
    heading: palette.ink900,
    mutedText: '#56708E',
    border: 'rgba(255,255,255,0.3)',
    borderSoft: 'rgba(255,255,255,0.18)',
    borderStrong: 'rgba(255,255,255,0.56)',
    primary: palette.blueStrong,
    primarySoft: 'rgba(111,169,255,0.2)',
    success: palette.green,
    warning: palette.amber,
    danger: palette.red,
    info: palette.blue,
    shadow: 'rgba(35,86,148,0.1)',
    shadowStrong: 'rgba(24,63,111,0.18)',
    glow: 'rgba(255,255,255,0.48)',
    overlay: 'rgba(15,35,66,0.06)',
    tabInactive: 'rgba(38,69,102,0.58)',
  },
  gradients: {
    appBackground: ['#F3FAFF', '#E5F5FF', '#D5F4FA', '#B9F0E8'],
    hero: ['rgba(255,255,255,0.56)', 'rgba(255,255,255,0.2)'],
    button: ['#82B8FF', '#63C7F7', '#3ED6C6'],
    accent: ['rgba(111,169,255,0.44)', 'rgba(62,214,198,0.2)'],
    destructive: ['#F08EA0', '#E26C83'],
  },
  radius: {
    sm: 14,
    md: 20,
    lg: 28,
    xl: 36,
    pill: 999,
  },
  effects: {
    blurSoft: 40,
    blurStrong: 88,
  },
  navigationTheme: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: palette.sky,
      card: 'rgba(255,255,255,0.2)',
      border: 'rgba(255,255,255,0.32)',
      primary: palette.blueStrong,
      text: palette.ink900,
      notification: palette.red,
    },
  },
  spacing,
};

export const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    background: palette.navyDeep,
    surface: 'rgba(18,34,56,0.66)',
    surfaceStrong: 'rgba(30,48,76,0.82)',
    surfaceMuted: 'rgba(25,42,67,0.56)',
    surfaceElevated: 'rgba(31,49,77,0.9)',
    text: palette.white,
    heading: palette.white,
    mutedText: '#B7CAE2',
    border: 'rgba(184,213,244,0.16)',
    borderSoft: 'rgba(184,213,244,0.1)',
    borderStrong: 'rgba(196,221,247,0.26)',
    primary: '#82BAFF',
    primarySoft: 'rgba(130,186,255,0.2)',
    success: '#45D79B',
    warning: '#F8BB62',
    danger: '#F48D9F',
    info: '#82BAFF',
    shadow: 'rgba(0,0,0,0.24)',
    shadowStrong: 'rgba(0,0,0,0.36)',
    glow: 'rgba(255,255,255,0.16)',
    overlay: 'rgba(255,255,255,0.05)',
    tabInactive: 'rgba(205,225,247,0.56)',
  },
  gradients: {
    appBackground: ['#09162D', '#0D2848', '#125171', '#10636C'],
    hero: ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.05)'],
    button: ['#87BDFF', '#5BCAF3', '#43D5C6'],
    accent: ['rgba(130,186,255,0.24)', 'rgba(67,213,198,0.14)'],
    destructive: ['#F19DAF', '#EC7F96'],
  },
  radius: {
    sm: 14,
    md: 20,
    lg: 28,
    xl: 36,
    pill: 999,
  },
  effects: {
    blurSoft: 34,
    blurStrong: 76,
  },
  navigationTheme: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: palette.navyDeep,
      card: 'rgba(19,35,58,0.62)',
      border: 'rgba(184,213,244,0.18)',
      primary: '#82BAFF',
      text: palette.white,
      notification: '#F48D9F',
    },
  },
  spacing,
};

export function getThemeByMode(mode: ThemeMode): AppTheme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
