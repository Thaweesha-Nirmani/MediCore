import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

type AppTextProps = PropsWithChildren<{
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'label';
  style?: StyleProp<TextStyle>;
}> & TextProps;

export function AppText({ children, variant = 'body', style, ...props }: AppTextProps) {
  const theme = useAppTheme();
  const resolvedColor =
    variant === 'caption'
      ? theme.colors.mutedText
      : variant === 'title' || variant === 'subtitle'
        ? theme.colors.heading
        : theme.colors.text;

  return (
    <Text
      {...props}
      style={[
        styles.base,
        variantStyles[variant],
        { color: resolvedColor },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});

const variantStyles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 37,
  },
  subtitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.28,
    lineHeight: 25,
  },
  body: {
    fontSize: 15.5,
    fontWeight: '500',
    lineHeight: 23,
  },
  caption: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.18,
    lineHeight: 19,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.18,
    lineHeight: 18,
  },
});
