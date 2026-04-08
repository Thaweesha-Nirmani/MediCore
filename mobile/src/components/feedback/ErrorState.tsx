import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';

type ErrorStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({ title, message, actionLabel, onAction }: ErrorStateProps) {
  const theme = useAppTheme();

  return (
    <AppScreen contentWidth="narrow" showBrandHeader={false}>
      <View style={styles.container}>
        <AppCard variant="hero" style={styles.card}>
          <View
            style={[
              styles.iconShell,
              {
                backgroundColor: `${theme.colors.danger}12`,
                borderColor: `${theme.colors.danger}30`,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <Ionicons color={theme.colors.danger} name="alert-circle-outline" size={22} />
          </View>
          <AppText variant="title" style={styles.centered}>
            {title}
          </AppText>
          <AppText style={[styles.centered, styles.message]}>{message}</AppText>
          {actionLabel ? (
            <AppButton label={actionLabel} onPress={onAction} style={styles.actionButton} />
          ) : null}
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
  iconShell: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    width: 64,
  },
  centered: {
    textAlign: 'center',
  },
  message: {
    maxWidth: 360,
  },
  actionButton: {
    width: '100%',
  },
});
