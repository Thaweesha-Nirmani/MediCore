import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBrand } from '@/components/layout/AppBrand';
import { BrandedBackground } from '@/components/layout/BrandedBackground';
import {
  type ResponsiveContentWidth,
  useResponsiveLayout,
} from '@/hooks/useResponsiveLayout';

type AppScreenProps = PropsWithChildren<{
  contentWidth?: ResponsiveContentWidth;
  showBrandHeader?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function AppScreen({
  children,
  contentWidth = 'page',
  showBrandHeader = true,
  style,
}: AppScreenProps) {
  const responsive = useResponsiveLayout();

  return (
    <SafeAreaView style={styles.safeArea}>
      <BrandedBackground variant="workspace">
        <View
          style={[
            styles.content,
            {
              maxWidth: responsive.getContentMaxWidth(contentWidth),
              paddingHorizontal: responsive.horizontalPadding,
              paddingTop: responsive.topPadding,
              paddingBottom: responsive.bottomPadding,
            },
            style,
          ]}
        >
          {showBrandHeader ? (
            <View style={styles.brandHeader}>
              <AppBrand variant="header" />
            </View>
          ) : null}
          <View style={styles.body}>{children}</View>
        </View>
      </BrandedBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    alignSelf: 'center',
  },
  brandHeader: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  body: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
});
