import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';

import {
  formatOrderStatus,
  formatPurchaseCurrency,
  formatPurchaseDate,
  formatReceiveStatus,
  getOutstandingQuantity,
} from '@/features/purchases/utils/purchase-display';

import type { PurchaseOrder } from '@/features/purchases/types';

type PurchaseListItemProps = {
  item: PurchaseOrder;
  onPress?: () => void;
};

export function PurchaseListItem({ item, onPress }: PurchaseListItemProps) {
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const orderStatus = formatOrderStatus(item.orderStatus);
  const receiveStatus = formatReceiveStatus(item.receiveStatus);
  const outstandingQuantity = getOutstandingQuantity(item);
  const statusColor =
    item.orderStatus === 'cancelled'
      ? theme.colors.danger
      : item.receiveStatus === 'fully_received'
        ? theme.colors.success
        : theme.colors.warning;

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
          <AppText variant="subtitle">{item.purchaseNumber}</AppText>
          <AppText variant="caption">
            {item.supplierName || item.supplier?.name || 'Supplier not set'}
          </AppText>
        </View>
        <View style={styles.totalBlock}>
          <AppText variant="caption">Order total</AppText>
          <AppText variant="subtitle">{formatPurchaseCurrency(item.totalAmount)}</AppText>
        </View>
      </View>

      <View style={[styles.metricsRow, !responsive.isMdUp && styles.stackColumn]}>
        <View style={styles.metricBlock}>
          <AppText variant="caption">Purchase date</AppText>
          <AppText>{formatPurchaseDate(item.purchaseDate)}</AppText>
        </View>
        <View style={styles.metricBlock}>
          <AppText variant="caption">Outstanding</AppText>
          <AppText>{outstandingQuantity} units</AppText>
        </View>
      </View>

      <View style={[styles.footerRow, !responsive.isMdUp && styles.stackColumn]}>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: `${statusColor}12`,
              borderColor: `${statusColor}35`,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" style={{ color: statusColor }}>
            {orderStatus}
          </AppText>
        </View>
        <View style={[styles.receiveBlock, !responsive.isMdUp && styles.receiveBlockStack]}>
          <AppText variant="caption">Receiving</AppText>
          <AppText>{receiveStatus}</AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    gap: 10,
    padding: 16,
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
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  totalBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBlock: {
    flex: 1,
    gap: 3,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  receiveBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  receiveBlockStack: {
    alignItems: 'flex-start',
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
