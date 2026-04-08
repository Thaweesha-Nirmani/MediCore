import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';

import {
  formatPaymentMethodLabel,
  formatSalesCurrency,
  formatSalesDate,
  getSaleHeadline,
} from '@/features/sales/utils/sales-display';

import type { SaleRecord } from '@/features/sales/types';

type SaleHistoryItemProps = {
  item: SaleRecord;
  onPress?: () => void;
};

export function SaleHistoryItem({ item, onPress }: SaleHistoryItemProps) {
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const status = String(item.status || 'completed').replace(/_/g, ' ');
  const statusColor =
    item.status === 'refunded' || item.status === 'voided'
      ? theme.colors.danger
      : item.status === 'partially_refunded'
        ? theme.colors.warning
        : theme.colors.success;

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
          <AppText variant="subtitle">{getSaleHeadline(item)}</AppText>
          <AppText variant="caption">{item.billNumber}</AppText>
        </View>
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
          <AppText variant="caption" style={{ color: statusColor, fontWeight: '700' }}>
            {status.toUpperCase()}
          </AppText>
        </View>
      </View>

      <View style={[styles.metaGrid, !responsive.isMdUp && styles.stackColumn]}>
        <View style={styles.metricBlock}>
          <AppText variant="caption">Total</AppText>
          <AppText variant="subtitle">{formatSalesCurrency(item.netTotal ?? item.total)}</AppText>
        </View>
        <View style={styles.metricBlock}>
          <AppText variant="caption">Payment</AppText>
          <AppText>{formatPaymentMethodLabel(item.paymentMethod)}</AppText>
        </View>
      </View>

      <View style={[styles.metaRow, !responsive.isMdUp && styles.stackColumn]}>
        <AppText variant="caption">
          {item.itemCount ??
            item.medicines?.reduce((sum, medicine) => sum + (medicine.quantity || 0), 0) ??
            0}{' '}
          items
        </AppText>
        <AppText variant="caption">
          {formatSalesDate(item.date || item.saleDate || item.createdAt)}
        </AppText>
      </View>

      {Number(item.refundTotal || 0) > 0 ? (
        <AppText variant="caption" style={{ color: theme.colors.warning }}>
          Refund activity: {formatSalesCurrency(item.refundTotal)}
        </AppText>
      ) : null}
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
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBlock: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
