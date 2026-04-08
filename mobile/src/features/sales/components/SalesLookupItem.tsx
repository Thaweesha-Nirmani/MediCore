import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';

import {
  formatSalesCurrency,
  getExpiryIndicator,
  getLookupSecondaryLabel,
  getSalesStockLabel,
  getSalesStockTone,
} from '@/features/sales/utils/sales-display';

import type { BillingLookupMedicine } from '@/features/sales/types';

type SalesLookupItemProps = {
  item: BillingLookupMedicine;
  onPress?: () => void;
};

export function SalesLookupItem({ item, onPress }: SalesLookupItemProps) {
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const outOfStock = item.availableQuantity <= 0;
  const stockTone = getSalesStockTone(item.availableQuantity, item.stockStatus);
  const expiry = getExpiryIndicator(item.nextExpiryDate);
  const stockColor =
    stockTone === 'danger'
      ? theme.colors.danger
      : stockTone === 'warning'
        ? theme.colors.warning
        : theme.colors.success;
  const expiryColor =
    expiry?.tone === 'danger'
      ? theme.colors.danger
      : expiry?.tone === 'warning'
        ? theme.colors.warning
        : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={outOfStock}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceStrong,
          borderColor: outOfStock ? `${theme.colors.danger}35` : theme.colors.border,
          borderRadius: theme.radius.lg,
          opacity: outOfStock ? 0.65 : 1,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
        <View style={styles.titleBlock}>
          <AppText variant="subtitle">{item.displayName || item.name}</AppText>
          <AppText variant="caption">{getLookupSecondaryLabel(item)}</AppText>
        </View>
        <View style={styles.metricBlock}>
          <View
            style={[
              styles.pricePill,
              {
                backgroundColor: theme.colors.primarySoft,
                borderColor: theme.colors.borderStrong,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="label" style={{ color: theme.colors.primary }}>
              {formatSalesCurrency(item.price)}
            </AppText>
          </View>
          <View
            style={[
              styles.stockPill,
              {
                backgroundColor: `${stockColor}12`,
                borderColor: `${stockColor}38`,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="caption" style={{ color: stockColor, fontWeight: '700' }}>
              {getSalesStockLabel(item.availableQuantity, item.stockStatus)}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.identityRow}>
        <View
          style={[
            styles.identityPill,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.borderSoft,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="caption">{item.medicineId}</AppText>
        </View>
        {item.category ? (
          <View
            style={[
              styles.identityPill,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.borderSoft,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="caption">{item.category}</AppText>
          </View>
        ) : null}
        {item.dosageForm ? (
          <View
            style={[
              styles.identityPill,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.borderSoft,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="caption">{item.dosageForm}</AppText>
          </View>
        ) : null}
      </View>

      <View style={[styles.metaRow, !responsive.isMdUp && styles.stackColumn]}>
        <View style={styles.metaBlock}>
          <AppText variant="caption">Barcode</AppText>
          <AppText>{item.barcode || 'Barcode not set'}</AppText>
        </View>
        <View style={[styles.metaBlock, styles.metaBlockRight]}>
          <AppText variant="caption">Expiry</AppText>
          <AppText style={{ color: expiryColor }}>{expiry?.label || 'No expiry data'}</AppText>
        </View>
      </View>

      <View style={[styles.footerRow, !responsive.isMdUp && styles.stackColumn]}>
        <AppText variant="caption">
          {outOfStock ? 'Unavailable for sale' : 'Tap to add directly to cart'}
        </AppText>
        <AppText variant="label" style={{ color: theme.colors.primary }}>
          {outOfStock ? 'Review stock' : 'Add'}
        </AppText>
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
  metricBlock: {
    alignItems: 'flex-end',
    gap: 8,
  },
  pricePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stockPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  identityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  identityPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  metaBlock: {
    flex: 1,
    gap: 3,
  },
  metaBlockRight: {
    alignItems: 'flex-end',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
