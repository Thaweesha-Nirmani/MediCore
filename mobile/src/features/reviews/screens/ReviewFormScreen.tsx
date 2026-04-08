import { type Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

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

import { useCreateReview, useReviewDetail, useUpdateReview } from '@/features/reviews/hooks/useReviews';
import { getReviewPermissions } from '@/features/reviews/utils/review-access';
import { REVIEW_MODULE_OPTIONS, formatReviewModule } from '@/features/reviews/utils/review-display';
import {
  createEmptyReviewFormValues,
  createReviewFormValues,
  toReviewPayload,
  validateReviewForm,
} from '@/features/reviews/utils/review-form';

import type { ReviewFormValues } from '@/features/reviews/types';

type ReviewFormScreenProps = {
  reviewId?: string;
};

const RATING_OPTIONS = ['1', '2', '3', '4', '5'] as const;

export function ReviewFormScreen({ reviewId }: ReviewFormScreenProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const isEdit = Boolean(reviewId);
  const reviewQuery = useReviewDetail(reviewId);
  const permissions = getReviewPermissions(user?.role, reviewQuery.data || null);
  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview(reviewId || '');
  const [values, setValues] = useState<ReviewFormValues>(createEmptyReviewFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof ReviewFormValues, string>>>({});

  useEffect(() => {
    if (reviewQuery.data && isEdit) {
      setValues(createReviewFormValues(reviewQuery.data));
    }
  }, [isEdit, reviewQuery.data]);

  const submitError = createMutation.error || updateMutation.error;
  const canSubmit = useMemo(() => {
    const validation = validateReviewForm(values);
    return (
      Object.keys(validation).length === 0 &&
      !createMutation.isPending &&
      !updateMutation.isPending
    );
  }, [createMutation.isPending, updateMutation.isPending, values]);

  if ((!isEdit && !permissions.canCreate) || (isEdit && reviewQuery.data && !permissions.canEdit)) {
    return (
      <ErrorState
        title="Access restricted"
        message="You do not have permission to edit this review."
        actionLabel="Back to reviews"
        onAction={() => router.replace(appRoutes.reviews as Href)}
      />
    );
  }

  if (isEdit && reviewQuery.isLoading) {
    return (
      <LoadingState
        title="Loading review"
        message="Preparing the latest feedback record for editing."
      />
    );
  }

  if (isEdit && (reviewQuery.isError || !reviewQuery.data)) {
    return (
      <ErrorState
        title="Review unavailable"
        message={getErrorMessage(reviewQuery.error, "We couldn't load this review for editing.")}
        actionLabel="Back to reviews"
        onAction={() => router.replace(appRoutes.reviews as Href)}
      />
    );
  }

  function updateField(field: keyof ReviewFormValues, value: string) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    createMutation.reset();
    updateMutation.reset();
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit() {
    const nextErrors = validateReviewForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    if (isEdit && reviewId) {
      const updated = await updateMutation.mutateAsync(toReviewPayload(values));
      router.replace(`/(tabs)/more/reviews/${updated.id}` as Href);
      return;
    }

    const created = await createMutation.mutateAsync(toReviewPayload(values));
    router.replace(`/(tabs)/more/reviews/${created.id}` as Href);
  }

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <KeyboardAwareScreen contentWidth="form" contentContainerStyle={styles.container}>
          <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
            <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
            <AppButton
              label={
                pending
                  ? isEdit
                    ? 'Saving review'
                    : 'Submitting review'
                  : isEdit
                    ? 'Save changes'
                    : 'Submit review'
              }
              loading={pending}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={!canSubmit}
            />
          </View>

          <AppCard variant="hero">
            <View style={styles.copyBlock}>
              <AppText variant="caption">{isEdit ? 'Edit review' : 'Submit review'}</AppText>
              <AppText variant="title">
                {isEdit ? 'Update operational feedback' : 'Capture operational feedback'}
              </AppText>
              <AppText>
                Use reviews for real workflow feedback, issues, and operational suggestions without
                changing the underlying business flow.
              </AppText>
            </View>
          </AppCard>

          {submitError ? (
            <AppCard variant="subtle">
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
                  {getErrorMessage(submitError, 'Unable to save this review.')}
                </AppText>
              </View>
            </AppCard>
          ) : null}

          <AppCard variant="subtle">
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle">Feedback</AppText>
              <AppText variant="caption">Describe the issue, suggestion, or workflow note clearly.</AppText>
            </View>

            <AppTextField
              label="Title"
              required
              value={values.title}
              onChangeText={(value) => updateField('title', value)}
              error={errors.title}
              placeholder="Summarize the issue or suggestion"
            />

            <AppTextField
              label="Details"
              required
              value={values.content}
              onChangeText={(value) => updateField('content', value)}
              error={errors.content}
              multiline
              numberOfLines={5}
              style={styles.notesInput}
              placeholder="Describe what happened and what should improve"
            />
          </AppCard>

          <AppCard variant="subtle">
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle">Context</AppText>
              <AppText variant="caption">Link the feedback to the module where it happened.</AppText>
            </View>

            <View style={styles.optionGroup}>
              <AppText variant="caption">Rating</AppText>
              <View style={styles.chipRow}>
                {RATING_OPTIONS.map((rating) => (
                  <InventoryFilterChip
                    key={rating}
                    label={`${rating} Star${rating === '1' ? '' : 's'}`}
                    active={values.rating === rating}
                    onPress={() => updateField('rating', rating)}
                  />
                ))}
              </View>
              {errors.rating ? (
                <AppText variant="caption" style={{ color: theme.colors.danger }}>
                  {errors.rating}
                </AppText>
              ) : null}
            </View>

            <View style={styles.optionGroup}>
              <AppText variant="caption">Module</AppText>
              <View style={styles.chipRow}>
                {REVIEW_MODULE_OPTIONS.map((moduleSource) => (
                  <InventoryFilterChip
                    key={moduleSource}
                    label={formatReviewModule(moduleSource)}
                    active={values.moduleSource === moduleSource}
                    onPress={() => updateField('moduleSource', moduleSource)}
                  />
                ))}
              </View>
            </View>
          </AppCard>

          <AppCard variant="subtle">
            <View style={styles.footerActions}>
              <View style={styles.footerCopy}>
                <AppText variant="subtitle">
                  {isEdit ? 'Ready to save this review?' : 'Ready to submit this review?'}
                </AppText>
                <AppText variant="caption">
                  Status management stays on the detail screen so the original feedback remains clear.
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
                  label={isEdit ? 'Save changes' : 'Submit review'}
                  loading={pending}
                  onPress={() => {
                    void handleSubmit();
                  }}
                  disabled={!canSubmit}
                  style={styles.footerButton}
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
  stateBox: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  optionGroup: {
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  messageBox: {
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
