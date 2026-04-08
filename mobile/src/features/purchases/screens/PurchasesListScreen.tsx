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

import { PurchaseListItem } from '@/features/purchases/components/PurchaseListItem';
import { usePurchasesList } from '@/features/purchases/hooks/usePurchases';
import { getPurchasePermissions } from '@/features/purchases/utils/purchase-access';

import type { PurchaseListQuery, PurchaseOrder } from '@/features/purchases/types';

const STATUS_FILTERS: Array<{
  label: string;
  value: NonNullable<PurchaseListQuery['orderStatus']> | '';
}> = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Placed', value: 'placed' },
  { label: 'Partially received', value: 'partially_received' },
  { label: 'Received', value: 'received' },
];

export function PurchasesListScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const permissions = getPurchasePermissions(user?.role);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('');
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  const purchasesQuery = usePurchasesList({
    limit: 20,
    search: debouncedSearch || undefined,
    orderStatus: statusFilter || undefined,
    sortBy: 'purchaseDate',
    sortOrder: 'desc',
  });

  const purchases = useMemo(
    () => purchasesQuery.data?.pages.flatMap((page) => page.items) || [],
    [purchasesQuery.data]
  );
  const meta = purchasesQuery.data?.pages[0]?.meta;
  const openReceiveCount = useMemo(
    () =>
      purchases.filter(
        (purchase) =>
          purchase.orderStatus !== 'cancelled' && purchase.receiveStatus !== 'fully_received'
      ).length,
    [purchases]
  );

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to access purchase orders."
      />
    );
  }

  function openPurchase(id: string) {
    router.push(`/(tabs)/more/purchases/${id}` as Href);
  }

  function renderPurchase({ item }: { item: PurchaseOrder }) {
    return <PurchaseListItem item={item} onPress={() => openPurchase(item.id)} />;
  }

  const listHeader = (
    <View style={styles.headerContainer}>
      <AppCard variant="hero">
        <View style={styles.heroBlock}>
          <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
            <View style={styles.titleBlock}>
              <AppText variant="caption">Purchase management</AppText>
              <AppText variant="title">Orders and receiving</AppText>
              <AppText>
                Search purchase orders, review supplier deliveries, and open receiving workflows
                quickly.
              </AppText>
            </View>
            {permissions.canManage ? (
              <AppButton
                label="New purchase"
                onPress={() => router.push(appRoutes.purchaseAdd as Href)}
              />
            ) : null}
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
              <AppText variant="subtitle">{purchases.length}</AppText>
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
              <AppText variant="caption">Need receiving</AppText>
              <AppText variant="subtitle">{openReceiveCount}</AppText>
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
              <AppText variant="caption">Filter</AppText>
              <AppText variant="subtitle">
                {statusFilter ? statusFilter.replace(/_/g, ' ') : 'All'}
              </AppText>
            </View>
          </View>
        </View>
      </AppCard>

      <AppCard variant="subtle">
        <AppTextField
          label="Search purchases"
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search purchase number, supplier, or medicine"
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
              key={filter.value || 'all'}
              label={filter.label}
              active={statusFilter === filter.value}
              onPress={() => setStatusFilter(filter.value)}
            />
          ))}
        </ScrollView>
      </AppCard>

      {meta ? (
        <View style={styles.metaStrip}>
          <AppText variant="caption">
            {meta.total} purchase orders
            {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
            {statusFilter ? ` in ${statusFilter.replace(/_/g, ' ')}` : ''}.
          </AppText>
        </View>
      ) : null}

      {purchasesQuery.error ? (
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
            {getErrorMessage(purchasesQuery.error, 'Unable to load purchases right now.')}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  const listEmpty = purchasesQuery.isLoading ? (
    <View style={styles.stateBox}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <AppText>Loading purchase orders...</AppText>
    </View>
  ) : (
    <EmptyState
      icon="document-text-outline"
      title="No purchase orders found"
      message={
        debouncedSearch || statusFilter
          ? 'Try another search term or clear the current filter.'
          : 'No purchase orders are available yet for this workspace.'
      }
      actionLabel={permissions.canManage ? 'New purchase' : undefined}
      onAction={
        permissions.canManage ? () => router.push(appRoutes.purchaseAdd as Href) : undefined
      }
    />
  );

  return (
    <AppScreen contentWidth="wide">
      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id}
        renderItem={renderPurchase}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={() => {
          if (purchasesQuery.hasNextPage && !purchasesQuery.isFetchingNextPage) {
            void purchasesQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={purchasesQuery.isRefetching}
            onRefresh={() => {
              void purchasesQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={
          purchasesQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <AppText variant="caption">Loading more purchases...</AppText>
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
