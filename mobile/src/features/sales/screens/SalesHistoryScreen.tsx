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
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { SaleHistoryItem } from '@/features/sales/components/SaleHistoryItem';
import { useSalesHistory } from '@/features/sales/hooks/useSales';
import { getSalesPermissions } from '@/features/sales/utils/sales-access';

import type { SaleRecord, SalesHistoryQuery } from '@/features/sales/types';

const STATUS_FILTERS: Array<{
  label: string;
  value: NonNullable<SalesHistoryQuery['status']> | '';
}> = [
  { label: 'All', value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Voided', value: 'voided' },
];

export function SalesHistoryScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const permissions = getSalesPermissions(user?.role);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('');
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  const historyQuery = useSalesHistory({
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const sales = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.items) || [],
    [historyQuery.data]
  );
  const meta = historyQuery.data?.pages[0]?.meta;

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to open sales history."
      />
    );
  }

  if (historyQuery.isError && !sales.length) {
    return (
      <ErrorState
        title="Sales history unavailable"
        message={getErrorMessage(historyQuery.error, "We couldn't load recent sales right now.")}
        actionLabel="Back to POS"
        onAction={() => router.replace(appRoutes.sales as Href)}
      />
    );
  }

  function openSale(id: string) {
    router.push(`/(tabs)/sales/${id}` as Href);
  }

  function renderSale({ item }: { item: SaleRecord }) {
    return <SaleHistoryItem item={item} onPress={() => openSale(item.id)} />;
  }

  const listHeader = (
    <View style={styles.headerContainer}>
      <AppCard variant="hero">
        <View style={styles.heroBlock}>
          <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
            <View style={styles.titleBlock}>
              <AppText variant="caption">Sales history</AppText>
              <AppText variant="title">Recent invoices and completed sales</AppText>
              <AppText>
                Search by bill number, customer, or sold medicine and open any sale in one tap.
              </AppText>
            </View>
            <AppButton label="New sale" onPress={() => router.replace(appRoutes.sales as Href)} />
          </View>

          <View style={styles.heroMetrics}>
            <View
              style={[
                styles.metricCard,
                responsive.isMdUp ? styles.halfWidth : styles.fullWidth,
              ]}
            >
              <AppText variant="caption">Loaded</AppText>
              <AppText variant="subtitle">{sales.length}</AppText>
            </View>
            <View
              style={[
                styles.metricCard,
                responsive.isMdUp ? styles.halfWidth : styles.fullWidth,
              ]}
            >
              <AppText variant="caption">Filter</AppText>
              <AppText variant="subtitle">
                {statusFilter ? statusFilter.replace('_', ' ') : 'All'}
              </AppText>
            </View>
          </View>
        </View>
      </AppCard>

      <AppCard variant="subtle">
        <AppTextField
          label="Search sales"
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search bill number, customer, or medicine"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;

            return (
              <AppButton
                key={filter.value || 'all'}
                label={filter.label}
                variant={active ? 'primary' : 'secondary'}
                onPress={() => setStatusFilter(filter.value)}
                style={styles.filterButton}
              />
            );
          })}
        </ScrollView>
      </AppCard>

      {meta ? (
        <View style={styles.metaStrip}>
          <AppText variant="caption">
            {meta.total} sales
            {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
            {statusFilter ? ` in ${statusFilter.replace('_', ' ')}` : ''}.
          </AppText>
        </View>
      ) : null}

      {historyQuery.error && sales.length ? (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: `${theme.colors.warning}10`,
              borderColor: `${theme.colors.warning}40`,
            },
          ]}
        >
          <AppText style={{ color: theme.colors.warning }}>
            {getErrorMessage(historyQuery.error, 'Some sales may be out of date. Pull to refresh.')}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  const listEmpty = historyQuery.isLoading ? (
    <View style={styles.stateBox}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <AppText>Loading sales history...</AppText>
    </View>
  ) : (
    <EmptyState
      icon="receipt-outline"
      title="No sales found"
      message={
        debouncedSearch || statusFilter
          ? 'Try a different search term or clear the status filter.'
          : 'Complete your first sale to start building invoice history here.'
      }
      actionLabel="Start a sale"
      onAction={() => router.replace(appRoutes.sales as Href)}
    />
  );

  return (
    <AppScreen contentWidth="wide">
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={renderSale}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={() => {
          if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) {
            void historyQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={historyQuery.isRefetching}
            onRefresh={() => {
              void historyQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={
          historyQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <AppText variant="caption">Loading more sales...</AppText>
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
  filterRow: {
    gap: 8,
  },
  filterButton: {
    minWidth: 104,
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
