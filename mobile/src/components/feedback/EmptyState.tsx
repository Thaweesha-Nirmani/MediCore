import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function EmptyState({
  title,
  message,
  icon = 'sparkles-outline',
  actionLabel,
  onAction,
  style,
  compact = false,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <AppCard variant="subtle" style={[styles.card, style]}>
      <View style={[styles.container, compact && styles.compactContainer]}>
        <View
          style={[
            styles.iconShell,
            {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <Ionicons color={theme.colors.primary} name={icon} size={compact ? 22 : 24} />
        </View>
        <View style={styles.copyBlock}>
          <AppText variant="subtitle" style={styles.centeredText}>
            {title}
          </AppText>
          <AppText style={styles.centeredText}>{message}</AppText>
        </View>
        {actionLabel ? <AppButton label={actionLabel} onPress={onAction} /> : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  container: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  compactContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  iconShell: {
    alignItems: 'center',
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  copyBlock: {
    alignItems: 'center',
    gap: 6,
    maxWidth: 460,
  },
  centeredText: {
    textAlign: 'center',
  },
});
