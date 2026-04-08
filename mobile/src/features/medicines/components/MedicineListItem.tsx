import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';

import {
  formatMedicineCurrency,
  formatMedicineDate,
  getMedicineDisplayName,
  getMedicineIdentityLine,
  getMedicineSearchMetaLine,
  getStockStatusLabel,
  getMedicineTagValues,
} from '@/features/medicines/utils/medicine-display';

import { MedicineExpiryBadge } from '@/features/medicines/components/MedicineExpiryBadge';

import type { MedicineItem } from '@/features/medicines/types';

type MedicineListItemProps = {
  item: MedicineItem;
  onPress?: () => void;
};

export function MedicineListItem({ item, onPress }: MedicineListItemProps) {
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const tags = getMedicineTagValues(item);
  const quantity = item.quantity ?? item.stock ?? item.inventorySnapshot?.stockOnHand ?? 0;

  return (
    <Pressable
      onPress={onPress}
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
      <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
        <View style={styles.titleBlock}>
          <View style={styles.titleLine}>
            <AppText variant="subtitle">{getMedicineDisplayName(item)}</AppText>
            <View
              style={[
                styles.idPill,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.borderStrong,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText variant="caption" style={{ color: theme.colors.primary }}>
                {item.medicineId || 'No ID'}
              </AppText>
            </View>
          </View>
          <AppText>{getMedicineIdentityLine(item)}</AppText>
          <AppText variant="caption">{getMedicineSearchMetaLine(item)}</AppText>
        </View>

        <View
          style={[
            styles.pricePill,
            {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <AppText variant="caption">Price</AppText>
          <AppText variant="label" style={{ color: theme.colors.primary }}>
            {formatMedicineCurrency(item.unitPrice)}
          </AppText>
        </View>
      </View>

      {tags.length ? (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <IdentityChip key={tag} label={tag} />
          ))}
        </View>
      ) : null}

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
        <OperationalMeta
          icon="cube-outline"
          label="Stock"
          value={`${quantity} units`}
        />
        <OperationalMeta
          icon="calendar-outline"
          label="Next expiry"
          value={formatMedicineDate(item.expiryDate || item.inventorySnapshot?.nextExpiryDate)}
        />
        <OperationalMeta
          icon="barcode-outline"
          label="Barcode"
          value={item.barcode || 'Not set'}
        />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.badgeRow}>
          <StatusBadge label={getStockStatusLabel(item.stockStatus)} tone={item.stockStatus} />
          <MedicineExpiryBadge medicine={item} />
        </View>
        <Ionicons color={theme.colors.mutedText} name="chevron-forward" size={18} />
      </View>
    </Pressable>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone?: MedicineItem['stockStatus'];
}) {
  const theme = useAppTheme();
  const color =
    tone === 'out_of_stock'
      ? theme.colors.danger
      : tone === 'low_stock'
        ? theme.colors.warning
        : theme.colors.success;

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: `${color}14`,
          borderColor: `${color}32`,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <AppText variant="caption" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

function IdentityChip({ label }: { label: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.identityChip,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.borderSoft,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function OperationalMeta({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.metaColumn}>
      <View style={styles.metaLabelRow}>
        <Ionicons color={theme.colors.mutedText} name={icon} size={14} />
        <AppText variant="caption">{label}</AppText>
      </View>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    gap: 14,
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
  stackColumn: {
    flexDirection: 'column',
  },
  titleBlock: {
    flex: 1,
    gap: 6,
  },
  titleLine: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  idPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pricePill: {
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    borderWidth: 1,
    gap: 2,
    minWidth: 90,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  identityChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  snapshotPanel: {
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 14,
  },
  metaColumn: {
    flex: 1,
    gap: 4,
    minWidth: 92,
  },
  metaLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
});
