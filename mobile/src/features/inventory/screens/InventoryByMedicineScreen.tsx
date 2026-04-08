import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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

import { InventoryBatchItem } from '@/features/inventory/components/InventoryBatchItem';
import { useInventoryByMedicine } from '@/features/inventory/hooks/useInventory';
import { getInventoryPermissions } from '@/features/inventory/utils/inventory-access';
import {
  getInventoryDisplayName,
  getInventoryTagValues,
} from '@/features/inventory/utils/inventory-display';

import type { InventoryBatch } from '@/features/inventory/types';

export function InventoryByMedicineScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ medicineId?: string }>();
  const { user } = useAuthSession();
  const permissions = getInventoryPermissions(user?.role);
  const inventoryQuery = useInventoryByMedicine(params.medicineId, {
    limit: 25,
    sortBy: 'expiryDate',
    sortOrder: 'asc',
  });

  const batches = useMemo(
    () => inventoryQuery.data?.pages.flatMap((page) => page.items) || [],
    [inventoryQuery.data]
  );
  const headerBatch = batches[0];
  const tags = getInventoryTagValues(headerBatch);

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to view medicine-linked stock."
      />
    );
  }

  if (inventoryQuery.isLoading) {
    return (
      <AppScreen>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <AppText>Loading medicine-linked stock...</AppText>
        </View>
      </AppScreen>
    );
  }

  if (inventoryQuery.isError) {
    return (
      <ErrorState
        title="Stock view unavailable"
        message="We couldn't load stock for this medicine right now."
        actionLabel="Back to inventory"
        onAction={() => router.replace(appRoutes.inventory as Href)}
      />
    );
  }

  const listHeader = (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
      </View>

      <AppCard variant="hero">
        <View style={styles.copyBlock}>
          <AppText variant="caption">Medicine-linked stock</AppText>
          <AppText variant="title">
            {getInventoryDisplayName(headerBatch)}
          </AppText>
          <AppText>
            Review all active batches for this medicine in expiry order, with quantity and batch
            detail kept together.
          </AppText>
          <View style={styles.tagRow}>
            <InventoryMetaPill text={headerBatch?.medicine?.medicineId || String(params.medicineId || 'Medicine')} />
            {tags.map((tag) => (
              <InventoryMetaPill key={tag} text={tag} />
            ))}
          </View>
        </View>
      </AppCard>
    </View>
  );

  return (
    <AppScreen>
      <FlatList
        data={batches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: InventoryBatch }) => (
          <InventoryBatchItem item={item} onPress={() => router.push(`/(tabs)/inventory/${item.id}` as Href)} />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <AppCard variant="subtle">
            <AppText>No batches found for this medicine.</AppText>
          </AppCard>
        }
        onEndReached={() => {
          if (inventoryQuery.hasNextPage && !inventoryQuery.isFetchingNextPage) {
            void inventoryQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.45}
        refreshControl={
          <RefreshControl
            refreshing={inventoryQuery.isRefetching}
            onRefresh={() => {
              void inventoryQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
      />
    </AppScreen>
  );
}

function InventoryMetaPill({ text }: { text: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.metaPill,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.borderStrong,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <AppText variant="caption">{text}</AppText>
    </View>
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
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
});
