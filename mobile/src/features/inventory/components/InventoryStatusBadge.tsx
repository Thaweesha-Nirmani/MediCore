import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';

import { getStockStatusLabel } from '@/features/inventory/utils/inventory-display';

type InventoryStatusBadgeProps = {
  status?: string | null;
};

export function InventoryStatusBadge({ status }: InventoryStatusBadgeProps) {
  const theme = useAppTheme();
  const normalized = String(status || '').trim().toLowerCase();

  const colors = (() => {
    if (normalized === 'out_of_stock' || normalized === 'expired') {
      return {
        backgroundColor: `${theme.colors.danger}15`,
        borderColor: `${theme.colors.danger}42`,
        textColor: theme.colors.danger,
        icon: 'alert-circle-outline' as const,
      };
    }

    if (normalized === 'low_stock' || normalized === 'damaged' || normalized === 'quarantined') {
      return {
        backgroundColor: `${theme.colors.warning}15`,
        borderColor: `${theme.colors.warning}45`,
        textColor: theme.colors.warning,
        icon: 'warning-outline' as const,
      };
    }

    return {
      backgroundColor: `${theme.colors.success}15`,
      borderColor: `${theme.colors.success}42`,
      textColor: theme.colors.success,
      icon: 'checkmark-circle-outline' as const,
    };
  })();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <Ionicons color={colors.textColor} name={colors.icon} size={15} />
      <AppText variant="label" style={{ color: colors.textColor }}>
        {getStockStatusLabel(status)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 34,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
});
