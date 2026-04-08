import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import {
  useCreateSupplier,
  useSupplierDetail,
  useUpdateSupplier,
} from '@/features/suppliers/hooks/useSuppliers';
import { getSupplierPermissions } from '@/features/suppliers/utils/supplier-access';
import {
  createEmptySupplierFormValues,
  mapSupplierToFormValues,
  toSupplierPayload,
  validateSupplierForm,
} from '@/features/suppliers/utils/supplier-form';

import type { SupplierFormValues } from '@/features/suppliers/types';

type SupplierFormScreenProps = {
  mode: 'create' | 'edit';
};

const STATUS_OPTIONS: SupplierFormValues['status'][] = ['Active', 'Inactive', 'Archived'];
const supplierFieldLabels: Record<keyof SupplierFormValues, string> = {
  name: 'Supplier name',
  contactNumber: 'Contact number',
  contactPerson: 'Contact person',
  alternateContact: 'Alternate contact',
  email: 'Email',
  street: 'Street',
  city: 'City',
  state: 'State',
  postalCode: 'Postal code',
  country: 'Country',
  status: 'Status',
  notes: 'Notes',
};

export function SupplierFormScreen({ mode }: SupplierFormScreenProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthSession();
  const permissions = getSupplierPermissions(user?.role);
  const isEdit = mode === 'edit';
  const detailQuery = useSupplierDetail(isEdit ? params.id : undefined);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier(String(params.id || ''));
  const activeMutation = isEdit ? updateMutation : createMutation;
  const [values, setValues] = useState<SupplierFormValues>(createEmptySupplierFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof SupplierFormValues, string>>>({});
  const errorCount = Object.keys(errors).length;
  const errorFieldSummary = getSupplierErrorSummary(errors);

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      setValues(mapSupplierToFormValues(detailQuery.data));
    }
  }, [detailQuery.data, isEdit]);

  if (!permissions.canManage) {
    return (
      <ErrorState
        title="Editing restricted"
        message="Your role does not have permission to create or update supplier records."
        actionLabel="Back to suppliers"
        onAction={() => router.replace(appRoutes.suppliers as Href)}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) {
    return (
      <LoadingState
        title="Loading supplier"
        message="Preparing the supplier form with the latest contact details."
      />
    );
  }

  if (isEdit && (detailQuery.isError || !detailQuery.data)) {
    return (
      <ErrorState
        title="Supplier unavailable"
        message="We couldn't load this supplier for editing."
        actionLabel="Back to suppliers"
        onAction={() => router.replace(appRoutes.suppliers as Href)}
      />
    );
  }

  function updateField(field: keyof SupplierFormValues, value: string) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    activeMutation.reset();
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit() {
    const nextErrors = validateSupplierForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const payload = toSupplierPayload(values);
    const response = isEdit
      ? await updateMutation.mutateAsync(payload)
      : await createMutation.mutateAsync(payload);

    Alert.alert(
      isEdit ? 'Supplier updated' : 'Supplier created',
      isEdit
        ? 'The supplier details have been updated for future purchasing and receiving.'
        : 'The supplier is ready to use in purchase orders and receiving flows.',
      [
        {
          text: 'Open supplier',
          onPress: () => {
            router.replace(`/(tabs)/more/suppliers/${response.id}` as Href);
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
              label={activeMutation.isPending ? 'Saving' : isEdit ? 'Save supplier' : 'Create supplier'}
              loading={activeMutation.isPending}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={activeMutation.isPending}
            />
          </View>

          <AppCard variant="hero">
            <View style={styles.copyBlock}>
              <AppText variant="caption">Supplier management</AppText>
              <AppText variant="title">{isEdit ? 'Edit supplier' : 'Add supplier'}</AppText>
              <AppText>
                Keep procurement contact details clean so purchase orders and receiving flows stay
                reliable.
              </AppText>
            </View>
          </AppCard>

          {errorCount ? (
            <AppCard variant="subtle">
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: `${theme.colors.warning}12`,
                    borderColor: `${theme.colors.warning}45`,
                  },
                ]}
              >
                <AppText style={{ color: theme.colors.warning }}>
                  {`${errorCount} field${errorCount === 1 ? '' : 's'} still need attention before you save this supplier.`}
                </AppText>
                {errorFieldSummary ? <AppText>{errorFieldSummary}</AppText> : null}
              </View>
            </AppCard>
          ) : null}

          <AppCard variant="subtle">
            <AppText variant="subtitle">Business identity</AppText>
            <AppTextField
              label="Supplier name"
              required
              value={values.name}
              onChangeText={(value) => updateField('name', value)}
              error={errors.name}
              helperText="Use the legal or operational supplier name used in purchasing."
            />
            <AppTextField
              label="Contact number"
              required
              value={values.contactNumber}
              onChangeText={(value) => updateField('contactNumber', value)}
              keyboardType="phone-pad"
              error={errors.contactNumber}
              helperText="Main phone number for order confirmations and receiving issues."
            />
            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppTextField
                label="Contact person"
                value={values.contactPerson}
                onChangeText={(value) => updateField('contactPerson', value)}
                containerStyle={styles.field}
                helperText="Primary business contact"
              />
              <AppTextField
                label="Alternate contact"
                value={values.alternateContact}
                onChangeText={(value) => updateField('alternateContact', value)}
                keyboardType="phone-pad"
                containerStyle={styles.field}
                helperText="Optional backup number"
              />
            </View>
            <AppTextField
              label="Email"
              value={values.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              helperText="Used for invoices, procurement communication, and documentation."
            />
          </AppCard>

          <AppCard variant="subtle">
            <AppText variant="subtitle">Address</AppText>
            <AppTextField
              label="Street"
              value={values.street}
              onChangeText={(value) => updateField('street', value)}
              helperText="Street, building, or warehouse location"
            />
            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppTextField
                label="City"
                value={values.city}
                onChangeText={(value) => updateField('city', value)}
                containerStyle={styles.field}
                helperText="City"
              />
              <AppTextField
                label="State"
                value={values.state}
                onChangeText={(value) => updateField('state', value)}
                containerStyle={styles.field}
                helperText="Province or state"
              />
            </View>
            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppTextField
                label="Postal code"
                value={values.postalCode}
                onChangeText={(value) => updateField('postalCode', value)}
                containerStyle={styles.field}
                helperText="ZIP or postal code"
              />
              <AppTextField
                label="Country"
                value={values.country}
                onChangeText={(value) => updateField('country', value)}
                containerStyle={styles.field}
                helperText="Country"
              />
            </View>
          </AppCard>

          <AppCard variant="subtle">
            <AppText variant="subtitle">Status and notes</AppText>
            <View style={styles.chipRow}>
              {STATUS_OPTIONS.map((status) => (
                <InventoryFilterChip
                  key={status}
                  label={status}
                  active={values.status === status}
                  onPress={() => updateField('status', status)}
                />
              ))}
            </View>

            <AppTextField
              label="Notes"
              value={values.notes}
              onChangeText={(value) => updateField('notes', value)}
              multiline
              numberOfLines={4}
              style={styles.notesInput}
              helperText="Optional procurement notes, payment terms, or delivery instructions."
            />

            {activeMutation.error ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: `${theme.colors.danger}10`,
                    borderColor: `${theme.colors.danger}45`,
                  },
                ]}
              >
                <AppText style={{ color: theme.colors.danger }}>
                  {getErrorMessage(activeMutation.error, 'Unable to save supplier.')}
                </AppText>
              </View>
            ) : null}
          </AppCard>

          <AppCard variant="subtle">
            <View style={styles.footerActions}>
              <View style={styles.footerCopy}>
                <AppText variant="subtitle">
                  {isEdit ? 'Ready to save these supplier changes?' : 'Ready to create this supplier?'}
                </AppText>
                <AppText variant="caption">
                  Supplier details are used by purchase orders, receiving, and procurement records.
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
                  label={isEdit ? 'Save supplier' : 'Create supplier'}
                  loading={activeMutation.isPending}
                  onPress={() => {
                    void handleSubmit();
                  }}
                  style={styles.footerButton}
                  disabled={activeMutation.isPending}
                />
              </View>
            </View>
          </AppCard>
    </KeyboardAwareScreen>
  );
}

function getSupplierErrorSummary(errors: Partial<Record<keyof SupplierFormValues, string>>) {
  const labels = (Object.keys(supplierFieldLabels) as Array<keyof SupplierFormValues>).filter(
    (field) => Boolean(errors[field])
  );

  if (!labels.length) {
    return '';
  }

  return `Needs attention: ${labels.map((field) => supplierFieldLabels[field]).join(', ')}.`;
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
    minHeight: 110,
    textAlignVertical: 'top',
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
