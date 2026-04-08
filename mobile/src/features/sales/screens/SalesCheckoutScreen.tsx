import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/layout/AppScreen';
import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { EmptyState } from '@/components/feedback/EmptyState';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { PaymentMethodChip } from '@/features/sales/components/PaymentMethodChip';
import { SalesCartItem } from '@/features/sales/components/SalesCartItem';
import { useCreateSale } from '@/features/sales/hooks/useSales';
import { useSalesCartStore } from '@/features/sales/store/useSalesCartStore';
import { getSalesPermissions } from '@/features/sales/utils/sales-access';
import {
  buildCreateSalePayload,
  getCartSubtotal,
  getCheckoutNumbers,
  getCheckoutTotal,
  validateCheckout,
} from '@/features/sales/utils/sales-calculations';
import { formatSalesCurrency } from '@/features/sales/utils/sales-display';

import type { CheckoutFormValues } from '@/features/sales/types';

const PAYMENT_OPTIONS: CheckoutFormValues['paymentMethod'][] = [
  'cash',
  'card',
  'digital_wallet',
  'insurance',
  'credit',
  'other',
];

export function SalesCheckoutScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const permissions = getSalesPermissions(user?.role);
  const items = useSalesCartStore((state) => state.items);
  const checkout = useSalesCartStore((state) => state.checkout);
  const setCheckoutField = useSalesCartStore((state) => state.setCheckoutField);
  const removeItem = useSalesCartStore((state) => state.removeItem);
  const incrementQuantity = useSalesCartStore((state) => state.incrementQuantity);
  const decrementQuantity = useSalesCartStore((state) => state.decrementQuantity);
  const clearCart = useSalesCartStore((state) => state.clearCart);
  const createSaleMutation = useCreateSale();
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormValues, string>>>({});
  const [bannerMessage, setBannerMessage] = useState('');

  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const numbers = useMemo(() => getCheckoutNumbers(checkout), [checkout]);
  const total = useMemo(() => getCheckoutTotal(items, checkout), [checkout, items]);
  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items]
  );
  const errorCount = Object.keys(errors).length;

  if (!permissions.canSell) {
    return (
      <AppScreen>
        <View style={styles.stateBox}>
          <AppText variant="title">Access restricted</AppText>
          <AppText>Your role does not have permission to complete sales.</AppText>
        </View>
      </AppScreen>
    );
  }

  if (!items.length) {
    return (
      <AppScreen contentWidth="narrow">
        <View style={styles.stateBox}>
          <EmptyState
            icon="receipt-outline"
            title="Cart is empty"
            message="Add medicines from the POS screen before previewing an invoice."
            actionLabel="Back to POS"
            onAction={() => router.replace(appRoutes.sales as Href)}
          />
        </View>
      </AppScreen>
    );
  }

  async function submitSale() {
    try {
      const createdSale = await createSaleMutation.mutateAsync(
        buildCreateSalePayload(items, checkout)
      );
      clearCart();
      router.replace(`/(tabs)/sales/${createdSale.id}` as Href);
    } catch {
      setBannerMessage('');
    }
  }

  function handleCompleteSale() {
    const nextErrors = validateCheckout(checkout, items);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    Alert.alert(
      'Complete sale?',
      'This will create the invoice and deduct the sold stock from inventory.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete sale',
          onPress: () => {
            void submitSale();
          },
        },
      ]
    );
  }

  function applyQuantityResult(result: { ok: boolean; message?: string }) {
    setBannerMessage(result.ok ? '' : result.message || 'Unable to update cart quantity.');
  }

  return (
    <KeyboardAwareScreen contentWidth="form" contentContainerStyle={styles.container}>
          <View style={styles.headerRow}>
            <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
            <AppButton
              label="POS"
              variant="secondary"
              onPress={() => router.replace(appRoutes.sales as Href)}
            />
          </View>

          <AppCard variant="hero">
            <View style={styles.heroBlock}>
              <View style={styles.copyBlock}>
                <AppText variant="caption">Invoice preview</AppText>
                <AppText variant="title">Review before you bill</AppText>
                <AppText>
                  Confirm cart lines, customer context, payment method, and totals before
                  completing the sale.
                </AppText>
              </View>

              <View style={styles.heroMetrics}>
                <View
                  style={[
                    styles.heroMetric,
                    responsive.isLgUp
                      ? styles.thirdWidth
                      : responsive.isMdUp
                        ? styles.halfWidth
                        : styles.fullWidth,
                  ]}
                >
                  <AppText variant="caption">Line items</AppText>
                  <AppText variant="subtitle">{items.length}</AppText>
                </View>
                <View
                  style={[
                    styles.heroMetric,
                    responsive.isLgUp
                      ? styles.thirdWidth
                      : responsive.isMdUp
                        ? styles.halfWidth
                        : styles.fullWidth,
                  ]}
                >
                  <AppText variant="caption">Units</AppText>
                  <AppText variant="subtitle">{totalUnits}</AppText>
                </View>
                <View
                  style={[
                    styles.heroMetric,
                    responsive.isLgUp
                      ? styles.thirdWidth
                      : responsive.isMdUp
                        ? styles.halfWidth
                        : styles.fullWidth,
                  ]}
                >
                  <AppText variant="caption">Total due</AppText>
                  <AppText variant="subtitle">{formatSalesCurrency(total)}</AppText>
                </View>
              </View>
            </View>
          </AppCard>

          {bannerMessage ? (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: `${theme.colors.warning}12`,
                  borderColor: `${theme.colors.warning}45`,
                },
              ]}
            >
              <AppText style={{ color: theme.colors.warning }}>{bannerMessage}</AppText>
            </View>
          ) : null}

          {errorCount ? (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: `${theme.colors.warning}12`,
                  borderColor: `${theme.colors.warning}45`,
                },
              ]}
            >
              <AppText style={{ color: theme.colors.warning }}>
                {`${errorCount} field${errorCount === 1 ? '' : 's'} still need attention before you complete this sale.`}
              </AppText>
            </View>
          ) : null}

          {createSaleMutation.error ? (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: `${theme.colors.danger}10`,
                  borderColor: `${theme.colors.danger}45`,
                },
              ]}
            >
              <AppText style={{ color: theme.colors.danger }}>
                {getErrorMessage(createSaleMutation.error, 'Unable to complete sale right now.')}
              </AppText>
            </View>
          ) : null}

          <View style={styles.itemsList}>
            {items.map((item) => (
              <SalesCartItem
                key={item.medicineId}
                item={item}
                onIncrement={() => applyQuantityResult(incrementQuantity(item.medicineId))}
                onDecrement={() => {
                  setBannerMessage('');
                  decrementQuantity(item.medicineId);
                }}
                onRemove={() => {
                  setBannerMessage('');
                  removeItem(item.medicineId);
                }}
              />
            ))}
          </View>

          <AppCard variant="subtle">
            <AppText variant="subtitle">Customer and payment</AppText>
            <AppTextField
              label="Customer name"
              value={checkout.customerName}
              onChangeText={(value) => {
                setErrors((current) => ({ ...current, customerName: undefined }));
                setCheckoutField('customerName', value);
              }}
              error={errors.customerName}
              placeholder="Walk-in Customer"
              helperText="Leave blank to keep this sale as a walk-in customer."
            />

            <View style={styles.paymentWrap}>
              {PAYMENT_OPTIONS.map((option) => (
                <PaymentMethodChip
                  key={option}
                  label={option}
                  active={checkout.paymentMethod === option}
                  onPress={() => setCheckoutField('paymentMethod', option)}
                />
              ))}
            </View>
            <AppText variant="caption">Select the payment method used for this invoice.</AppText>

            <AppTextField
              label="Notes"
              value={checkout.notes}
              onChangeText={(value) => {
                setErrors((current) => ({ ...current, notes: undefined }));
                setCheckoutField('notes', value);
              }}
              error={errors.notes}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
              helperText="Optional notes for insurance, customer instructions, or cashier reference."
            />
          </AppCard>

          <AppCard variant="subtle">
            <AppText variant="subtitle">Adjustments</AppText>
            <AppText variant="caption">
              Use only when the invoice needs a manual discount, tax, or service fee.
            </AppText>
            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppTextField
                label="Discount"
                value={checkout.discount}
                onChangeText={(value) => {
                  setErrors((current) => ({ ...current, discount: undefined }));
                  setCheckoutField('discount', value);
                }}
                keyboardType="decimal-pad"
                inputMode="decimal"
                error={errors.discount}
                containerStyle={styles.field}
                helperText="Enter LKR amount"
              />
              <AppTextField
                label="Tax"
                value={checkout.tax}
                onChangeText={(value) => {
                  setErrors((current) => ({ ...current, tax: undefined }));
                  setCheckoutField('tax', value);
                }}
                keyboardType="decimal-pad"
                inputMode="decimal"
                error={errors.tax}
                containerStyle={styles.field}
                helperText="Enter LKR amount"
              />
            </View>

            <AppTextField
              label="Service fee"
              value={checkout.serviceFee}
              onChangeText={(value) => {
                setErrors((current) => ({ ...current, serviceFee: undefined }));
                setCheckoutField('serviceFee', value);
              }}
              keyboardType="decimal-pad"
              inputMode="decimal"
              error={errors.serviceFee}
              helperText="Enter LKR amount"
            />
          </AppCard>

          <AppCard variant="hero">
            <AppText variant="subtitle">Totals</AppText>
            <View style={styles.totalRow}>
              <AppText>Subtotal</AppText>
              <AppText>{formatSalesCurrency(subtotal)}</AppText>
            </View>
            <View style={styles.totalRow}>
              <AppText>Discount</AppText>
              <AppText>{formatSalesCurrency(numbers.discount)}</AppText>
            </View>
            <View style={styles.totalRow}>
              <AppText>Tax</AppText>
              <AppText>{formatSalesCurrency(numbers.tax)}</AppText>
            </View>
            <View style={styles.totalRow}>
              <AppText>Service fee</AppText>
              <AppText>{formatSalesCurrency(numbers.serviceFee)}</AppText>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <AppText variant="subtitle">Total due</AppText>
              <AppText variant="title" style={styles.totalValue}>
                {formatSalesCurrency(total)}
              </AppText>
            </View>
          </AppCard>

          <AppCard variant="subtle">
            <AppText variant="subtitle">Complete sale</AppText>
            <AppText variant="caption">
              Once confirmed, this invoice will deduct stock and be added to sales history.
            </AppText>
            <AppButton
              label={createSaleMutation.isPending ? 'Completing sale' : 'Complete sale'}
              loading={createSaleMutation.isPending}
              onPress={handleCompleteSale}
              disabled={createSaleMutation.isPending}
            />
          </AppCard>
    </KeyboardAwareScreen>
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
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  stackColumn: {
    flexDirection: 'column',
  },
  heroBlock: {
    gap: 16,
  },
  copyBlock: {
    gap: 8,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroMetric: {
    gap: 4,
    minWidth: 0,
  },
  fullWidth: {
    flexBasis: '100%',
  },
  halfWidth: {
    flexBasis: '48%',
  },
  thirdWidth: {
    flexBasis: '31.5%',
  },
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemsList: {
    gap: 12,
  },
  paymentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalDivider: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    height: 1,
  },
  totalValue: {
    fontSize: 28,
    lineHeight: 32,
  },
  stateBox: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
});
