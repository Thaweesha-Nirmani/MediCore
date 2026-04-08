import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { AppScreen } from '@/components/layout/AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useAppTheme } from '@/theme/useAppTheme';

import { useSaleDetail } from '@/features/sales/hooks/useSales';
import { getSalesPermissions } from '@/features/sales/utils/sales-access';
import {
  formatPaymentMethodLabel,
  formatSalesCurrency,
  formatSalesDate,
} from '@/features/sales/utils/sales-display';

import type { SaleLineItem } from '@/features/sales/types';

export function SaleDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthSession();
  const permissions = getSalesPermissions(user?.role);
  const saleQuery = useSaleDetail(params.id);

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to open sale details."
      />
    );
  }

  if (saleQuery.isLoading) {
    return (
      <LoadingState
        title="Loading invoice"
        message="Fetching the latest sale lines, totals, and stock allocations."
      />
    );
  }

  if (saleQuery.isError || !saleQuery.data) {
    return (
      <ErrorState
        title="Sale unavailable"
        message="We couldn't load this invoice right now."
        actionLabel="Back to history"
        onAction={() => router.replace(appRoutes.salesHistory as Href)}
      />
    );
  }

  const sale = saleQuery.data;
  const soldAt = sale.date || sale.saleDate || sale.createdAt || null;
  const invoiceStatusColor =
    sale.status === 'completed' || sale.status === 'paid'
      ? theme.colors.success
      : sale.status === 'refunded' || sale.status === 'voided'
        ? theme.colors.danger
        : theme.colors.warning;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
          <AppButton label="New sale" onPress={() => router.replace(appRoutes.sales as Href)} />
        </View>

        <AppCard variant="hero">
          <View style={styles.hero}>
            <AppText variant="caption">Sale details</AppText>
            <AppText variant="title">{sale.billNumber}</AppText>
            <AppText>{sale.customerName || 'Walk-in Customer'}</AppText>
            <AppText>
              {formatSalesDate(soldAt)} • {formatPaymentMethodLabel(sale.paymentMethod)}
            </AppText>
            <View style={styles.heroBottomRow}>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: `${invoiceStatusColor}12`,
                    borderColor: `${invoiceStatusColor}35`,
                  },
                ]}
              >
                <AppText variant="caption" style={{ color: invoiceStatusColor, fontWeight: '700' }}>
                  {(sale.status || 'completed').replace(/_/g, ' ').toUpperCase()}
                </AppText>
              </View>
              <View style={styles.totalShell}>
                <AppText variant="caption">Net total</AppText>
                <AppText variant="subtitle">
                  {formatSalesCurrency(sale.netTotal ?? sale.total)}
                </AppText>
              </View>
            </View>
          </View>
        </AppCard>

        <AppCard variant="subtle">
          <AppText variant="subtitle">Invoice summary</AppText>
          <View style={styles.infoGrid}>
            <DetailField label="Invoice number" value={sale.invoice?.number || sale.billNumber} />
            <DetailField label="Payment method" value={formatPaymentMethodLabel(sale.paymentMethod)} />
            <DetailField label="Sold by" value={sale.soldBy || 'Staff'} />
            <DetailField
              label="Items"
              value={String(sale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0))}
            />
          </View>
        </AppCard>

        <AppCard variant="hero">
          <AppText variant="subtitle">Totals</AppText>
          <View style={styles.totalRow}>
            <AppText>Subtotal</AppText>
            <AppText>{formatSalesCurrency(sale.subtotal)}</AppText>
          </View>
          <View style={styles.totalRow}>
            <AppText>Discount</AppText>
            <AppText>{formatSalesCurrency(sale.discount)}</AppText>
          </View>
          <View style={styles.totalRow}>
            <AppText>Tax</AppText>
            <AppText>{formatSalesCurrency(sale.tax)}</AppText>
          </View>
          <View style={styles.totalRow}>
            <AppText>Service fee</AppText>
            <AppText>{formatSalesCurrency(sale.serviceFee)}</AppText>
          </View>
          {Number(sale.refundTotal || 0) > 0 ? (
            <View style={styles.totalRow}>
              <AppText>Refunds</AppText>
              <AppText>{formatSalesCurrency(sale.refundTotal)}</AppText>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <AppText variant="subtitle">Total</AppText>
            <AppText variant="subtitle">{formatSalesCurrency(sale.total)}</AppText>
          </View>
          {Number(sale.refundTotal || 0) > 0 ? (
            <View style={styles.totalRow}>
              <AppText variant="subtitle">Net total</AppText>
              <AppText variant="subtitle">{formatSalesCurrency(sale.netTotal ?? sale.total)}</AppText>
            </View>
          ) : null}
        </AppCard>

        <AppCard variant="subtle">
          <AppText variant="subtitle">Line items</AppText>
          <View style={styles.itemList}>
            {sale.items.map((item) => (
              <SaleLineCard key={`${item.medicineId}-${item.id || item.name}`} item={item} />
            ))}
          </View>
        </AppCard>

        {sale.notes ? (
          <AppCard variant="subtle">
            <AppText variant="subtitle">Notes</AppText>
            <AppText>{sale.notes}</AppText>
          </AppCard>
        ) : null}

        {sale.refunds?.length ? (
          <AppCard variant="subtle">
            <AppText variant="subtitle">Refund activity</AppText>
            <View style={styles.itemList}>
              {sale.refunds.map((refund) => (
                <View key={refund.id || refund.refundNumber} style={styles.refundRow}>
                  <View style={styles.rowCopy}>
                    <AppText>{refund.refundNumber}</AppText>
                    <AppText variant="caption">{refund.reason}</AppText>
                    <AppText variant="caption">{formatSalesDate(refund.createdAt)}</AppText>
                  </View>
                  <AppText>{formatSalesCurrency(refund.refundTotal)}</AppText>
                </View>
              ))}
            </View>
          </AppCard>
        ) : null}

        <AppCard variant="subtle">
          <AppText variant="subtitle">Next actions</AppText>
          <AppButton
            label="View sales history"
            variant="secondary"
            onPress={() => router.push(appRoutes.salesHistory as Href)}
          />
          <AppButton label="Start another sale" onPress={() => router.replace(appRoutes.sales as Href)} />
        </AppCard>
      </ScrollView>
    </AppScreen>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <AppText variant="caption">{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

function SaleLineCard({ item }: { item: SaleLineItem }) {
  const theme = useAppTheme();
  const secondaryParts = [item.genericName, item.strength, item.dosageForm].filter(Boolean);

  return (
    <View
      style={[
        styles.lineCard,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <View style={styles.lineHeader}>
        <View style={styles.lineCopy}>
          <AppText variant="subtitle">{item.displayName || item.name}</AppText>
          <AppText variant="caption">
            {secondaryParts.join(' | ') || item.category || item.barcode || 'Medicine'}
          </AppText>
        </View>
        <AppText style={styles.lineTotal}>{formatSalesCurrency(item.lineTotal)}</AppText>
      </View>

      <View style={styles.lineMetaRow}>
        <DetailField label="Quantity" value={String(item.quantity)} />
        <DetailField label="Unit price" value={formatSalesCurrency(item.unitPrice)} />
      </View>

      {item.batchAllocations.length ? (
        <View style={styles.batchList}>
          <AppText variant="caption">Batch allocations</AppText>
          {item.batchAllocations.map((allocation, index) => (
            <View key={`${allocation.batchNumber}-${index}`} style={styles.batchRow}>
              <AppText variant="caption">
                {allocation.batchNumber} | {allocation.quantity} units
              </AppText>
              <AppText variant="caption">
                {allocation.location}
                {allocation.expiryDate ? ` | ${formatSalesDate(allocation.expiryDate)}` : ''}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  hero: {
    gap: 8,
  },
  heroBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  totalShell: {
    alignItems: 'flex-end',
    gap: 3,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoBlock: {
    flexBasis: '47%',
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemList: {
    gap: 12,
  },
  lineCard: {
    gap: 10,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  lineHeader: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  lineCopy: {
    flex: 1,
    gap: 4,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  lineTotal: {
    fontWeight: '700',
  },
  lineMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  batchList: {
    gap: 6,
  },
  batchRow: {
    gap: 2,
  },
  refundRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
});
