import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { MedicineFormFields } from '@/features/medicines/components/MedicineFormFields';
import {
  useCreateMedicine,
  useMedicineDetail,
  useMedicineDuplicateCheck,
  useUpdateMedicine,
} from '@/features/medicines/hooks/useMedicines';
import { getMedicinePermissions } from '@/features/medicines/utils/medicine-access';
import {
  createEmptyMedicineFormValues,
  mapMedicineToFormValues,
  toMedicinePayload,
  validateMedicineForm,
} from '@/features/medicines/utils/medicine-form';

import type { MedicineFormValues } from '@/features/medicines/types';

type MedicineFormScreenProps = {
  mode: 'create' | 'edit';
};

export function MedicineFormScreen({ mode }: MedicineFormScreenProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthSession();
  const permissions = getMedicinePermissions(user?.role);
  const isEdit = mode === 'edit';
  const detailQuery = useMedicineDetail(isEdit ? params.id : undefined);
  const createMutation = useCreateMedicine();
  const updateMutation = useUpdateMedicine(String(params.id || ''));
  const activeMutation = isEdit ? updateMutation : createMutation;
  const [values, setValues] = useState<MedicineFormValues>(createEmptyMedicineFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof MedicineFormValues, string>>>({});
  const debouncedGenericName = useDebouncedValue(values.genericName.trim(), 250);
  const debouncedBrandName = useDebouncedValue(values.brandName.trim(), 250);
  const duplicateQuery = useMedicineDuplicateCheck(
    {
      genericName: debouncedGenericName || undefined,
      brandName: debouncedBrandName || undefined,
      excludeId: isEdit ? String(params.id || '') : undefined,
    },
    !isEdit || Boolean(params.id)
  );

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      setValues(mapMedicineToFormValues(detailQuery.data));
    }
  }, [detailQuery.data, isEdit]);

  const pageTitle = isEdit ? 'Update medicine record' : 'Add a new medicine';
  const pageDescription = isEdit
    ? 'Adjust the medicine master safely, with stock, batch, supplier, and expiry details kept aligned.'
    : 'Create the medicine and its first inventory-ready batch in a single clean workflow.';

  const mutationError = activeMutation.error
    ? getErrorMessage(activeMutation.error, 'Unable to save medicine.')
    : '';
  const isBusy = activeMutation.isPending || (isEdit && detailQuery.isLoading);
  const errorCount = Object.keys(errors).length;
  const duplicateMatches = duplicateQuery.data?.matches || [];
  const hasBlockingDuplicate = Boolean(duplicateQuery.data?.blocking);
  const canSubmit = useMemo(() => {
    const validationErrors = validateMedicineForm(values, { isEdit });
    return (
      Object.keys(validationErrors).length === 0 &&
      !activeMutation.isPending &&
      !hasBlockingDuplicate
    );
  }, [activeMutation.isPending, hasBlockingDuplicate, isEdit, values]);

  const canAccessForm = isEdit ? permissions.canEdit : permissions.canCreate;

  if (!canAccessForm) {
    return (
      <ErrorState
        title={isEdit ? 'Editing restricted' : 'Creation restricted'}
        message={
          isEdit
            ? 'Only administrators can edit medicine records.'
            : 'Only administrators, pharmacists, and inventory managers can add medicines.'
        }
        actionLabel="Back to medicines"
        onAction={() => router.replace(appRoutes.medicines as Href)}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) {
    return (
      <LoadingState
        title="Loading medicine"
        message="Preparing the medicine form with the latest catalog and stock data."
      />
    );
  }

  if (isEdit && (detailQuery.isError || !detailQuery.data)) {
    return (
      <ErrorState
        title="Unable to edit medicine"
        message="We couldn't load this medicine for editing."
        actionLabel="Back to medicines"
        onAction={() => router.replace(appRoutes.medicines as Href)}
      />
    );
  }

  function updateField(field: keyof MedicineFormValues, value: string) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    activeMutation.reset();
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit() {
    const nextErrors = validateMedicineForm(values, { isEdit });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length || hasBlockingDuplicate) {
      return;
    }

    const payload = toMedicinePayload(values);
    const response = isEdit
      ? await updateMutation.mutateAsync(payload)
      : await createMutation.mutateAsync(payload);

    router.replace(`/(tabs)/medicines/${response.id}` as Href);
  }

  return (
    <KeyboardAwareScreen contentWidth="form" contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={[styles.headerRow, !responsive.isMdUp && styles.actionsStack]}>
          <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
          <AppButton
            label={isBusy ? 'Saving' : isEdit ? 'Save medicine' : 'Create medicine'}
            loading={activeMutation.isPending}
            onPress={() => {
              void handleSubmit();
            }}
            disabled={!canSubmit}
            variant="success"
          />
        </View>

        <AppCard
          variant="hero"
          style={{ borderColor: `${theme.colors.success}35`, borderWidth: 1 }}
        >
          <View style={styles.copyBlock}>
            <AppText variant="caption" style={{ color: theme.colors.success }}>
              Medicine management
            </AppText>
            <AppText variant="title">{pageTitle}</AppText>
            <AppText>{pageDescription}</AppText>
            <View style={styles.heroHints}>
              <HintPill icon="shield-checkmark-outline" text="Validated stock seed" />
              <HintPill icon="sparkles-outline" text="Duplicate-safe entry" />
              <HintPill icon="leaf-outline" text="Green workflow" />
            </View>
          </View>
        </AppCard>

        {errorCount ? (
          <AppCard variant="subtle">
            <View
              style={[
                styles.feedbackRow,
                {
                  backgroundColor: `${theme.colors.warning}12`,
                  borderColor: `${theme.colors.warning}35`,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Ionicons color={theme.colors.warning} name="alert-circle-outline" size={18} />
              <View style={styles.feedbackCopy}>
                <AppText variant="label" style={{ color: theme.colors.warning }}>
                  Review the highlighted fields
                </AppText>
                <AppText variant="caption">
                  {errorCount} field{errorCount === 1 ? '' : 's'} still need attention before
                  saving.
                </AppText>
              </View>
            </View>
          </AppCard>
        ) : null}

        {duplicateMatches.length ? (
          <AppCard
            variant="subtle"
            style={{
              borderColor: hasBlockingDuplicate
                ? `${theme.colors.warning}45`
                : `${theme.colors.success}32`,
              borderWidth: 1,
            }}
          >
            <View style={styles.feedbackCopy}>
              <View style={styles.duplicateHeader}>
                <Ionicons
                  color={hasBlockingDuplicate ? theme.colors.warning : theme.colors.success}
                  name={hasBlockingDuplicate ? 'warning-outline' : 'checkmark-circle-outline'}
                  size={18}
                />
                <AppText
                  variant="label"
                  style={{ color: hasBlockingDuplicate ? theme.colors.warning : theme.colors.success }}
                >
                  {hasBlockingDuplicate
                    ? 'Possible duplicate medicine detected'
                    : 'Similar medicines found'}
                </AppText>
              </View>
              <AppText variant="caption">
                {hasBlockingDuplicate
                  ? 'This save is blocked until you confirm the medicine is truly different.'
                  : 'Review these similar records before saving so the catalog stays clean.'}
              </AppText>
              <View style={styles.duplicateList}>
                {duplicateMatches.map((match) => (
                  <View
                    key={match.id}
                    style={[
                      styles.duplicateRow,
                      {
                        backgroundColor: theme.colors.surfaceMuted,
                        borderColor: theme.colors.borderSoft,
                        borderRadius: theme.radius.md,
                      },
                    ]}
                  >
                    <View style={styles.duplicateCopy}>
                      <AppText>{match.name}</AppText>
                      <AppText variant="caption">
                        {match.medicineId} | Score {(match.score * 100).toFixed(0)}%
                      </AppText>
                      <AppText variant="caption">{match.matchReason}</AppText>
                    </View>
                    <AppButton
                      label="Open"
                      variant="secondary"
                      onPress={() => router.push(`/(tabs)/medicines/${match.id}` as Href)}
                    />
                  </View>
                ))}
              </View>
            </View>
          </AppCard>
        ) : null}

        {mutationError ? (
          <AppCard variant="subtle">
            <View
              style={[
                styles.feedbackRow,
                {
                  backgroundColor: `${theme.colors.danger}10`,
                  borderColor: `${theme.colors.danger}35`,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Ionicons color={theme.colors.danger} name="close-circle-outline" size={18} />
              <View style={styles.feedbackCopy}>
                <AppText variant="label" style={{ color: theme.colors.danger }}>
                  Save failed
                </AppText>
                <AppText variant="caption">{mutationError}</AppText>
                <AppText variant="caption">{getConflictGuidance(mutationError)}</AppText>
              </View>
            </View>
          </AppCard>
        ) : null}

        <MedicineFormFields values={values} errors={errors} onChange={updateField} isEdit={isEdit} />

        <AppCard variant="subtle">
          <View style={styles.footerActions}>
            <View style={styles.footerCopy}>
              <AppText variant="subtitle">
                {isEdit ? 'Ready to update this medicine?' : 'Ready to create this medicine?'}
              </AppText>
              <AppText variant="caption">
                Medicines now create an initial inventory-ready batch, so price, stock, expiry, and
                supplier stay in one clear flow.
              </AppText>
            </View>
            <View style={[styles.footerButtons, !responsive.isMdUp && styles.actionsStack]}>
              <AppButton label="Cancel" variant="secondary" onPress={() => router.back()} style={styles.footerButton} />
              <AppButton
                label={isEdit ? 'Save medicine' : 'Create medicine'}
                loading={activeMutation.isPending}
                onPress={() => {
                  void handleSubmit();
                }}
                disabled={!canSubmit}
                style={styles.footerButton}
                variant="success"
              />
            </View>
          </View>
        </AppCard>
      </View>
    </KeyboardAwareScreen>
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
          borderColor: `${theme.colors.success}28`,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <Ionicons color={theme.colors.success} name={icon} size={14} />
      <AppText variant="caption">{text}</AppText>
    </View>
  );
}

function getConflictGuidance(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('barcode')) {
    return 'Check whether the barcode already belongs to another medicine.';
  }

  if (normalized.includes('duplicate') || normalized.includes('similar medicine')) {
    return 'Review the similar records above and change the generic or brand details if needed.';
  }

  if (normalized.includes('batch')) {
    return 'Batch numbers must stay unique, so verify the batch and try again.';
  }

  return 'If the problem continues, refresh and verify the form values again.';
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    gap: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  actionsStack: {
    flexDirection: 'column',
  },
  copyBlock: {
    gap: 10,
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
    gap: 8,
  },
  duplicateHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  duplicateList: {
    gap: 10,
  },
  duplicateRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 12,
  },
  duplicateCopy: {
    flex: 1,
    gap: 4,
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
