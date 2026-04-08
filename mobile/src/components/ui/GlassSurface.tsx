import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

type GlassSurfaceProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  blurIntensity?: number;
  accent?: 'default' | 'hero' | 'subtle';
}>;

export function GlassSurface({
  children,
  style,
  contentStyle,
  blurIntensity,
  accent = 'default',
}: GlassSurfaceProps) {
  const theme = useAppTheme();
  const overlayColors =
    accent === 'hero'
      ? theme.gradients.hero
      : accent === 'subtle'
        ? ([theme.colors.surfaceMuted, theme.colors.surface] as const)
        : ([theme.colors.surfaceStrong, theme.colors.surface] as const);

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}
    >
      <BlurView
        intensity={blurIntensity ?? theme.effects.blurSoft}
        tint={theme.isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient colors={overlayColors} style={StyleSheet.absoluteFillObject} />
      <View
        pointerEvents="none"
        style={[
          styles.topSheen,
          {
            backgroundColor: theme.colors.glow,
          },
        ]}
      />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  topSheen: {
    left: 18,
    right: 18,
    top: 0,
    height: 1,
    opacity: 0.32,
    position: 'absolute',
  },
});
