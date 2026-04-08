import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';

const appLogoLight = require('../../../assets/images/logo-lockup.png');
const appLogoDark = require('../../../assets/images/logo-lockup-dark.png');

type AppBrandProps = {
  variant?: 'hero' | 'header';
  style?: StyleProp<ViewStyle>;
};

export function AppBrand({ variant = 'header', style }: AppBrandProps) {
  const responsive = useResponsiveLayout();
  const theme = useAppTheme();
  const isHero = variant === 'hero';
  const width = isHero
    ? responsive.isMdUp
      ? 226
      : 194
    : responsive.isMdUp
      ? 146
      : 126;
  const height = isHero
    ? responsive.isMdUp
      ? 56
      : 48
    : responsive.isMdUp
      ? 36
      : 32;
  const source = theme.isDark ? appLogoDark : appLogoLight;

  return (
    <View
      style={[
        styles.shell,
        {
          height,
          width,
        },
        style,
      ]}
    >
      <Image source={source} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  } satisfies ViewStyle,
  image: {
    height: '100%',
    width: '100%',
  } as ImageStyle,
});
