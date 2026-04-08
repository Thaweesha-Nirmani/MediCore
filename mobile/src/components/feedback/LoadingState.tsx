import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/theme/useAppTheme';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';

type LoadingStateProps = {
  title?: string;
  message?: string;
};

export function LoadingState({
  title = 'Loading',
  message = 'Please wait while the mobile workspace prepares your data.',
}: LoadingStateProps) {
  const theme = useAppTheme();

  return (
    <AppScreen contentWidth="narrow" showBrandHeader={false}>
      <View style={styles.container}>
        <AppCard variant="hero" style={styles.card}>
          <View
            style={[
              styles.indicatorShell,
              {
                backgroundColor: theme.colors.primarySoft,
                borderColor: theme.colors.borderStrong,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <Ionicons color={theme.colors.primary} name="pulse-outline" size={20} />
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
          <AppText variant="subtitle" style={styles.centered}>
            {title}
          </AppText>
          <AppText style={[styles.centered, styles.message]}>{message}</AppText>
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    maxWidth: 480,
    width: '100%',
  },
  indicatorShell: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  centered: {
    textAlign: 'center',
  },
  message: {
    maxWidth: 360,
  },
});
