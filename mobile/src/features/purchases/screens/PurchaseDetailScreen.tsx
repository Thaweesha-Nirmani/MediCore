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

import { usePurchaseDetail } from '@/features/purchases/hooks/usePurchases';
import { getPurchasePermissions } from '@/features/purchases/utils/purchase-access';
import {
  formatOrderStatus,
  formatPurchaseCurrency,
  formatPurchaseDate,
  formatPurchaseDateTime,
  formatReceiveStatus,
  getOutstandingQuantity,
  getReceivedQuantity,
} from '@/features/purchases/utils/purchase-display';

export function PurchaseDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthSession();
  const permissions = getPurchasePermissions(user?.role);
  const purchaseQuery = usePurchaseDetail(params.id);

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to open purchase order details."
      />
    );
  }

  if (purchaseQuery.isLoading) {
    return (
      <LoadingState
        title="Loading purchase order"
        message="Preparing supplier, line item, and receiving details."
      />
    );
  }

  if (purchaseQuery.isError || !purchaseQuery.data) {
    return (
      <ErrorState
        title="Purchase unavailable"
        message="We couldn't load this purchase order right now."
        actionLabel="Back to purchases"
        onAction={() => router.replace(appRoutes.purchases as Href)}
      />
    );
  }

  const purchase = purchaseQuery.data;
  const outstandingQuantity = getOutstandingQuantity(purchase);
  const receivedQuantity = getReceivedQuantity(purchase);
  const canReceive =
    permissions.canReceive &&
    purchase.orderStatus !== 'cancelled' &&
    purchase.receiveStatus !== 'fully_received';
  const statusColor =
    purchase.orderStatus === 'cancelled'
      ? theme.colors.danger
      : purchase.receiveStatus === 'fully_received'
        ? theme.colors.success
        : theme.colors.warning;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
          {canReceive ? (
            <AppButton
              label="Receive stock"
              onPress={() => router.push(`/(tabs)/more/purchases/receive/${purchase.id}` as Href)}
            />
          ) : null}
        </View>

        <AppCard variant="hero">
          <View style={styles.hero}>
            <AppText variant="caption">Purchase order</AppText>
            <AppText variant="title">{purchase.purchaseNumber}</AppText>
            <AppText>
              {purchase.supplierName || purchase.supplier?.name || 'Supplier not set'}
            </AppText>
            <View style={styles.heroBottomRow}>
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
                  {formatOrderStatus(purchase.orderStatus)}
                </AppText>
              </View>
              <View style={styles.totalShell}>
                <AppText variant="caption">Outstanding</AppText>
                <AppText variant="subtitle">{outstandingQuantity} units</AppText>
              </View>
            </View>
          </View>
        </AppCard>

        <AppCard variant="subtle">
          <AppText variant="subtitle">Order summary</AppText>
          <View style={styles.infoGrid}>
            <DetailField
              label="Supplier"
              value={purchase.supplierName || purchase.supplier?.name || 'Not set'}
            />
            <DetailField
              label="Receive status"
              value={formatReceiveStatus(purchase.receiveStatus)}
            />
            <DetailField label="Purchase date" value={formatPurchaseDate(purchase.purchaseDate)} />
            <DetailField
              label="Expected delivery"
              value={formatPurchaseDate(purchase.expectedDeliveryDate)}
            />
            <DetailField label="Total" value={formatPurchaseCurrency(purchase.totalAmount)} />
            <DetailField label="Line items" value={String(purchase.items.length)} />
            <DetailField label="Received units" value={String(receivedQuantity)} />
            <DetailField label="Outstanding units" value={String(outstandingQuantity)} />
          </View>
        </AppCard>

        <AppCard variant="subtle">
          <AppText variant="subtitle">Order lines</AppText>
          <View style={styles.sectionList}>
            {purchase.items.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.lineCard,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceElevated,
                  },
                ]}
              >
                <View style={styles.lineHeader}>
                  <View style={styles.lineTitleBlock}>
                    <AppText variant="subtitle">
                      {item.medicine.displayName || item.medicineName}
                    </AppText>
                    <AppText variant="caption">
                      {item.medicine.medicineId}
                      {item.medicine.genericName ? ` | ${item.medicine.genericName}` : ''}
                    </AppText>
                  </View>
                  <AppText variant="subtitle">
                    {formatPurchaseCurrency(item.subtotal)}
                  </AppText>
                </View>

                <View style={styles.lineMetrics}>
                  <View style={styles.lineMetricBlock}>
                    <AppText variant="caption">Ordered</AppText>
                    <AppText>{item.orderedQuantity}</AppText>
                  </View>
                  <View style={styles.lineMetricBlock}>
                    <AppText variant="caption">Received</AppText>
                    <AppText>{item.receivedQuantity}</AppText>
                  </View>
                  <View style={styles.lineMetricBlock}>
                    <AppText variant="caption">Remaining</AppText>
                    <AppText>{item.remainingQuantity}</AppText>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <DetailField label="Unit cost" value={formatPurchaseCurrency(item.unitCost)} />
                  <DetailField
                    label="Selling price"
                    value={
                      item.sellingPrice === null || item.sellingPrice === undefined
                        ? 'Not set'
                        : formatPurchaseCurrency(item.sellingPrice)
                    }
                  />
                </View>
              </View>
            ))}
          </View>
        </AppCard>

        {purchase.receivingEvents.length ? (
          <AppCard variant="subtle">
            <AppText variant="subtitle">Receiving history</AppText>
            <View style={styles.sectionList}>
              {purchase.receivingEvents.map((event) => (
                <View
                  key={event.id}
                  style={[
                    styles.lineCard,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surfaceElevated,
                    },
                  ]}
                >
                  <AppText variant="subtitle">{formatPurchaseDateTime(event.receivedAt)}</AppText>
                  {event.notes ? <AppText>{event.notes}</AppText> : null}
                  {event.items.map((eventItem, index) => (
                    <View key={`${event.id}-${index}`} style={styles.eventItem}>
                      <AppText variant="caption">
                        {eventItem.batchNumber} | {eventItem.quantityReceived} units
                      </AppText>
                      <AppText variant="caption">
                        {eventItem.location || 'MAIN_STORE'}
                        {eventItem.expiryDate
                          ? ` | ${formatPurchaseDate(eventItem.expiryDate)}`
                          : ''}
                      </AppText>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </AppCard>
        ) : null}

        {purchase.notes ? (
          <AppCard variant="subtle">
            <AppText variant="subtitle">Notes</AppText>
            <AppText>{purchase.notes}</AppText>
          </AppCard>
        ) : null}

        <AppCard variant="subtle">
          <AppText variant="subtitle">Next actions</AppText>
          <AppButton
            label="View supplier"
            variant="secondary"
            onPress={() => router.push(`/(tabs)/more/suppliers/${purchase.supplierId}` as Href)}
          />
          {canReceive ? (
            <AppButton
              label="Receive stock"
              onPress={() => router.push(`/(tabs)/more/purchases/receive/${purchase.id}` as Href)}
            />
          ) : null}
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
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  sectionList: {
    gap: 12,
  },
  lineCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  lineHeader: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  lineTitleBlock: {
    flex: 1,
    gap: 4,
  },
  lineMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  lineMetricBlock: {
    flex: 1,
    gap: 3,
  },
  eventItem: {
    gap: 2,
  },
});
