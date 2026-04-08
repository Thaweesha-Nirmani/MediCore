import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppDateField } from '@/components/ui/AppDateField';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { useMedicineAutocomplete } from '@/features/medicines/hooks/useMedicines';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { useSupplierDetail, useSupplierSearch } from '@/features/suppliers/hooks/useSuppliers';

import { useCreatePurchase } from '@/features/purchases/hooks/usePurchases';
import { getPurchasePermissions } from '@/features/purchases/utils/purchase-access';
import { formatPurchaseCurrency } from '@/features/purchases/utils/purchase-display';
import {
  createEmptyPurchaseFormValues,
  createEmptyPurchaseLine,
  toCreatePurchasePayload,
  validatePurchaseForm,
} from '@/features/purchases/utils/purchase-form';

import type { PurchaseFormValues } from '@/features/purchases/types';

const ORDER_STATUS_OPTIONS: PurchaseFormValues['orderStatus'][] = ['draft', 'placed'];
const purchaseErrorLabels: Record<string, string> = {
  supplierId: 'Supplier',
  purchaseDate: 'Purchase date',
  expectedDeliveryDate: 'Expected delivery',
  items: 'Medicine items',
  'items.0.medicineId': 'Medicine line 1',
  'items.0.orderedQuantity': 'Line 1 quantity',
  'items.0.unitCost': 'Line 1 unit cost',
  'items.0.sellingPrice': 'Line 1 selling price',
};

export function PurchaseCreateScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const params = useLocalSearchParams<{ supplierId?: string }>();
  const { user } = useAuthSession();
  const permissions = getPurchasePermissions(user?.role);
  const createMutation = useCreatePurchase();
  const [values, setValues] = useState<PurchaseFormValues>(createEmptyPurchaseFormValues());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bannerMessage, setBannerMessage] = useState('');
  const debouncedSupplierSearch = useDebouncedValue(values.supplierSearch.trim(), 250);
  const [medicineSearch, setMedicineSearch] = useState('');
  const debouncedMedicineSearch = useDebouncedValue(medicineSearch.trim(), 250);
  const supplierSearchQuery = useSupplierSearch(debouncedSupplierSearch, 6);
  const selectedSupplierQuery = useSupplierDetail(values.supplierId || params.supplierId);
  const medicineSearchQuery = useMedicineAutocomplete(debouncedMedicineSearch, 8);

  useEffect(() => {
    if (params.supplierId && !values.supplierId) {
      setValues((current) => ({
        ...current,
        supplierId: String(params.supplierId),
      }));
    }
  }, [params.supplierId, values.supplierId]);

  useEffect(() => {
    if (selectedSupplierQuery.data) {
      setValues((current) => ({
        ...current,
        supplierId: current.supplierId || selectedSupplierQuery.data.id,
        supplierSearch:
          current.supplierSearch || selectedSupplierQuery.data.name || current.supplierSearch,
      }));
    }
  }, [selectedSupplierQuery.data]);

  const supplierSuggestions = supplierSearchQuery.data || [];
  const medicineSuggestions = medicineSearchQuery.data || [];
  const selectedSupplier =
    selectedSupplierQuery.data && selectedSupplierQuery.data.id === values.supplierId
      ? selectedSupplierQuery.data
      : supplierSuggestions.find((item) => item.id === values.supplierId) || null;
  const estimatedTotal = useMemo(
    () =>
      values.items.reduce((sum, item) => {
        const quantity = Number(item.orderedQuantity);
        const unitCost = Number(item.unitCost);
        if (!Number.isFinite(quantity) || !Number.isFinite(unitCost)) {
          return sum;
        }

        return sum + quantity * unitCost;
      }, 0),
    [values.items]
  );

  const errorCount = Object.keys(errors).length;
  const errorFieldSummary = getPurchaseErrorSummary(errors);

  if (!permissions.canManage) {
    return (
      <ErrorState
        title="Purchasing restricted"
        message="Your role does not have permission to create purchase orders."
        actionLabel="Back to purchases"
        onAction={() => router.replace(appRoutes.purchases as Href)}
      />
    );
  }

  function updateField(field: keyof PurchaseFormValues, value: string) {
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    createMutation.reset();
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateLine(
    lineKey: string,
    field: keyof PurchaseFormValues['items'][number],
    value: string
  ) {
    setErrors((current) => {
      const next = { ...current };
      const index = values.items.findIndex((item) => item.key === lineKey);
      if (index >= 0) {
        delete next[`items.${index}.${field}`];
      }
      delete next.items;
      return next;
    });
    createMutation.reset();
    setValues((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.key === lineKey
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  }

  function removeLine(lineKey: string) {
    Alert.alert('Remove medicine line?', 'This will remove the medicine from the purchase draft.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setBannerMessage('');
          setValues((current) => ({
            ...current,
            items: current.items.filter((item) => item.key !== lineKey),
          }));
        },
      },
    ]);
  }

  function selectSupplier(id: string, label: string) {
    setBannerMessage('');
    setErrors((current) => {
      const next = { ...current };
      delete next.supplierId;
      return next;
    });
    setValues((current) => ({
      ...current,
      supplierId: id,
      supplierSearch: label,
    }));
  }

  function addMedicineLine(id: string, label: string) {
    setBannerMessage('');
    setErrors((current) => {
      const next = { ...current };
      delete next.items;
      return next;
    });

    if (values.items.some((item) => item.medicineId === id)) {
      setBannerMessage('This medicine is already in the purchase order.');
      return;
    }

    const nextLine = createEmptyPurchaseLine();
    nextLine.medicineId = id;
    nextLine.medicineName = label;
    nextLine.medicineSearch = label;

    setValues((current) => ({
      ...current,
      items: [...current.items, nextLine],
    }));
    setMedicineSearch('');
  }

  async function handleSubmit() {
    const nextErrors = validatePurchaseForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      const created = await createMutation.mutateAsync(toCreatePurchasePayload(values));
      Alert.alert(
        'Purchase order created',
        'The purchase order is ready for review and receiving.',
        [
          {
            text: 'Open order',
            onPress: () => {
              router.replace(`/(tabs)/more/purchases/${created.id}` as Href);
            },
          },
        ]
      );
    } catch {
      setBannerMessage('');
    }
  }

  return (
    <KeyboardAwareScreen contentWidth="form" contentContainerStyle={styles.container}>
          <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
            <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
            <AppButton
              label={createMutation.isPending ? 'Creating order' : 'Create purchase'}
              loading={createMutation.isPending}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={createMutation.isPending}
            />
          </View>

          <AppCard variant="hero">
            <View style={styles.copyBlock}>
              <AppText variant="caption">Purchase management</AppText>
              <AppText variant="title">Create purchase order</AppText>
              <AppText>
                Select a supplier, add medicines, and build a purchase order that can flow
                directly into receiving.
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
                  <AppText variant="caption">Line items</AppText>
                  <AppText variant="subtitle">{values.items.length}</AppText>
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
                  <AppText variant="subtitle">{selectedSupplier ? 'Selected' : 'Required'}</AppText>
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
                  <AppText variant="caption">Estimated total</AppText>
                  <AppText variant="subtitle">{formatPurchaseCurrency(estimatedTotal)}</AppText>
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
                  {`${errorCount} field${errorCount === 1 ? '' : 's'} still need attention before you create this purchase order.`}
                </AppText>
                {errorFieldSummary ? <AppText>{errorFieldSummary}</AppText> : null}
              </View>
            </AppCard>
          ) : null}

          <AppCard variant="subtle">
            <AppText variant="subtitle">Supplier</AppText>
            <AppTextField
              label="Find supplier"
              required
              value={values.supplierSearch}
              onChangeText={(value) => {
                updateField('supplierSearch', value);
                if (values.supplierId) {
                  updateField('supplierId', '');
                }
              }}
              error={errors.supplierId}
              placeholder="Search supplier name or contact"
              autoCapitalize="none"
              autoCorrect={false}
              helperText="Search by supplier name, phone, or procurement contact."
            />

            {selectedSupplier ? (
              <View
                style={[
                  styles.selectedPanel,
                  {
                    backgroundColor: `${theme.colors.primary}10`,
                    borderColor: `${theme.colors.primary}35`,
                  },
                ]}
              >
                <AppText variant="subtitle">{selectedSupplier.name}</AppText>
                <AppText variant="caption">
                  {selectedSupplier.contactNumber || 'Contact not set'}
                  {selectedSupplier.email ? ` | ${selectedSupplier.email}` : ''}
                </AppText>
                <AppText variant="caption">{selectedSupplier.status || 'Active'}</AppText>
              </View>
            ) : debouncedSupplierSearch.length >= 2 ? (
              <View
                style={[
                  styles.suggestionsPanel,
                  {
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {supplierSearchQuery.isLoading ? (
                  <AppText variant="caption">Searching suppliers...</AppText>
                ) : supplierSuggestions.length ? (
                  supplierSuggestions.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => selectSupplier(item.id, item.name)}
                      style={styles.suggestionRow}
                    >
                      <View style={styles.suggestionCopy}>
                        <AppText>{item.name}</AppText>
                        <AppText variant="caption">
                          {item.contactNumber || 'Contact not set'}
                          {item.email ? ` | ${item.email}` : ''}
                        </AppText>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <AppText variant="caption">No supplier matches found.</AppText>
                )}
              </View>
            ) : null}
          </AppCard>

          <AppCard variant="subtle">
            <AppText variant="subtitle">Order settings</AppText>
            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppDateField
                label="Purchase date"
                required
                value={values.purchaseDate}
                onChangeText={(value) => updateField('purchaseDate', value)}
                placeholder="YYYY-MM-DD"
                error={errors.purchaseDate}
                containerStyle={styles.field}
                helperText="Order creation date"
              />
              <AppDateField
                label="Expected delivery"
                value={values.expectedDeliveryDate}
                onChangeText={(value) => updateField('expectedDeliveryDate', value)}
                placeholder="YYYY-MM-DD"
                error={errors.expectedDeliveryDate}
                containerStyle={styles.field}
                helperText="Optional delivery target"
              />
            </View>

            <View style={styles.chipRow}>
              {ORDER_STATUS_OPTIONS.map((status) => (
                <InventoryFilterChip
                  key={status}
                  label={status.replace(/\b\w/g, (character) => character.toUpperCase())}
                  active={values.orderStatus === status}
                  onPress={() => updateField('orderStatus', status)}
                />
              ))}
            </View>

            <AppTextField
              label="Notes"
              value={values.notes}
              onChangeText={(value) => updateField('notes', value)}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
              helperText="Optional delivery notes, payment terms, or procurement instructions."
            />
          </AppCard>

          <AppCard variant="subtle">
            <AppText variant="subtitle">Add medicines</AppText>
            <AppTextField
              label="Find medicine"
              value={medicineSearch}
              onChangeText={setMedicineSearch}
              placeholder="Search medicine name or generic name"
              autoCapitalize="none"
              autoCorrect={false}
              helperText="Autocomplete uses the medicines module so order lines stay linked correctly."
            />

            {debouncedMedicineSearch.length >= 2 ? (
              <View
                style={[
                  styles.suggestionsPanel,
                  {
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {medicineSearchQuery.isLoading ? (
                  <AppText variant="caption">Searching medicines...</AppText>
                ) : medicineSuggestions.length ? (
                  medicineSuggestions.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => addMedicineLine(item.id, item.displayName || item.name)}
                      style={styles.suggestionRow}
                    >
                      <View style={styles.suggestionCopy}>
                        <AppText>{item.displayName || item.name}</AppText>
                        <AppText variant="caption">
                          {item.medicineId}
                          {item.genericName ? ` | ${item.genericName}` : ''}
                        </AppText>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <AppText variant="caption">No medicine matches found.</AppText>
                )}
              </View>
            ) : null}

            {bannerMessage ? (
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor: `${theme.colors.warning}12`,
                    borderColor: `${theme.colors.warning}45`,
                  },
                ]}
              >
                <AppText style={{ color: theme.colors.warning }}>{bannerMessage}</AppText>
              </View>
            ) : null}

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
                <View
                  key={item.key}
                  style={[
                    styles.lineCard,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <View style={[styles.lineHeader, !responsive.isMdUp && styles.stackColumn]}>
                    <View style={styles.lineTitleBlock}>
                      <AppText variant="subtitle">{item.medicineName || 'Medicine item'}</AppText>
                      <AppText variant="caption">{item.medicineId || 'Select medicine'}</AppText>
                    </View>
                    <AppButton
                      label="Remove"
                      variant="secondary"
                      onPress={() => removeLine(item.key)}
                    />
                  </View>

                  <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
                    <AppTextField
                      label="Ordered quantity"
                      required
                      value={item.orderedQuantity}
                      onChangeText={(value) => updateLine(item.key, 'orderedQuantity', value)}
                      keyboardType="decimal-pad"
                      inputMode="decimal"
                      error={errors[`items.${index}.orderedQuantity`]}
                      containerStyle={styles.field}
                      helperText="Required"
                    />
                    <AppTextField
                      label="Unit cost"
                      required
                      value={item.unitCost}
                      onChangeText={(value) => updateLine(item.key, 'unitCost', value)}
                      keyboardType="decimal-pad"
                      inputMode="decimal"
                      error={errors[`items.${index}.unitCost`]}
                      containerStyle={styles.field}
                      helperText="Required"
                    />
                  </View>

                  <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
                    <AppTextField
                      label="Selling price"
                      value={item.sellingPrice}
                      onChangeText={(value) => updateLine(item.key, 'sellingPrice', value)}
                      keyboardType="decimal-pad"
                      inputMode="decimal"
                      error={errors[`items.${index}.sellingPrice`]}
                      containerStyle={styles.field}
                      helperText="Optional"
                    />
                    <AppTextField
                      label="Line notes"
                      value={item.notes}
                      onChangeText={(value) => updateLine(item.key, 'notes', value)}
                      containerStyle={styles.field}
                      helperText="Optional"
                    />
                  </View>

                  <View style={styles.lineFooter}>
                    <AppText variant="caption">Estimated line total</AppText>
                    <AppText variant="label">
                      {formatPurchaseCurrency(
                        Number(item.orderedQuantity || 0) * Number(item.unitCost || 0)
                      )}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          </AppCard>

          {createMutation.error ? (
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
                {getErrorMessage(createMutation.error, 'Unable to create purchase order.')}
              </AppText>
            </View>
          ) : null}

          <AppCard variant="subtle">
            <View style={styles.footerActions}>
              <View style={styles.footerCopy}>
                <AppText variant="subtitle">Ready to create this purchase order?</AppText>
                <AppText variant="caption">
                  Review the supplier, dates, and medicine lines before saving the order.
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
                  label="Create purchase"
                  loading={createMutation.isPending}
                  onPress={() => {
                    void handleSubmit();
                  }}
                  style={styles.footerButton}
                  disabled={createMutation.isPending}
                />
              </View>
            </View>
          </AppCard>
    </KeyboardAwareScreen>
  );
}

function getPurchaseErrorSummary(errors: Record<string, string>) {
  const labels = Object.keys(errors).map((key) => {
    if (purchaseErrorLabels[key]) {
      return purchaseErrorLabels[key];
    }

    const lineMatch = key.match(/^items\.(\d+)\.(.+)$/);

    if (!lineMatch) {
      return key;
    }

    const [, rawIndex, field] = lineMatch;
    const index = Number(rawIndex) + 1;

    if (field === 'medicineId') {
      return `Medicine line ${index}`;
    }

    if (field === 'orderedQuantity') {
      return `Line ${index} quantity`;
    }

    if (field === 'unitCost') {
      return `Line ${index} unit cost`;
    }

    if (field === 'sellingPrice') {
      return `Line ${index} selling price`;
    }

    return `Line ${index} ${field}`;
  });

  const uniqueLabels = labels.filter((label, index) => labels.indexOf(label) === index);

  if (!uniqueLabels.length) {
    return '';
  }

  return `Needs attention: ${uniqueLabels.join(', ')}.`;
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
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  selectedPanel: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  suggestionsPanel: {
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12,
  },
  suggestionRow: {
    paddingVertical: 6,
  },
  suggestionCopy: {
    gap: 2,
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
  lineCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
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
  lineFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
