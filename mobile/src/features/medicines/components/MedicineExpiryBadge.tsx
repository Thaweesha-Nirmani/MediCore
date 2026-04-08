import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';

import { getExpiryStatusLabel } from '@/features/medicines/utils/medicine-display';

import type { MedicineItem } from '@/features/medicines/types';

type MedicineExpiryBadgeProps = {
  medicine: Pick<MedicineItem, 'expiryStatus' | 'daysToExpire'>;
};

export function MedicineExpiryBadge({ medicine }: MedicineExpiryBadgeProps) {
  const theme = useAppTheme();

  const colors = (() => {
    if (medicine.expiryStatus === 'expired') {
      return {
        backgroundColor: `${theme.colors.danger}16`,
        borderColor: `${theme.colors.danger}42`,
        textColor: theme.colors.danger,
        icon: 'alert-circle-outline' as const,
      };
    }

    if (
      medicine.expiryStatus === 'expiring_in_7_days' ||
      medicine.expiryStatus === 'expiring_in_30_days'
    ) {
      return {
        backgroundColor: `${theme.colors.warning}16`,
        borderColor: `${theme.colors.warning}45`,
        textColor: theme.colors.warning,
        icon: 'timer-outline' as const,
      };
    }

    if (medicine.expiryStatus === 'valid') {
      return {
        backgroundColor: `${theme.colors.success}16`,
        borderColor: `${theme.colors.success}40`,
        textColor: theme.colors.success,
        icon: 'checkmark-circle-outline' as const,
      };
    }

    return {
      backgroundColor: `${theme.colors.primary}14`,
      borderColor: `${theme.colors.primary}40`,
      textColor: theme.colors.primary,
      icon: 'shield-checkmark-outline' as const,
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
        {getExpiryStatusLabel(medicine)}
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
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
});
