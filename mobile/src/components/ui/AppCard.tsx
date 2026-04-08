import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

import { GlassSurface } from '@/components/ui/GlassSurface';

type AppCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: 'default' | 'hero' | 'subtle';
}>;

export function AppCard({
  children,
  style,
  contentStyle,
  variant = 'default',
}: AppCardProps) {
  const theme = useAppTheme();
  const resolvedContentStyle =
    variant === 'hero'
      ? styles.heroContent
      : variant === 'subtle'
        ? styles.subtleContent
        : styles.content;

  return (
    <GlassSurface
      style={[
        styles.card,
        {
          borderRadius: theme.radius.lg,
        },
        style,
      ]}
      contentStyle={[resolvedContentStyle, contentStyle]}
      accent={variant === 'hero' ? 'hero' : variant === 'subtle' ? 'subtle' : 'default'}
      blurIntensity={variant === 'hero' ? theme.effects.blurStrong : theme.effects.blurSoft}
    >
      {children}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 0,
  },
  content: {
    gap: 16,
    padding: 20,
  },
  heroContent: {
    gap: 18,
    padding: 24,
  },
  subtleContent: {
    gap: 14,
    padding: 20,
  },
});
