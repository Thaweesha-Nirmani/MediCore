import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { AppScreen } from '@/components/layout/AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { useArchiveReview, useReviewDetail, useUpdateReview } from '@/features/reviews/hooks/useReviews';
import { getReviewPermissions } from '@/features/reviews/utils/review-access';
import {
  formatReviewDate,
  formatReviewModule,
  formatReviewStatus,
  getReviewOwnerLine,
  getReviewStatusColor,
  REVIEW_STATUS_OPTIONS,
} from '@/features/reviews/utils/review-display';

export function ReviewDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();
  const reviewQuery = useReviewDetail(params.id);
  const detail = reviewQuery.data;
  const permissions = getReviewPermissions(user?.role, detail || null);
  const updateMutation = useUpdateReview(params.id);
  const archiveMutation = useArchiveReview(params.id);

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to open system reviews."
        actionLabel="Back to More"
        onAction={() => router.replace(appRoutes.more as Href)}
      />
    );
  }

  if (reviewQuery.isLoading) {
    return (
      <AppScreen contentWidth="page">
        <View style={styles.stateBox}>
          <AppText>Loading review...</AppText>
        </View>
      </AppScreen>
    );
  }

  if (reviewQuery.isError || !detail) {
    return (
      <ErrorState
        title="Review unavailable"
        message={getErrorMessage(reviewQuery.error, "We couldn't load this review right now.")}
        actionLabel="Back to reviews"
        onAction={() => router.replace(appRoutes.reviews as Href)}
      />
    );
  }

  const review = detail;

  const statusColor = getReviewStatusColor(review.status, {
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
  });

  function changeStatus(status: (typeof REVIEW_STATUS_OPTIONS)[number]) {
    if (!permissions.canManageAll || review.isArchived || String(review.status).toLowerCase() === status) {
      return;
    }

    updateMutation.mutate({ status });
  }

  function handleArchive() {
    if (!permissions.canArchive || review.isArchived || archiveMutation.isPending) {
      return;
    }

    const action = () => archiveMutation.mutate();
    const message = 'This will archive the review while keeping its history available.';

    if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
      if (globalThis.confirm(message)) {
        action();
      }
      return;
    }

    Alert.alert('Archive review', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: action },
    ]);
  }

  const actionError = updateMutation.error || archiveMutation.error;

  return (
    <AppScreen contentWidth="page">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
          {permissions.canEdit ? (
            <AppButton
              label="Edit review"
              onPress={() => router.push(`/(tabs)/more/reviews/edit/${review.id}` as Href)}
            />
          ) : null}
        </View>

        <AppCard variant="hero">
          <View style={styles.heroBlock}>
            <AppText variant="caption">{formatReviewModule(review.moduleSource)}</AppText>
            <AppText variant="title">{review.title}</AppText>
            <AppText>{getReviewOwnerLine(review)}</AppText>

            <View style={styles.heroMeta}>
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
                  {formatReviewStatus(review.status)}
                </AppText>
              </View>
              <View
                style={[
                  styles.metaPill,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.borderSoft,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                  <AppText variant="caption">{review.rating.toFixed(1)} / 5</AppText>
                </View>
              {review.mine ? (
                <View
                  style={[
                    styles.metaPill,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.borderSoft,
                      borderRadius: theme.radius.pill,
                    },
                  ]}
                >
                  <AppText variant="caption">Mine</AppText>
                </View>
              ) : null}
            </View>
          </View>
        </AppCard>

        {actionError ? (
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
                {getErrorMessage(actionError, 'Unable to update this review.')}
              </AppText>
            </View>
          </AppCard>
        ) : null}

        {permissions.canManageAll && !review.isArchived ? (
          <AppCard variant="subtle">
            <AppText variant="subtitle">Review status</AppText>
            <AppText variant="caption">
              Managers can acknowledge or resolve reviews without rewriting the original feedback.
            </AppText>
            <View style={styles.chipRow}>
              {REVIEW_STATUS_OPTIONS.map((status) => (
                <InventoryFilterChip
                  key={status}
                  label={formatReviewStatus(status)}
                  active={String(review.status).toLowerCase() === status}
                  onPress={() => changeStatus(status)}
                />
              ))}
            </View>
          </AppCard>
        ) : null}

        <AppCard variant="subtle">
          <AppText variant="subtitle">Feedback</AppText>
          <AppText>{review.content}</AppText>
        </AppCard>

        <AppCard variant="subtle">
          <AppText variant="subtitle">Timeline</AppText>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Created</AppText>
            <AppText>{formatReviewDate(review.createdAt)}</AppText>
          </View>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Updated</AppText>
            <AppText>{formatReviewDate(review.updatedAt)}</AppText>
          </View>
          {review.archivedAt ? (
            <View style={styles.infoRow}>
              <AppText style={styles.infoLabel}>Archived</AppText>
              <AppText>{formatReviewDate(review.archivedAt)}</AppText>
            </View>
          ) : null}
        </AppCard>

        {permissions.canArchive && !review.isArchived ? (
          <AppCard variant="subtle">
            <AppButton
              label={archiveMutation.isPending ? 'Archiving review' : 'Archive review'}
              variant="destructive"
              loading={archiveMutation.isPending}
              onPress={handleArchive}
            />
          </AppCard>
        ) : null}
      </ScrollView>
    </AppScreen>
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
  heroBlock: {
    gap: 10,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontWeight: '700',
  },
  messageBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
