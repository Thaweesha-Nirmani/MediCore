import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';

import { getAlertLevelLabel } from '@/features/inventory/utils/inventory-display';

import type { LowStockAlert } from '@/features/inventory/types';

type LowStockAlertItemProps = {
  item: LowStockAlert;
  onPress?: () => void;
};

export function LowStockAlertItem({ item, onPress }: LowStockAlertItemProps) {
  const theme = useAppTheme();
  const color =
    item.alertLevel === 'out_of_stock'
      ? theme.colors.danger
      : item.alertLevel === 'critical'
        ? theme.colors.warning
        : theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceStrong,
          borderColor: `${color}30`,
          borderRadius: theme.radius.lg,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <AppText variant="subtitle">
            {item.medicine?.displayName || item.medicine?.name || 'Medicine'}
          </AppText>
          <AppText>{item.medicine?.category || 'General'}</AppText>
          <AppText variant="caption">{item.medicine?.medicineId || 'Unknown ID'}</AppText>
        </View>
        <View
          style={[
            styles.alertPill,
            {
              backgroundColor: `${color}12`,
              borderColor: `${color}28`,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <Ionicons color={color} name="warning-outline" size={15} />
          <AppText variant="label" style={{ color }}>
            {getAlertLevelLabel(item.alertLevel)}
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.statsPanel,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.borderSoft,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <StatBox label="Available" value={String(item.totalAvailableQuantity)} emphasize />
        <StatBox label="Threshold" value={String(item.threshold)} />
        <StatBox label="Batches" value={String(item.batches.length)} />
      </View>

      <View style={styles.footerRow}>
        <AppText variant="caption">
          {item.alertLevel === 'out_of_stock'
            ? 'This medicine is out of stock and needs immediate replenishment.'
            : 'Review the related batches and reorder before the shortage affects operations.'}
        </AppText>
        {onPress ? <Ionicons color={theme.colors.mutedText} name="chevron-forward" size={18} /> : null}
      </View>
    </Pressable>
  );
}

function StatBox({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant={emphasize ? 'title' : 'subtitle'}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    gap: 12,
    padding: 18,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.12,
    shadowRadius: 22,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  alertPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statsPanel: {
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
});
