import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';

import {
  formatInventoryCurrency,
  getExpirySignal,
  getInventoryDisplayName,
  getInventoryIdentityLine,
  getInventoryTagValues,
} from '@/features/inventory/utils/inventory-display';

import { InventoryStatusBadge } from '@/features/inventory/components/InventoryStatusBadge';

import type { InventoryBatch } from '@/features/inventory/types';

type InventoryBatchItemProps = {
  item: InventoryBatch;
  onPress?: () => void;
};

export function InventoryBatchItem({ item, onPress }: InventoryBatchItemProps) {
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const tags = getInventoryTagValues(item);

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
          <AppText variant="subtitle">{getInventoryDisplayName(item)}</AppText>
          <AppText>{getInventoryIdentityLine(item)}</AppText>
          <View style={styles.inlineMetaRow}>
            <AppText variant="caption">{item.medicine?.medicineId || item.medicineId}</AppText>
            <AppText variant="caption">•</AppText>
            <AppText variant="caption">{getExpirySignal(item)}</AppText>
          </View>
        </View>
        <InventoryStatusBadge status={item.stockStatus} />
      </View>

      {tags.length ? (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <InventoryTag key={tag} label={tag} />
          ))}
        </View>
      ) : null}

      <View
        style={[
          styles.quantityPanel,
          !responsive.supportsTwoColumnForm && styles.stackColumn,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.borderSoft,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <QuantityBlock label="On hand" value={String(item.quantity)} emphasize />
        <QuantityBlock label="Available" value={String(item.availableQuantity)} />
        <QuantityBlock label="Reorder" value={String(item.reorderLevel ?? 0)} />
      </View>

      <View style={[styles.metaGrid, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
        <MetaField label="Purchase" value={formatInventoryCurrency(item.purchasePrice)} />
        <MetaField
          label="Selling"
          value={
            item.sellingPrice === null || item.sellingPrice === undefined
              ? 'Not set'
              : formatInventoryCurrency(item.sellingPrice)
          }
        />
        <MetaField label="Supplier" value={item.supplierId || 'Not set'} />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerMeta}>
          <Ionicons color={theme.colors.mutedText} name="cube-outline" size={14} />
          <AppText variant="caption">Batch-ready stock control</AppText>
        </View>
        <Ionicons color={theme.colors.mutedText} name="chevron-forward" size={18} />
      </View>
    </Pressable>
  );
}

function QuantityBlock({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.quantityBlock}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant={emphasize ? 'title' : 'subtitle'}>{value}</AppText>
    </View>
  );
}

function InventoryTag({ label }: { label: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.tag,
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

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaField}>
      <AppText variant="caption">{label}</AppText>
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
  inlineMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  quantityPanel: {
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  quantityBlock: {
    flex: 1,
    gap: 4,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metaField: {
    flex: 1,
    gap: 4,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
