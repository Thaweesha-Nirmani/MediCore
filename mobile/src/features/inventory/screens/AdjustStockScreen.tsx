import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { InventoryStatusBadge } from '@/features/inventory/components/InventoryStatusBadge';
import { useAdjustInventory, useInventoryItem } from '@/features/inventory/hooks/useInventory';
import { getInventoryPermissions } from '@/features/inventory/utils/inventory-access';
import {
  createEmptyAdjustValues,
  formatInventoryDate,
  getInventoryDisplayName,
} from '@/features/inventory/utils/inventory-display';
import { toAdjustInventoryPayload, validateAdjustStockForm } from '@/features/inventory/utils/inventory-form';

import type { AdjustInventoryFormValues } from '@/features/inventory/types';

const ACTIONS: AdjustInventoryFormValues['action'][] = [
  'increase',
  'decrease',
  'correction',
  'damage',
  'dispose',
  'transfer',
];

export function AdjustStockScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthSession();
  const permissions = getInventoryPermissions(user?.role);
  const inventoryQuery = useInventoryItem(params.id);
  const adjustMutation = useAdjustInventory();
  const [values, setValues] = useState<AdjustInventoryFormValues>(createEmptyAdjustValues());
  const [errors, setErrors] = useState<Partial<Record<keyof AdjustInventoryFormValues, string>>>({});

  if (!permissions.canManage) {
    return (
      <ErrorState
        title="Adjustment restricted"
        message="Only administrators, pharmacists, and inventory managers can adjust stock."
        actionLabel="Back to inventory"
        onAction={() => router.replace(appRoutes.inventory as Href)}
      />
    );
  }

  if (inventoryQuery.isLoading) {
    return (
      <LoadingState
        title="Loading batch"
        message="Preparing a safe adjustment workflow for this stock batch."
      />
    );
  }

  if (inventoryQuery.isError || !inventoryQuery.data) {
    return (
      <ErrorState
        title="Batch unavailable"
        message="We couldn't load this stock batch for adjustment."
        actionLabel="Back to inventory"
        onAction={() => router.replace(appRoutes.inventory as Href)}
      />
    );
  }

  const batch = inventoryQuery.data;
  const submitError = adjustMutation.error
    ? getErrorMessage(adjustMutation.error, 'Unable to adjust stock.')
    : '';
  const errorCount = Object.keys(errors).length;
  const canSubmit =
    Object.keys(validateAdjustStockForm(values, batch)).length === 0 && !adjustMutation.isPending;

  function updateField(field: keyof AdjustInventoryFormValues, value: string) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    adjustMutation.reset();
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submitAdjustment() {
    if (!params.id) {
      return;
    }

    const result = await adjustMutation.mutateAsync(toAdjustInventoryPayload(params.id, values));

    if ('source' in result) {
      router.replace(`/(tabs)/inventory/${result.source.id}` as Href);
      return;
    }

    router.replace(`/(tabs)/inventory/${result.id}` as Href);
  }

  function handleSubmit() {
    const nextErrors = validateAdjustStockForm(values, batch);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length || !params.id) {
      return;
    }

    Alert.alert(
      'Apply stock adjustment?',
      'This will update the live batch quantity and movement history for this stock record.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Apply adjustment',
          onPress: () => {
            void submitAdjustment();
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
              label={adjustMutation.isPending ? 'Applying' : 'Apply adjustment'}
              loading={adjustMutation.isPending}
              onPress={() => {
                handleSubmit();
              }}
              disabled={!canSubmit}
            />
          </View>

          <AppCard variant="hero">
            <View style={styles.copyBlock}>
              <AppText variant="caption">Adjust stock</AppText>
              <AppText variant="title">{getInventoryDisplayName(batch)}</AppText>
              <AppText>
                Batch {batch.batchNumber} • {batch.location || 'MAIN_STORE'} • expires{' '}
                {formatInventoryDate(batch.expiryDate)}
              </AppText>
              <InventoryStatusBadge status={batch.stockStatus} />
            </View>
          </AppCard>

          {errorCount ? (
            <AppCard variant="subtle">
              <InlineFeedback
                tone="warning"
                title="Review the highlighted adjustment fields"
                message={`${errorCount} field${errorCount === 1 ? '' : 's'} need attention before the stock change can be applied.`}
              />
            </AppCard>
          ) : null}

          {submitError ? (
            <AppCard variant="subtle">
              <InlineFeedback
                tone="danger"
                title="Adjustment failed"
                message={submitError}
                detail="Check the quantity logic, destination location, and reason before trying again."
              />
            </AppCard>
          ) : null}

          <AppCard variant="subtle">
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle">Current snapshot</AppText>
              <AppText variant="caption">Verify the live stock position before applying a change.</AppText>
            </View>
            <View style={[styles.snapshotPanel, !responsive.isMdUp && styles.stackColumn]}>
              <SnapshotBlock label="Quantity" value={String(batch.quantity)} emphasize />
              <SnapshotBlock label="Available" value={String(batch.availableQuantity)} />
              <SnapshotBlock label="Location" value={batch.location || 'MAIN_STORE'} />
            </View>
          </AppCard>

          <AppCard variant="subtle">
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle">Adjustment action</AppText>
              <AppText variant="caption">Choose the stock action first so quantity guidance stays accurate.</AppText>
            </View>

            <View style={styles.chipWrap}>
              {ACTIONS.map((action) => (
                <InventoryFilterChip
                  key={action}
                  label={action.replace('_', ' ')}
                  active={values.action === action}
                  onPress={() => updateField('action', action)}
                />
              ))}
            </View>

            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppTextField
                label="Quantity change"
                value={values.quantityChange}
                onChangeText={(value) => updateField('quantityChange', value)}
                keyboardType="decimal-pad"
                inputMode="decimal"
                error={errors.quantityChange}
                helperText="Use for increase, decrease, damage, dispose, or transfer."
                containerStyle={styles.field}
              />
              <AppTextField
                label="New quantity"
                value={values.newQuantity}
                onChangeText={(value) => updateField('newQuantity', value)}
                keyboardType="decimal-pad"
                inputMode="decimal"
                error={errors.newQuantity}
                helperText="Best for correction when the physical count is known."
                containerStyle={styles.field}
              />
            </View>

            {values.action === 'transfer' ? (
              <AppTextField
                label="Transfer to location"
                required
                value={values.toLocation}
                onChangeText={(value) => updateField('toLocation', value)}
                error={errors.toLocation}
                helperText="Destination must be different from the current location."
              />
            ) : null}

            <AppTextField
              label="Reason"
              required
              value={values.reason}
              onChangeText={(value) => updateField('reason', value)}
              error={errors.reason}
              helperText="Explain why this stock change is happening."
              multiline
              numberOfLines={4}
              style={styles.reasonInput}
            />
          </AppCard>

          <AppCard variant="subtle">
            <View style={styles.footerActions}>
              <View style={styles.footerCopy}>
                <AppText variant="subtitle">Ready to apply this stock change?</AppText>
                <AppText variant="caption">
                  Adjustments affect live quantity and movement history, so apply them only after
                  verifying the batch.
                </AppText>
              </View>
              <View style={[styles.footerButtons, !responsive.isMdUp && styles.stackColumn]}>
                <AppButton label="Cancel" variant="secondary" onPress={() => router.back()} style={styles.footerButton} />
                <AppButton
                  label="Apply adjustment"
                  loading={adjustMutation.isPending}
                  onPress={() => {
                    handleSubmit();
                  }}
                  style={styles.footerButton}
                  disabled={!canSubmit}
                />
              </View>
            </View>
          </AppCard>
    </KeyboardAwareScreen>
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

function SnapshotBlock({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.snapshotBlock}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant={emphasize ? 'title' : 'subtitle'}>{value}</AppText>
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
  stackColumn: {
    flexDirection: 'column',
  },
  copyBlock: {
    gap: 8,
  },
  sectionHeader: {
    gap: 4,
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
  snapshotPanel: {
    flexDirection: 'row',
    gap: 12,
  },
  snapshotBlock: {
    flex: 1,
    gap: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  reasonInput: {
    minHeight: 108,
    textAlignVertical: 'top',
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
