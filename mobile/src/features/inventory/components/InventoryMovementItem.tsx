import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';

import {
  formatInventoryDateTime,
  formatMovementDelta,
  getMovementTypeLabel,
} from '@/features/inventory/utils/inventory-display';

import type { InventoryMovement } from '@/features/inventory/types';

type InventoryMovementItemProps = {
  item: InventoryMovement;
};

export function InventoryMovementItem({ item }: InventoryMovementItemProps) {
  const theme = useAppTheme();
  const delta = Number(item.quantityChange || 0);
  const isNegative = delta < 0;
  const tone = isNegative ? theme.colors.danger : theme.colors.success;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceStrong,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <AppText variant="subtitle">{getMovementTypeLabel(item.type)}</AppText>
          <AppText>{item.medicine?.name || item.medicineId}</AppText>
          <AppText variant="caption">Batch {item.batchNumber}</AppText>
        </View>
        <View
          style={[
            styles.deltaPill,
            {
              backgroundColor: `${tone}12`,
              borderColor: `${tone}28`,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <Ionicons color={tone} name={isNegative ? 'arrow-down-outline' : 'arrow-up-outline'} size={15} />
          <AppText
            variant="label"
            style={{
              color: tone,
            }}
          >
            {formatMovementDelta(item)}
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.snapshotPanel,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.borderSoft,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <SnapshotBlock label="Before" value={String(item.beforeQuantity)} />
        <SnapshotBlock label="After" value={String(item.afterQuantity)} emphasize />
        <SnapshotBlock label="When" value={formatInventoryDateTime(item.createdAt)} />
      </View>

      <View style={styles.reasonBlock}>
        <AppText variant="caption">Reason</AppText>
        <AppText>{item.reason}</AppText>
      </View>

      {item.fromLocation || item.toLocation ? (
        <View style={styles.locationRow}>
          <LocationBlock label="From" value={item.fromLocation || 'N/A'} />
          <LocationBlock label="To" value={item.toLocation || 'N/A'} />
        </View>
      ) : null}
    </View>
  );
}

function SnapshotBlock({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.snapshotBlock}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant={emphasize ? 'subtitle' : 'body'}>{value}</AppText>
    </View>
  );
}

function LocationBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.locationBlock}>
      <AppText variant="caption">{label}</AppText>
      <AppText>{value}</AppText>
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
  deltaPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  snapshotPanel: {
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  snapshotBlock: {
    flex: 1,
    gap: 4,
  },
  reasonBlock: {
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationBlock: {
    flex: 1,
    gap: 4,
  },
});
