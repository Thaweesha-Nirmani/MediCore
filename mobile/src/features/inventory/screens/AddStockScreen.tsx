import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppDateField } from '@/components/ui/AppDateField';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { appRoutes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { useCreateInventory, useMedicineSearchForStock } from '@/features/inventory/hooks/useInventory';
import { getInventoryPermissions } from '@/features/inventory/utils/inventory-access';
import { createEmptyAddStockValues } from '@/features/inventory/utils/inventory-display';
import { toAddStockPayload, validateAddStockForm } from '@/features/inventory/utils/inventory-form';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';

import type { AddStockFormValues } from '@/features/inventory/types';

export function AddStockScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const permissions = getInventoryPermissions(user?.role);
  const [values, setValues] = useState<AddStockFormValues>(createEmptyAddStockValues());
  const [errors, setErrors] = useState<Partial<Record<keyof AddStockFormValues, string>>>({});
  const debouncedMedicineSearch = useDebouncedValue(values.medicineSearch.trim(), 300);
  const medicineSearchQuery = useMedicineSearchForStock(debouncedMedicineSearch);
  const createMutation = useCreateInventory();

  const suggestions = medicineSearchQuery.data || [];
  const selectedMedicine = useMemo(
    () => suggestions.find((item) => item.id === values.medicineId) || null,
    [suggestions, values.medicineId]
  );
  const submitError = createMutation.error
    ? getErrorMessage(createMutation.error, 'Unable to add stock.')
    : '';
  const errorCount = Object.keys(errors).length;
  const errorFieldSummary = getAddStockErrorSummary(errors);

  if (!permissions.canManage) {
    return (
      <ErrorState
        title="Stock operations restricted"
        message="Only administrators, pharmacists, and inventory managers can add stock."
        actionLabel="Back to inventory"
        onAction={() => router.replace(appRoutes.inventory as Href)}
      />
    );
  }

  function updateField(field: keyof AddStockFormValues, value: string | boolean) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    createMutation.reset();
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectMedicine(id: string, label: string) {
    setValues((current) => ({
      ...current,
      medicineId: id,
      medicineSearch: label,
    }));
    setErrors((current) => ({ ...current, medicineId: undefined }));
  }

  async function handleSubmit() {
    const nextErrors = validateAddStockForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const created = await createMutation.mutateAsync(toAddStockPayload(values));
    router.replace(`/(tabs)/inventory/${created.id}` as Href);
  }

  return (
    <KeyboardAwareScreen contentWidth="form" contentContainerStyle={styles.container}>
          <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
            <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
            <AppButton
              label={createMutation.isPending ? 'Adding stock' : 'Add stock'}
              loading={createMutation.isPending}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={createMutation.isPending}
            />
          </View>

          <AppCard variant="hero">
            <View style={styles.copyBlock}>
              <AppText variant="caption">Add stock</AppText>
              <AppText variant="title">Create a new stock batch</AppText>
              <AppText>
                Add inventory with explicit medicine, batch, quantity, expiry, and pricing details
                so the stock trail stays safe and operational.
              </AppText>
              <View style={styles.heroHints}>
                <HintPill icon="cube-outline" text="Batch-first stock" />
                <HintPill icon="calendar-outline" text="Expiry required" />
                <HintPill icon="cash-outline" text="Batch pricing" />
              </View>
            </View>
          </AppCard>

          {errorCount ? (
            <AppCard variant="subtle">
              <InlineFeedback
                tone="warning"
                title="Review the highlighted fields"
                message={`${errorCount} field${errorCount === 1 ? '' : 's'} still need attention before adding stock.`}
                detail={errorFieldSummary}
              />
            </AppCard>
          ) : null}

          {submitError ? (
            <AppCard variant="subtle">
              <InlineFeedback
                tone="danger"
                title="Stock creation failed"
                message={submitError}
                detail={getConflictGuidance(submitError)}
              />
            </AppCard>
          ) : null}

          <FormSection
            title="Select medicine"
            subtitle="Start with the exact medicine so the batch links to the correct catalog record."
          >
            <AppTextField
              label="Find medicine"
              required
              value={values.medicineSearch}
              onChangeText={(value) => {
                updateField('medicineSearch', value);
                if (values.medicineId) {
                  updateField('medicineId', '');
                }
              }}
              error={errors.medicineId}
              placeholder="Search medicine name or generic name"
              autoCapitalize="none"
              autoCorrect={false}
              helperText="Search starts after 2 characters."
            />

            {selectedMedicine ? (
              <View
                style={[
                  styles.selectedMedicine,
                  {
                    backgroundColor: `${theme.colors.primary}10`,
                    borderColor: `${theme.colors.primary}35`,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <AppText variant="subtitle">
                  {selectedMedicine.displayName || selectedMedicine.name}
                </AppText>
                <AppText>{selectedMedicine.genericName || 'Generic name not set'}</AppText>
                <AppText variant="caption">
                  {selectedMedicine.medicineId}
                  {selectedMedicine.barcode ? ` | ${selectedMedicine.barcode}` : ' | No barcode'}
                </AppText>
              </View>
            ) : debouncedMedicineSearch.length >= 2 ? (
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
                ) : suggestions.length ? (
                  suggestions.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => selectMedicine(item.id, item.displayName || item.name)}
                      style={[
                        styles.suggestionRow,
                        {
                          backgroundColor: theme.colors.surfaceMuted,
                          borderColor: theme.colors.borderSoft,
                          borderRadius: theme.radius.md,
                        },
                      ]}
                    >
                      <View style={styles.suggestionCopy}>
                        <AppText>{item.displayName || item.name}</AppText>
                        <AppText variant="caption">
                          {item.medicineId}
                          {item.genericName ? ` | ${item.genericName}` : ''}
                        </AppText>
                      </View>
                      <Ionicons color={theme.colors.mutedText} name="chevron-forward" size={18} />
                    </Pressable>
                  ))
                ) : (
                  <AppText variant="caption">No medicine matches found.</AppText>
                )}
              </View>
            ) : null}
          </FormSection>

          <FormSection
            title="Batch and quantity"
            subtitle="These values define the physical stock record and must stay precise."
          >
            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppTextField
                label="Batch number"
                required
                value={values.batchNumber}
                onChangeText={(value) => updateField('batchNumber', value)}
                error={errors.batchNumber}
                helperText="Use the supplier or package batch reference."
                containerStyle={styles.field}
              />
              <AppTextField
                label="Quantity"
                required
                value={values.quantity}
                onChangeText={(value) => updateField('quantity', value)}
                keyboardType="decimal-pad"
                inputMode="decimal"
                error={errors.quantity}
                helperText="Must be greater than 0."
                containerStyle={styles.field}
              />
            </View>

            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppTextField
                label="Location"
                required
                value={values.location}
                onChangeText={(value) => updateField('location', value)}
                error={errors.location}
                helperText="Examples: MAIN_STORE, FRONT_SHELF."
                containerStyle={styles.field}
              />
              <AppTextField
                label="Reorder level"
                value={values.reorderLevel}
                onChangeText={(value) => updateField('reorderLevel', value)}
                keyboardType="decimal-pad"
                inputMode="decimal"
                error={errors.reorderLevel}
                helperText="Optional low-stock threshold for this batch."
                containerStyle={styles.field}
              />
            </View>
          </FormSection>

          <FormSection
            title="Dates"
            subtitle="Expiry and manufacture dates are checked together for safer stock intake."
          >
            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppDateField
                label="Expiry date"
                required
                value={values.expiryDate}
                onChangeText={(value) => updateField('expiryDate', value)}
                placeholder="YYYY-MM-DD"
                error={errors.expiryDate}
                helperText="Required."
                containerStyle={styles.field}
              />
              <AppDateField
                label="Manufacture date"
                value={values.manufactureDate}
                onChangeText={(value) => updateField('manufactureDate', value)}
                placeholder="YYYY-MM-DD"
                error={errors.manufactureDate}
                helperText="Optional, but must be before expiry."
                containerStyle={styles.field}
              />
            </View>
          </FormSection>

          <FormSection
            title="Pricing and supplier"
            subtitle="Batch purchase pricing belongs here. Catalog price stays in medicines."
          >
            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppTextField
                label="Purchase price"
                required
                value={values.purchasePrice}
                onChangeText={(value) => updateField('purchasePrice', value)}
                keyboardType="decimal-pad"
                inputMode="decimal"
                error={errors.purchasePrice}
                helperText="Required."
                containerStyle={styles.field}
              />
              <AppTextField
                label="Selling price"
                value={values.sellingPrice}
                onChangeText={(value) => updateField('sellingPrice', value)}
                keyboardType="decimal-pad"
                inputMode="decimal"
                error={errors.sellingPrice}
                helperText="Optional."
                containerStyle={styles.field}
              />
            </View>

            <AppTextField
              label="Supplier ID"
              value={values.supplierId}
              onChangeText={(value) => updateField('supplierId', value)}
              error={errors.supplierId}
              helperText="Optional MongoDB supplier record ID."
            />
          </FormSection>

          <FormSection
            title="Notes and duplicate handling"
            subtitle="Use notes sparingly and decide whether duplicate batches should merge or conflict."
          >
            <AppTextField
              label="Notes"
              value={values.notes}
              onChangeText={(value) => updateField('notes', value)}
              error={errors.notes}
              multiline
              numberOfLines={4}
              helperText="Optional operational note for this batch."
              style={styles.notesInput}
            />

            <View style={styles.toggleBlock}>
              <AppText variant="caption">Duplicate batch handling</AppText>
              <View style={styles.toggleRow}>
                <InventoryFilterChip
                  label="Create conflict"
                  active={!values.mergeIfExists}
                  onPress={() => updateField('mergeIfExists', false)}
                />
                <InventoryFilterChip
                  label="Merge if exists"
                  active={values.mergeIfExists}
                  onPress={() => updateField('mergeIfExists', true)}
                />
              </View>
            </View>
          </FormSection>

          <AppCard variant="subtle">
            <View style={styles.footerActions}>
              <View style={styles.footerCopy}>
                <AppText variant="subtitle">Ready to add this stock batch?</AppText>
                <AppText variant="caption">
                  Batch creation affects stock visibility, expiry tracking, and future movement history.
                </AppText>
              </View>
              <View style={[styles.footerButtons, !responsive.isMdUp && styles.stackColumn]}>
                <AppButton label="Cancel" variant="secondary" onPress={() => router.back()} style={styles.footerButton} />
                <AppButton
                  label="Add stock"
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

function FormSection({
  title,
  subtitle,
  children,
}: React.PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <AppCard variant="subtle">
      <View style={styles.sectionHeader}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText variant="caption">{subtitle}</AppText>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </AppCard>
  );
}

function HintPill({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.hintPill,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.borderStrong,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <Ionicons color={theme.colors.primary} name={icon} size={14} />
      <AppText variant="caption">{text}</AppText>
    </View>
  );
}

function InlineFeedback({
  tone,
  title,
  message,
  detail,
}: {
  tone: 'warning' | 'danger';
  title: string;
  message: string;
  detail?: string;
}) {
  const theme = useAppTheme();
  const color = tone === 'danger' ? theme.colors.danger : theme.colors.warning;
  const icon = tone === 'danger' ? 'close-circle-outline' : 'alert-circle-outline';

  return (
    <View
      style={[
        styles.feedbackRow,
        {
          backgroundColor: `${color}12`,
          borderColor: `${color}35`,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <Ionicons color={color} name={icon} size={18} />
      <View style={styles.feedbackCopy}>
        <AppText variant="label" style={{ color }}>
          {title}
        </AppText>
        <AppText variant="caption">{message}</AppText>
        {detail ? <AppText variant="caption">{detail}</AppText> : null}
      </View>
    </View>
  );
}

function getConflictGuidance(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('batch') || normalized.includes('duplicate') || normalized.includes('exists')) {
    return 'Check the batch number, location, and merge choice before trying again.';
  }

  if (normalized.includes('supplier')) {
    return 'Verify the supplier ID format or leave it blank if this batch has no linked supplier record.';
  }

  return 'Review the batch values and try again.';
}

const addStockFieldLabels: Record<keyof AddStockFormValues, string> = {
  medicineId: 'Medicine',
  medicineSearch: 'Medicine search',
  batchNumber: 'Batch number',
  quantity: 'Quantity',
  expiryDate: 'Expiry date',
  manufactureDate: 'Manufacture date',
  purchasePrice: 'Purchase price',
  sellingPrice: 'Selling price',
  location: 'Location',
  supplierId: 'Supplier ID',
  reorderLevel: 'Reorder level',
  notes: 'Notes',
  mergeIfExists: 'Duplicate batch handling',
};

function getAddStockErrorSummary(errors: Partial<Record<keyof AddStockFormValues, string>>) {
  const labels = (Object.keys(addStockFieldLabels) as Array<keyof AddStockFormValues>).filter(
    (field) => Boolean(errors[field])
  );

  if (!labels.length) {
    return undefined;
  }

  return `Needs attention: ${labels.map((field) => addStockFieldLabels[field]).join(', ')}.`;
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
  heroHints: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hintPill: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  feedbackRow: {
    alignItems: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  feedbackCopy: {
    flex: 1,
    gap: 4,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionBody: {
    gap: 14,
  },
  selectedMedicine: {
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  suggestionsPanel: {
    gap: 8,
  },
  suggestionRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 12,
  },
  suggestionCopy: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  notesInput: {
    minHeight: 108,
    textAlignVertical: 'top',
  },
  toggleBlock: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
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
