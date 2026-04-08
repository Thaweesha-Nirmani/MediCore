import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { AppScreen } from '@/components/layout/AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { ReviewListItem } from '@/features/reviews/components/ReviewListItem';
import { useReviewsList } from '@/features/reviews/hooks/useReviews';
import { getReviewPermissions } from '@/features/reviews/utils/review-access';
import { formatReviewStatus, REVIEW_STATUS_OPTIONS } from '@/features/reviews/utils/review-display';

import type { ReviewItem, ReviewListQuery } from '@/features/reviews/types';

const STATUS_FILTERS: Array<{
  label: string;
  value: NonNullable<ReviewListQuery['status']> | '';
}> = [{ label: 'All', value: '' }].concat(
  REVIEW_STATUS_OPTIONS.map((value) => ({
    label: formatReviewStatus(value),
    value,
  }))
);

export function ReviewsListScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const permissions = getReviewPermissions(user?.role);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('');
  const [mineOnly, setMineOnly] = useState(!permissions.canManageAll);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  const reviewsQuery = useReviewsList({
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    mine: permissions.canManageAll ? mineOnly : undefined,
    includeArchived: false,
  });

  const reviews = useMemo(
    () => reviewsQuery.data?.pages.flatMap((page) => page.items) || [],
    [reviewsQuery.data]
  );
  const meta = reviewsQuery.data?.pages[0]?.meta;
  const openCount = useMemo(
    () => reviews.filter((item) => String(item.status).toLowerCase() === 'open').length,
    [reviews]
  );
  const mineCount = useMemo(() => reviews.filter((item) => item.mine).length, [reviews]);

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

  function openReview(id: string) {
    router.push(`/(tabs)/more/reviews/${id}` as Href);
  }

  function renderReview({ item }: { item: ReviewItem }) {
    return <ReviewListItem item={item} onPress={() => openReview(item.id)} />;
  }

  const listHeader = (
    <View style={styles.headerContainer}>
      <AppCard variant="hero">
        <View style={styles.heroBlock}>
          <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
            <View style={styles.titleBlock}>
              <AppText variant="caption">System reviews</AppText>
              <AppText variant="title">Operational feedback and issue notes</AppText>
              <AppText>
                Keep mobile feedback aligned with the web workflow while preserving role-scoped
                visibility.
              </AppText>
            </View>
            <AppButton label="New review" onPress={() => router.push(appRoutes.reviewAdd as Href)} />
          </View>

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
              <AppText variant="caption">Loaded</AppText>
              <AppText variant="subtitle">{reviews.length}</AppText>
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
              <AppText variant="caption">Open</AppText>
              <AppText variant="subtitle">{openCount}</AppText>
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
              <AppText variant="caption">Scope</AppText>
              <AppText variant="subtitle">
                {permissions.canManageAll ? (mineOnly ? 'Mine' : 'Team') : `${mineCount} mine`}
              </AppText>
            </View>
          </View>
        </View>
      </AppCard>

      <AppCard variant="subtle">
        <AppTextField
          label="Search reviews"
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search title or feedback text"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTERS.map((filter) => (
            <InventoryFilterChip
              key={filter.value || 'all-status'}
              label={filter.label}
              active={statusFilter === filter.value}
              onPress={() => setStatusFilter(filter.value)}
            />
          ))}
        </ScrollView>

        {permissions.canManageAll ? (
          <View style={styles.scopeRow}>
            <InventoryFilterChip label="Team reviews" active={!mineOnly} onPress={() => setMineOnly(false)} />
            <InventoryFilterChip label="My reviews" active={mineOnly} onPress={() => setMineOnly(true)} />
          </View>
        ) : null}
      </AppCard>

      {meta ? (
        <View style={styles.metaStrip}>
          <AppText variant="caption">
            {meta.total} reviews
            {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
            {statusFilter ? ` in ${formatReviewStatus(statusFilter)}` : ''}.
          </AppText>
        </View>
      ) : null}

      {reviewsQuery.error ? (
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
            {getErrorMessage(reviewsQuery.error, 'Unable to load reviews right now.')}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  const listEmpty = reviewsQuery.isLoading ? (
    <View style={styles.stateBox}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <AppText>Loading reviews...</AppText>
    </View>
  ) : (
    <EmptyState
      icon="chatbubble-ellipses-outline"
      title="No reviews found"
      message={
        debouncedSearch || statusFilter
          ? 'Try another search term or clear the filters.'
          : 'Create the first review to capture operational feedback from mobile.'
      }
      actionLabel="New review"
      onAction={() => router.push(appRoutes.reviewAdd as Href)}
    />
  );

  return (
    <AppScreen contentWidth="wide">
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReview}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={() => {
          if (reviewsQuery.hasNextPage && !reviewsQuery.isFetchingNextPage) {
            void reviewsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={reviewsQuery.isRefetching}
            onRefresh={() => {
              void reviewsQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={
          reviewsQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <AppText variant="caption">Loading more reviews...</AppText>
            </View>
          ) : null
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  headerContainer: {
    gap: 16,
    marginBottom: 4,
  },
  heroBlock: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  stackColumn: {
    flexDirection: 'column',
  },
  titleBlock: {
    flex: 1,
    gap: 6,
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
  filterRow: {
    gap: 8,
  },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaStrip: {
    paddingHorizontal: 4,
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stateBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 36,
  },
  centeredText: {
    maxWidth: 420,
    textAlign: 'center',
  },
  footerLoader: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
});
