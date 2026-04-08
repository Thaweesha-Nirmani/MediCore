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

import { SupplierListItem } from '@/features/suppliers/components/SupplierListItem';
import { useSuppliersList } from '@/features/suppliers/hooks/useSuppliers';
import { getSupplierPermissions } from '@/features/suppliers/utils/supplier-access';

import type { SupplierItem, SupplierListQuery } from '@/features/suppliers/types';

const STATUS_FILTERS: Array<{
  label: string;
  value: NonNullable<SupplierListQuery['status']> | '';
}> = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Archived', value: 'Archived' },
];

export function SuppliersListScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const permissions = getSupplierPermissions(user?.role);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('');
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  const suppliersQuery = useSuppliersList({
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    sortBy: debouncedSearch ? 'name' : 'updatedAt',
    sortOrder: debouncedSearch ? 'asc' : 'desc',
  });

  const suppliers = useMemo(
    () => suppliersQuery.data?.pages.flatMap((page) => page.items) || [],
    [suppliersQuery.data]
  );
  const meta = suppliersQuery.data?.pages[0]?.meta;
  const activeCount = useMemo(
    () => suppliers.filter((supplier) => supplier.status === 'Active').length,
    [suppliers]
  );

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to access supplier records."
      />
    );
  }

  function openSupplier(id: string) {
    router.push(`/(tabs)/more/suppliers/${id}` as Href);
  }

  function renderSupplier({ item }: { item: SupplierItem }) {
    return <SupplierListItem item={item} onPress={() => openSupplier(item.id)} />;
  }

  const listHeader = (
    <View style={styles.headerContainer}>
      <AppCard variant="hero">
        <View style={styles.heroBlock}>
          <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
            <View style={styles.titleBlock}>
              <AppText variant="caption">Supplier management</AppText>
              <AppText variant="title">Procurement contacts</AppText>
              <AppText>
                Search suppliers quickly, review contact details, and keep purchasing records
                current.
              </AppText>
            </View>
            {permissions.canManage ? (
              <AppButton
                label="Add supplier"
                onPress={() => router.push(appRoutes.supplierAdd as Href)}
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
              <AppText variant="subtitle">{suppliers.length}</AppText>
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
              <AppText variant="caption">Active</AppText>
              <AppText variant="subtitle">{activeCount}</AppText>
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
              <AppText variant="subtitle">{statusFilter || 'All'}</AppText>
            </View>
          </View>
        </View>
      </AppCard>

      <AppCard variant="subtle">
        <AppTextField
          label="Search suppliers"
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search name, contact, email, or city"
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
            {meta.total} suppliers
            {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
            {statusFilter ? ` in ${statusFilter}` : ''}.
          </AppText>
        </View>
      ) : null}

      {suppliersQuery.error ? (
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
            {getErrorMessage(suppliersQuery.error, 'Unable to load suppliers right now.')}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  const listEmpty = suppliersQuery.isLoading ? (
    <View style={styles.stateBox}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <AppText>Loading suppliers...</AppText>
    </View>
  ) : (
    <EmptyState
      icon="people-outline"
      title="No suppliers found"
      message={
        debouncedSearch || statusFilter
          ? 'Try another search term or clear the filters.'
          : 'No supplier records are available in this workspace yet.'
      }
      actionLabel={permissions.canManage ? 'Add supplier' : undefined}
      onAction={
        permissions.canManage ? () => router.push(appRoutes.supplierAdd as Href) : undefined
      }
    />
  );

  return (
    <AppScreen contentWidth="wide">
      <FlatList
        data={suppliers}
        keyExtractor={(item) => item.id}
        renderItem={renderSupplier}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={() => {
          if (suppliersQuery.hasNextPage && !suppliersQuery.isFetchingNextPage) {
            void suppliersQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={suppliersQuery.isRefetching}
            onRefresh={() => {
              void suppliersQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={
          suppliersQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <AppText variant="caption">Loading more suppliers...</AppText>
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
