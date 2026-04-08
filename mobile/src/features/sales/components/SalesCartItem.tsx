import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';

import {
  formatSalesCurrency,
  getSalesStockLabel,
  getSalesStockTone,
} from '@/features/sales/utils/sales-display';

import type { CartItem } from '@/features/sales/types';

type SalesCartItemProps = {
  item: CartItem;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove?: () => void;
};

export function SalesCartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: SalesCartItemProps) {
  const theme = useAppTheme();
  const lineTotal = formatSalesCurrency(item.price * item.quantity);
  const stockTone = getSalesStockTone(item.availableQuantity, item.stockStatus);
  const stockColor =
    stockTone === 'danger'
      ? theme.colors.danger
      : stockTone === 'warning'
        ? theme.colors.warning
        : theme.colors.success;

  return (
    <AppCard variant="subtle">
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <AppText variant="subtitle">{item.displayName}</AppText>
          <AppText variant="caption">
            {[item.genericName || item.category, item.strength, item.dosageForm]
              .filter(Boolean)
              .join(' • ') || 'Medicine'}
          </AppText>
        </View>
        <View
          style={[
            styles.totalShell,
            {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="caption">Line total</AppText>
          <AppText variant="label">{lineTotal}</AppText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaBlock}>
          <AppText variant="caption">Each</AppText>
          <AppText>{formatSalesCurrency(item.price)}</AppText>
        </View>
        <View style={styles.metaBlock}>
          <AppText variant="caption">Stock</AppText>
          <AppText style={{ color: stockColor }}>
            {getSalesStockLabel(item.availableQuantity, item.stockStatus)}
          </AppText>
        </View>
        <View style={[styles.metaBlock, styles.metaBlockRight]}>
          <AppText variant="caption">Barcode</AppText>
          <AppText>{item.barcode || 'Not set'}</AppText>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <AppButton
          label="-"
          variant="secondary"
          onPress={onDecrement}
          style={styles.quantityButton}
        />
        <View
          style={[
            styles.quantityBlock,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <AppText variant="caption">Quantity</AppText>
          <AppText variant="subtitle">{item.quantity}</AppText>
        </View>
        <AppButton label="+" variant="secondary" onPress={onIncrement} style={styles.quantityButton} />
        <AppButton label="Remove" variant="secondary" onPress={onRemove} style={styles.removeButton} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  totalShell: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaBlock: {
    flex: 1,
    gap: 4,
  },
  metaBlockRight: {
    alignItems: 'flex-end',
  },
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  quantityButton: {
    width: 58,
  },
  quantityBlock: {
    alignItems: 'center',
    borderWidth: 1,
    gap: 2,
    minWidth: 84,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  removeButton: {
    flex: 1,
  },
});
