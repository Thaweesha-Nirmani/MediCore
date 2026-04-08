import { PropsWithChildren } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';

const dashboardBackgroundImage = require('../../../assets/images/Dashboard_BG.png');

type BrandedBackgroundProps = PropsWithChildren<{
  variant?: 'login' | 'workspace';
  style?: StyleProp<ViewStyle>;
}>;

export function BrandedBackground({
  children,
  variant = 'workspace',
  style,
}: BrandedBackgroundProps) {
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const isLogin = variant === 'login';
  const imageOpacity = isLogin ? 1 : theme.isDark ? 0.84 : 0.74;
  const overlayColor = isLogin
    ? theme.isDark
      ? 'rgba(8,18,32,0.18)'
      : 'rgba(247,251,255,0.1)'
    : theme.isDark
      ? 'rgba(10,21,36,0.24)'
      : 'rgba(247,251,255,0.18)';
  const translateY = isLogin
    ? responsive.isLgUp
      ? 26
      : responsive.isMdUp
        ? -132
        : -118
    : responsive.isLgUp
      ? -96
      : responsive.isMdUp
        ? -78
        : -48;
  const translateX = isLogin ? 0 : responsive.isLgUp ? 34 : responsive.isMdUp ? 18 : 0;
  const scale = isLogin
    ? responsive.isLgUp
      ? 0.97
      : responsive.isMdUp
        ? 1.02
        : 1.03
    : responsive.isMdUp
      ? 1.09
      : 1.12;

  return (
    <View style={[styles.root, style]}>
      <Image
        resizeMode="cover"
        source={dashboardBackgroundImage}
        style={[
          styles.image,
          {
            opacity: imageOpacity,
            transform: [{ scale }, { translateX }, { translateY }],
          },
        ]}
      />
      <View pointerEvents="none" style={[styles.overlay, { backgroundColor: overlayColor }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  } as ImageStyle,
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
