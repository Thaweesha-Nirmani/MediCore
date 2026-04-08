import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { EmptyState } from '@/components/feedback/EmptyState';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { InventoryBatchItem } from '@/features/inventory/components/InventoryBatchItem';
import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { useInventoryList } from '@/features/inventory/hooks/useInventory';
import { getInventoryPermissions } from '@/features/inventory/utils/inventory-access';

import type { InventoryBatch } from '@/features/inventory/types';

const STOCK_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Available', value: 'available' },
  { label: 'Low stock', value: 'low_stock' },
  { label: 'Expired', value: 'expired' },
] as const;

export function InventoryListScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const permissions = getInventoryPermissions(user?.role);
  const [searchText, setSearchText] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  const inventoryQuery = useInventoryList({
    limit: 20,
    search: debouncedSearch,
    stockStatus: stockStatus || undefined,
    sortBy: stockStatus === 'expired' ? 'expiryDate' : 'updatedAt',
    sortOrder: stockStatus === 'expired' ? 'asc' : 'desc',
  });

  const items = useMemo(
    () => inventoryQuery.data?.pages.flatMap((page) => page.items) || [],
    [inventoryQuery.data]
  );
  const meta = inventoryQuery.data?.pages[0]?.meta;

  function openInventoryBatch(id: string) {
    router.push(`/(tabs)/inventory/${id}` as Href);
  }

  function renderBatch({ item }: { item: InventoryBatch }) {
    return <InventoryBatchItem item={item} onPress={() => openInventoryBatch(item.id)} />;
  }

  const listHeader = (
    <View style={styles.headerContainer}>
      <AppCard variant="hero">
        <View style={[styles.heroRow, !responsive.isMdUp && styles.stackColumn]}>
          <View style={styles.heroCopy}>
            <AppText variant="caption">Inventory operations</AppText>
            <AppText variant="title">Batch-first stock control</AppText>
            <AppText>
              Search batches fast, scan quantity at a glance, and move quickly into shortage,
              expiry, or movement actions.
            </AppText>
            <View style={styles.heroPillRow}>
              <HeroPill
                icon="cube-outline"
                text={`${meta?.total ?? items.length} stock batches`}
              />
              <HeroPill
                icon={permissions.canManage ? 'create-outline' : 'eye-outline'}
                text={permissions.canManage ? 'Stock operations enabled' : 'Read-only stock view'}
              />
            </View>
          </View>

          {permissions.canManage ? (
            <Pressable
              onPress={() => router.push(appRoutes.inventoryAdd as Href)}
              style={[
                styles.addAction,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.borderStrong,
                  borderRadius: theme.radius.lg,
                  shadowColor: theme.colors.shadowStrong,
                },
              ]}
            >
              <Ionicons color="#FFFFFF" name="add" size={24} />
              <AppText variant="caption" style={{ color: '#FFFFFF' }}>
                Add
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </AppCard>

      <AppCard variant="subtle">
        <View style={styles.searchBlock}>
          <InventorySearchBar
            value={searchText}
            onChangeText={setSearchText}
            onClear={() => setSearchText('')}
          />

          <View style={styles.searchHints}>
            <SearchHint
              icon="search-outline"
              text="Search by medicine, batch number, or location."
            />
            <SearchHint
              icon="shield-checkmark-outline"
              text="Batch rows prioritize quantity, available stock, and expiry risk."
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {STOCK_FILTERS.map((filter) => (
              <InventoryFilterChip
                key={filter.value || 'all'}
                label={filter.label}
                active={stockStatus === filter.value}
                onPress={() => setStockStatus(filter.value)}
              />
            ))}
          </ScrollView>

          <View style={[styles.quickActions, !responsive.isMdUp && styles.stackColumn]}>
            <AppButton
              label="Low stock"
              variant="secondary"
              onPress={() => router.push(appRoutes.inventoryLowStock as Href)}
              style={styles.actionButton}
            />
            <AppButton
              label="Expiry"
              variant="secondary"
              onPress={() => router.push(appRoutes.inventoryExpiry as Href)}
              style={styles.actionButton}
            />
          </View>

          <View style={[styles.quickActions, !responsive.isMdUp && styles.stackColumn]}>
            <AppButton
              label="Movements"
              variant="secondary"
              onPress={() => router.push(appRoutes.inventoryMovements as Href)}
              style={styles.actionButton}
            />
            {permissions.canManage ? (
              <AppButton
                label="Add stock"
                onPress={() => router.push(appRoutes.inventoryAdd as Href)}
                style={styles.actionButton}
              />
            ) : null}
          </View>
        </View>
      </AppCard>

      {meta ? (
        <View style={styles.metaStrip}>
          <AppText variant="caption">
            {debouncedSearch
              ? `${meta.total} stock batches matched "${debouncedSearch}".`
              : `${meta.total} stock batches available.`}
          </AppText>
        </View>
      ) : null}

      {inventoryQuery.error ? (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: `${theme.colors.danger}10`,
              borderColor: `${theme.colors.danger}45`,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Ionicons color={theme.colors.danger} name="alert-circle-outline" size={18} />
          <AppText style={{ color: theme.colors.danger, flex: 1 }}>
            {getErrorMessage(inventoryQuery.error, 'Unable to load stock right now.')}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  const listEmpty = inventoryQuery.isLoading ? (
    <View style={styles.stateBox}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <AppText>Loading stock...</AppText>
    </View>
  ) : (
    <EmptyState
      icon="cube-outline"
      title={debouncedSearch ? 'No batches matched this search' : 'No stock batches yet'}
      message={
        debouncedSearch
          ? 'Try another medicine name, batch number, location, or stock filter.'
          : 'Add a stock batch to begin inventory control, expiry review, and movement tracking.'
      }
      actionLabel={permissions.canManage ? 'Add stock batch' : undefined}
      onAction={
        permissions.canManage ? () => router.push(appRoutes.inventoryAdd as Href) : undefined
      }
    />
  );

  return (
    <AppScreen contentWidth="wide">
      <FlatList
        data={items}
        renderItem={renderBatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={() => {
          if (inventoryQuery.hasNextPage && !inventoryQuery.isFetchingNextPage) {
            void inventoryQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.45}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={inventoryQuery.isRefetching}
            onRefresh={() => {
              void inventoryQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={
          inventoryQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <AppText variant="caption">Loading more stock batches...</AppText>
            </View>
          ) : null
        }
      />
    </AppScreen>
  );
}

function InventorySearchBar({
  value,
  onChangeText,
  onClear,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
}) {
  const theme = useAppTheme();

  return (
    <GlassSurface
      style={[
        styles.searchShell,
        {
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.borderStrong,
        },
      ]}
      contentStyle={styles.searchShellContent}
      accent="hero"
      blurIntensity={theme.effects.blurStrong}
    >
      <Ionicons color={theme.colors.primary} name="search-outline" size={20} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Search medicine, batch, or location"
        placeholderTextColor={theme.colors.mutedText}
        returnKeyType="search"
        selectionColor={theme.colors.primary}
        value={value}
        onChangeText={onChangeText}
        style={[styles.searchInput, { color: theme.colors.heading }]}
      />
      {value ? (
        <Pressable onPress={onClear} style={styles.clearAction}>
          <Ionicons color={theme.colors.mutedText} name="close-circle" size={18} />
        </Pressable>
      ) : (
        <Ionicons color={theme.colors.mutedText} name="filter-outline" size={18} />
      )}
    </GlassSurface>
  );
}

function SearchHint({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.searchHint}>
      <Ionicons color={theme.colors.mutedText} name={icon} size={15} />
      <AppText variant="caption" style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

function HeroPill({
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
        styles.heroPill,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.borderStrong,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <Ionicons color={theme.colors.primary} name={icon} size={15} />
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
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  stackColumn: {
    flexDirection: 'column',
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroPill: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addAction: {
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
    height: 70,
    justifyContent: 'center',
    minWidth: 70,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  searchBlock: {
    gap: 14,
  },
  searchShell: {
    minHeight: 60,
  },
  searchShellContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  clearAction: {
    padding: 2,
  },
  searchHints: {
    gap: 8,
  },
  searchHint: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  chipRow: {
    gap: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  metaStrip: {
    paddingHorizontal: 4,
  },
  errorBox: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
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
