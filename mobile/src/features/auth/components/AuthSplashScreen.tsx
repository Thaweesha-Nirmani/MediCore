import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppBrand } from '@/components/layout/AppBrand';
import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';

type AuthSplashScreenProps = {
  title?: string;
  message?: string;
};

export function AuthSplashScreen({
  title = 'Preparing your secure workspace',
  message = 'Checking your session, refreshing access, and loading the mobile shell.',
}: AuthSplashScreenProps) {
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();

  return (
    <AppScreen contentWidth="narrow" showBrandHeader={false}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <AppBrand variant="hero" />
          <View style={styles.copy}>
            <AppText
              variant="caption"
              style={{
                color: theme.colors.primary,
                fontWeight: '700',
                letterSpacing: 0.6,
                textTransform: 'uppercase',
              }}
            >
              Pharmacy Operations
            </AppText>
            <AppText variant="title">MediCore</AppText>
            <AppText style={styles.centered}>{message}</AppText>
          </View>
        </View>

        <AppCard variant="hero">
          <View style={[styles.statusRow, !responsive.isMdUp && styles.statusRowStack]}>
            <View
              style={[
                styles.spinnerShell,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderColor: theme.colors.borderStrong,
                },
              ]}
            >
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
            <View style={styles.statusCopy}>
              <AppText variant="subtitle">{title}</AppText>
              <AppText variant="caption">
                Mobile-safe auth persistence and protected navigation are loading.
              </AppText>
            </View>
          </View>
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 18,
  },
  copy: {
    alignItems: 'center',
    gap: 8,
  },
  centered: {
    maxWidth: 420,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  statusRowStack: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  spinnerShell: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  statusCopy: {
    flex: 1,
    gap: 4,
  },
});
