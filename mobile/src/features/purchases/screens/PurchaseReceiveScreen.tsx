import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppDateField } from '@/components/ui/AppDateField';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { usePurchaseDetail, useReceivePurchase } from '@/features/purchases/hooks/usePurchases';
import { getPurchasePermissions } from '@/features/purchases/utils/purchase-access';
import {
  createReceiveFormValues,
  toReceivePurchasePayload,
  validateReceivePurchaseForm,
} from '@/features/purchases/utils/purchase-form';

import type { ReceivePurchaseFormValues } from '@/features/purchases/types';

export function PurchaseReceiveScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthSession();
  const permissions = getPurchasePermissions(user?.role);
  const purchaseQuery = usePurchaseDetail(params.id);
  const receiveMutation = useReceivePurchase(String(params.id || ''));
  const [values, setValues] = useState<ReceivePurchaseFormValues>({
    receivedAt: '',
    notes: '',
    items: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (purchaseQuery.data) {
      setValues(createReceiveFormValues(purchaseQuery.data));
    }
  }, [purchaseQuery.data]);

  if (!permissions.canReceive) {
    return (
      <ErrorState
        title="Receiving restricted"
        message="Your role does not have permission to receive purchase orders."
      />
    );
  }

  if (purchaseQuery.isLoading) {
    return (
      <LoadingState
        title="Loading purchase"
        message="Preparing outstanding line items for receiving."
      />
    );
  }

  if (purchaseQuery.isError || !purchaseQuery.data) {
    return (
      <ErrorState
        title="Purchase unavailable"
        message="We couldn't load this purchase order for receiving."
        actionLabel="Back to purchases"
        onAction={() => router.replace(appRoutes.purchases as Href)}
      />
    );
  }

  if (!values.items.length) {
    return (
      <ErrorState
        title="Nothing left to receive"
        message="All remaining items on this purchase order have already been received."
        actionLabel="Back to purchase"
        onAction={() => router.replace(`/(tabs)/more/purchases/${purchaseQuery.data.id}` as Href)}
      />
    );
  }

  const enabledItems = values.items.filter((item) => item.enabled);
  const enabledUnits = enabledItems.reduce(
    (sum, item) => sum + Number(item.quantityReceived || 0),
    0
  );
  const errorCount = Object.keys(errors).length;
  const canSubmit =
    Object.keys(validateReceivePurchaseForm(values)).length === 0 && !receiveMutation.isPending;

  function updateField(field: keyof ReceivePurchaseFormValues, value: string) {
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    receiveMutation.reset();
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateItem(
    index: number,
    field: keyof ReceivePurchaseFormValues['items'][number],
    value: string | boolean
  ) {
    setErrors((current) => {
      const next = { ...current };
      delete next[`items.${index}.${field}`];
      delete next.items;
      return next;
    });
    receiveMutation.reset();
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  }

  async function submitReceipt() {
    try {
      const updated = await receiveMutation.mutateAsync(toReceivePurchasePayload(values));
      Alert.alert('Stock received', 'The received items have been posted into inventory.', [
        {
          text: 'Open purchase',
          onPress: () => {
            router.replace(`/(tabs)/more/purchases/${updated.id}` as Href);
          },
        },
      ]);
    } catch {
      return;
    }
  }

  function handleSubmit() {
    const nextErrors = validateReceivePurchaseForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    Alert.alert(
      'Confirm receiving?',
      'This will create inventory batches for the enabled purchase lines.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm receipt',
          onPress: () => {
            void submitReceipt();
          },
        },
      ]
    );
  }

  return (
    <KeyboardAwareScreen contentWidth="form" contentContainerStyle={styles.container}>
          <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
            <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
            <AppButton
              label={receiveMutation.isPending ? 'Receiving stock' : 'Confirm receipt'}
              loading={receiveMutation.isPending}
              onPress={() => {
                handleSubmit();
              }}
              disabled={!canSubmit}
            />
          </View>

          <AppCard variant="hero">
            <View style={styles.copyBlock}>
              <AppText variant="caption">Receive purchase</AppText>
              <AppText variant="title">{purchaseQuery.data.purchaseNumber}</AppText>
              <AppText>
                Convert received supplier stock into inventory batches with expiry and pricing
                details.
              </AppText>

              <View style={styles.heroMetrics}>
                <View
                  style={[
                    styles.metricCard,
                    responsive.isLgUp
                      ? styles.thirdWidth
                      : responsive.isMdUp
                        ? styles.halfWidth
                        : styles.fullWidth,
                  ]}
                >
                  <AppText variant="caption">Active lines</AppText>
                  <AppText variant="subtitle">{enabledItems.length}</AppText>
                </View>
                <View
                  style={[
                    styles.metricCard,
                    responsive.isLgUp
                      ? styles.thirdWidth
                      : responsive.isMdUp
                        ? styles.halfWidth
                        : styles.fullWidth,
                  ]}
                >
                  <AppText variant="caption">Units receiving</AppText>
                  <AppText variant="subtitle">{enabledUnits}</AppText>
                </View>
                <View
                  style={[
                    styles.metricCard,
                    responsive.isLgUp
                      ? styles.thirdWidth
                      : responsive.isMdUp
                        ? styles.halfWidth
                        : styles.fullWidth,
                  ]}
                >
                  <AppText variant="caption">Supplier</AppText>
                  <AppText variant="subtitle">
                    {purchaseQuery.data.supplierName || purchaseQuery.data.supplier?.name || 'Not set'}
                  </AppText>
                </View>
              </View>
            </View>
          </AppCard>

          {errorCount ? (
            <AppCard variant="subtle">
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor: `${theme.colors.warning}12`,
                    borderColor: `${theme.colors.warning}45`,
                  },
                ]}
              >
                <AppText style={{ color: theme.colors.warning }}>
                  {`${errorCount} field${errorCount === 1 ? '' : 's'} still need attention before you confirm this receiving event.`}
                </AppText>
              </View>
            </AppCard>
          ) : null}

          <AppCard variant="subtle">
            <AppText variant="subtitle">Receiving event</AppText>
            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppDateField
                label="Received date"
                required
                value={values.receivedAt}
                onChangeText={(value) => updateField('receivedAt', value)}
                placeholder="YYYY-MM-DD"
                error={errors.receivedAt}
                containerStyle={styles.field}
                helperText="Date the stock physically arrived"
              />
              <AppTextField
                label="Notes"
                value={values.notes}
                onChangeText={(value) => updateField('notes', value)}
                containerStyle={styles.field}
                helperText="Optional receiving summary"
              />
            </View>
          </AppCard>

          {errors.items ? (
            <View
              style={[
                styles.messageBox,
                {
                  backgroundColor: `${theme.colors.danger}10`,
                  borderColor: `${theme.colors.danger}45`,
                },
              ]}
            >
              <AppText style={{ color: theme.colors.danger }}>{errors.items}</AppText>
            </View>
          ) : null}

          <View style={styles.itemsList}>
            {values.items.map((item, index) => (
              <AppCard key={item.purchaseItemId}>
                <View style={[styles.lineHeader, !responsive.isMdUp && styles.stackColumn]}>
                  <View style={styles.lineTitleBlock}>
                    <AppText variant="subtitle">{item.medicineName}</AppText>
                    <AppText variant="caption">{item.remainingQuantity} units remaining</AppText>
                  </View>
                  <InventoryFilterChip
                    label={item.enabled ? 'Receiving' : 'Skipped'}
                    active={item.enabled}
                    onPress={() => updateItem(index, 'enabled', !item.enabled)}
                  />
                </View>

                  <View style={[styles.lineMetrics, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
                  <View style={styles.metricCardCompact}>
                    <AppText variant="caption">Remaining</AppText>
                    <AppText>{item.remainingQuantity}</AppText>
                  </View>
                  <View style={styles.metricCardCompact}>
                    <AppText variant="caption">Purchase price</AppText>
                    <AppText>{item.purchasePrice || 'Not set'}</AppText>
                  </View>
                  <View style={styles.metricCardCompact}>
                    <AppText variant="caption">Location</AppText>
                    <AppText>{item.location || 'MAIN_STORE'}</AppText>
                  </View>
                </View>

                {item.enabled ? (
                  <>
                    <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
                      <AppTextField
                        label="Quantity received"
                        required
                        value={item.quantityReceived}
                        onChangeText={(value) => updateItem(index, 'quantityReceived', value)}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        error={errors[`items.${index}.quantityReceived`]}
                        containerStyle={styles.field}
                        helperText="Cannot exceed remaining quantity"
                      />
                      <AppTextField
                        label="Batch number"
                        required
                        value={item.batchNumber}
                        onChangeText={(value) => updateItem(index, 'batchNumber', value)}
                        error={errors[`items.${index}.batchNumber`]}
                        containerStyle={styles.field}
                        helperText="Required"
                      />
                    </View>

                    <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
                      <AppDateField
                        label="Expiry date"
                        required
                        value={item.expiryDate}
                        onChangeText={(value) => updateItem(index, 'expiryDate', value)}
                        placeholder="YYYY-MM-DD"
                        error={errors[`items.${index}.expiryDate`]}
                        containerStyle={styles.field}
                        helperText="Required"
                      />
                      <AppDateField
                        label="Manufacture date"
                        value={item.manufactureDate}
                        onChangeText={(value) => updateItem(index, 'manufactureDate', value)}
                        placeholder="YYYY-MM-DD"
                        error={errors[`items.${index}.manufactureDate`]}
                        containerStyle={styles.field}
                        helperText="Optional"
                      />
                    </View>

                    <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
                      <AppTextField
                        label="Location"
                        value={item.location}
                        onChangeText={(value) => updateItem(index, 'location', value)}
                        containerStyle={styles.field}
                        helperText="Store or stock room"
                      />
                      <AppTextField
                        label="Purchase price"
                        required
                        value={item.purchasePrice}
                        onChangeText={(value) => updateItem(index, 'purchasePrice', value)}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        error={errors[`items.${index}.purchasePrice`]}
                        containerStyle={styles.field}
                        helperText="Required"
                      />
                    </View>

                    <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
                      <AppTextField
                        label="Selling price"
                        value={item.sellingPrice}
                        onChangeText={(value) => updateItem(index, 'sellingPrice', value)}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        error={errors[`items.${index}.sellingPrice`]}
                        containerStyle={styles.field}
                        helperText="Optional"
                      />
                      <AppTextField
                        label="Line notes"
                        value={item.notes}
                        onChangeText={(value) => updateItem(index, 'notes', value)}
                        containerStyle={styles.field}
                        helperText="Optional"
                      />
                    </View>
                  </>
                ) : (
                  <AppText variant="caption">
                    This line will be skipped for the current receiving event.
                  </AppText>
                )}
              </AppCard>
            ))}
          </View>

          {receiveMutation.error ? (
            <View
              style={[
                styles.messageBox,
                {
                  backgroundColor: `${theme.colors.danger}10`,
                  borderColor: `${theme.colors.danger}45`,
                },
              ]}
            >
              <AppText style={{ color: theme.colors.danger }}>
                {getErrorMessage(receiveMutation.error, 'Unable to receive purchase stock.')}
              </AppText>
            </View>
          ) : null}

          <AppCard variant="subtle">
            <View style={styles.footerActions}>
              <View style={styles.footerCopy}>
                <AppText variant="subtitle">Ready to post received stock?</AppText>
                <AppText variant="caption">
                  Confirm only after the batch, expiry, quantity, and pricing details are checked.
                </AppText>
              </View>
              <View style={[styles.footerButtons, !responsive.isMdUp && styles.stackColumn]}>
                <AppButton
                  label="Cancel"
                  variant="secondary"
                  onPress={() => router.back()}
                  style={styles.footerButton}
                />
                <AppButton
                  label="Confirm receipt"
                  loading={receiveMutation.isPending}
                  onPress={handleSubmit}
                  style={styles.footerButton}
                  disabled={!canSubmit}
                />
              </View>
            </View>
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
    justifyContent: 'space-between',
  },
  stackColumn: {
    flexDirection: 'column',
  },
  copyBlock: {
    gap: 8,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  messageBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemsList: {
    gap: 12,
  },
  lineHeader: {
    flexDirection: 'row',
    gap: 10,
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
  metricCardCompact: {
    flex: 1,
    gap: 3,
  },
  footerActions: {
    gap: 14,
  },
  footerCopy: {
    gap: 4,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
});
