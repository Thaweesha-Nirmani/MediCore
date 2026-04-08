import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
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
import { AppScreen } from '@/components/layout/AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useAppTheme } from '@/theme/useAppTheme';

import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { InventoryMovementItem } from '@/features/inventory/components/InventoryMovementItem';
import { useInventoryMovements } from '@/features/inventory/hooks/useInventory';
import { getInventoryPermissions } from '@/features/inventory/utils/inventory-access';

import type { InventoryMovement } from '@/features/inventory/types';

const MOVEMENT_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Add', value: 'add' },
  { label: 'Adjust', value: 'adjust' },
  { label: 'Transfer out', value: 'transfer_out' },
  { label: 'Dispose', value: 'dispose' },
] as const;

export function InventoryMovementsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ inventoryId?: string; medicineId?: string }>();
  const { user } = useAuthSession();
  const permissions = getInventoryPermissions(user?.role);
  const [type, setType] = useState('');
  const movementQuery = useInventoryMovements({
    inventoryId: params.inventoryId,
    medicineId: params.medicineId,
    type: type || undefined,
    limit: 25,
  });

  const items = useMemo(
    () => movementQuery.data?.pages.flatMap((page) => page.items) || [],
    [movementQuery.data]
  );

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to view stock movements."
      />
    );
  }

  if (movementQuery.isLoading) {
    return (
      <AppScreen>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <AppText>Loading stock movements...</AppText>
        </View>
      </AppScreen>
    );
  }

  if (movementQuery.isError) {
    return (
      <ErrorState
        title="Movement history unavailable"
        message="We couldn't load inventory movement history right now."
        actionLabel="Back to inventory"
        onAction={() => router.replace(appRoutes.inventory as Href)}
      />
    );
  }

  return (
    <AppScreen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: InventoryMovement }) => <InventoryMovementItem item={item} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
              <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
            </View>

            <AppCard variant="hero">
              <View style={styles.copyBlock}>
                <AppText variant="caption">Movement history</AppText>
                <AppText variant="title">Track stock changes</AppText>
                <AppText>
                  Review adds, adjustments, transfers, and disposals with enough context to trust the
                  stock trail.
                </AppText>
              </View>
            </AppCard>

            <AppCard variant="subtle">
              <View style={styles.filterHeader}>
                <View style={styles.filterCopy}>
                  <AppText variant="subtitle">Filter movement types</AppText>
                  <AppText variant="caption">
                    Narrow the audit trail without losing quantity context.
                  </AppText>
                </View>
                <AppText variant="caption">{items.length} items</AppText>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {MOVEMENT_FILTERS.map((filter) => (
                  <InventoryFilterChip
                    key={filter.value || 'all'}
                    label={filter.label}
                    active={type === filter.value}
                    onPress={() => setType(filter.value)}
                  />
                ))}
              </ScrollView>
            </AppCard>
          </View>
        }
        ListEmptyComponent={
          <AppCard variant="subtle">
            <View style={styles.emptyState}>
              <AppText variant="subtitle">No movements found</AppText>
              <AppText>Try another movement filter or inventory context.</AppText>
            </View>
          </AppCard>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={() => {
          if (movementQuery.hasNextPage && !movementQuery.isFetchingNextPage) {
            void movementQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.45}
        refreshControl={
          <RefreshControl
            refreshing={movementQuery.isRefetching}
            onRefresh={() => {
              void movementQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={
          movementQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <AppText variant="caption">Loading more movement history...</AppText>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyBlock: {
    gap: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  filterCopy: {
    flex: 1,
    gap: 4,
  },
  chipRow: {
    gap: 8,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  footerLoader: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
});
