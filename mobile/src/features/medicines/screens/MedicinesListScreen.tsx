import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
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

import { MedicineExpiryBadge } from '@/features/medicines/components/MedicineExpiryBadge';
import { MedicineListItem } from '@/features/medicines/components/MedicineListItem';
import {
  useArchiveMedicine,
  useMedicinesList,
  useRestoreMedicine,
} from '@/features/medicines/hooks/useMedicines';
import type { MedicineItem, MedicineListQuery } from '@/features/medicines/types';
import { getMedicinePermissions } from '@/features/medicines/utils/medicine-access';
import {
  formatMedicineCurrency,
  formatMedicineDate,
  getMedicineDisplayName,
  getMedicineIdentityLine,
  getStockStatusLabel,
} from '@/features/medicines/utils/medicine-display';

type FilterOption = {
  label: string;
  value: string;
};

const STATUS_FILTERS: FilterOption[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Archived', value: 'archived' },
  { label: 'All visible', value: '' },
];

const EXPIRY_FILTERS: FilterOption[] = [
  { label: 'All expiry states', value: '' },
  { label: 'Expired', value: 'expired' },
  { label: 'Expiring soon', value: 'expiring_soon' },
  { label: 'Expiring in 30 days', value: 'expiring_in_30_days' },
  { label: 'Safe', value: 'safe' },
];

const STOCK_FILTERS: FilterOption[] = [
  { label: 'All stock levels', value: '' },
  { label: 'Available', value: 'available' },
  { label: 'Low stock', value: 'low_stock' },
  { label: 'Out of stock', value: 'out_of_stock' },
];

const SORT_OPTIONS: Array<FilterOption & { sortBy: NonNullable<MedicineListQuery['sortBy']>; sortOrder: NonNullable<MedicineListQuery['sortOrder']> }> = [
  { label: 'Newest updated', value: 'updatedAt:desc', sortBy: 'updatedAt', sortOrder: 'desc' },
  { label: 'Name A-Z', value: 'name:asc', sortBy: 'name', sortOrder: 'asc' },
  { label: 'Price low-high', value: 'price:asc', sortBy: 'price', sortOrder: 'asc' },
  { label: 'Stock high-low', value: 'quantity:desc', sortBy: 'quantity', sortOrder: 'desc' },
  { label: 'Expiry soonest', value: 'expiryDate:asc', sortBy: 'expiryDate', sortOrder: 'asc' },
];

export function MedicinesListScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const permissions = getMedicinePermissions(user?.role);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0].value);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  const activeSort =
    SORT_OPTIONS.find((option) => option.value === sortValue) || SORT_OPTIONS[0];

  const medicinesQuery = useMedicinesList({
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    supplier: supplierFilter || undefined,
    expiryStatus: (expiryFilter || undefined) as MedicineListQuery['expiryStatus'],
    stockLevel: (stockFilter || undefined) as MedicineListQuery['stockLevel'],
    sortBy: activeSort.sortBy,
    sortOrder: activeSort.sortOrder,
    includeDeleted: statusFilter === 'archived',
  });

  const items = useMemo(
    () => medicinesQuery.data?.pages.flatMap((page) => page.items) || [],
    [medicinesQuery.data]
  );
  const meta = medicinesQuery.data?.pages[0]?.meta;
  const categoryOptions = useMemo<FilterOption[]>(
    () => [
      { label: 'All categories', value: '' },
      ...((meta?.filterOptions?.categories || [])
        .filter(Boolean)
        .map((value) => ({ label: value, value }))),
    ],
    [meta?.filterOptions?.categories]
  );
  const supplierOptions = useMemo<FilterOption[]>(
    () => [
      { label: 'All suppliers', value: '' },
      ...((meta?.filterOptions?.suppliers || [])
        .filter(Boolean)
        .map((value) => ({ label: value, value }))),
    ],
    [meta?.filterOptions?.suppliers]
  );
  const metrics = useMemo(() => {
    const total = meta?.total ?? items.length;
    const expired = items.filter((item) => item.expiryStatus === 'expired').length;
    const lowStock = items.filter((item) => item.stockStatus === 'low_stock').length;
    const archived = items.filter((item) => item.isDeleted).length;

    return { total, expired, lowStock, archived };
  }, [items, meta?.total]);

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to view medicine records."
      />
    );
  }

  if (medicinesQuery.isLoading && !items.length) {
    return (
      <LoadingState
        title="Loading medicines"
        message="Preparing medicine, stock, supplier, and expiry data."
      />
    );
  }

  if (medicinesQuery.isError && !items.length) {
    return (
      <ErrorState
        title="Medicines unavailable"
        message={getErrorMessage(medicinesQuery.error, 'We could not load the medicine catalog.')}
        actionLabel="Try again"
        onAction={() => {
          void medicinesQuery.refetch();
        }}
      />
    );
  }

  return (
    <AppScreen contentWidth="wide">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={medicinesQuery.isRefetching}
            onRefresh={() => {
              void medicinesQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
      >
        <AppCard
          variant="hero"
          style={{ borderColor: `${theme.colors.success}30`, borderWidth: 1 }}
        >
          <View style={[styles.heroRow, !responsive.isMdUp && styles.stackColumn]}>
            <View style={styles.heroCopy}>
              <AppText variant="caption" style={{ color: theme.colors.success }}>
                Medicine management
              </AppText>
              <AppText variant="title">Medicine catalog and stock health</AppText>
              <AppText>
                Search, filter, review expiry risk, and manage archived medicines from one clean
                operational view.
              </AppText>

              <View style={styles.metricGrid}>
                <MetricCard label="Records" value={String(metrics.total)} />
                <MetricCard label="Expired" value={String(metrics.expired)} tone="danger" />
                <MetricCard label="Low stock" value={String(metrics.lowStock)} tone="warning" />
                <MetricCard label="Archived" value={String(metrics.archived)} tone="neutral" />
              </View>
            </View>

            <View style={styles.heroActions}>
              <AppButton
                label="Expiry alerts"
                variant="secondary"
                onPress={() => router.push(appRoutes.medicineExpiry as Href)}
              />
              {permissions.canCreate ? (
                <AppButton
                  label="Add medicine"
                  variant="success"
                  onPress={() => router.push(appRoutes.medicineAdd as Href)}
                />
              ) : null}
            </View>
          </View>
        </AppCard>

        <AppCard variant="subtle">
          <View style={styles.filterBlock}>
            <AppTextField
              label="Search medicines"
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by name, brand, category, supplier, or batch"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
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

            <View style={[styles.dropdownGrid, responsive.isMdUp && styles.dropdownGridWide]}>
              <FilterDropdown
                label="Category"
                placeholder="All categories"
                options={categoryOptions}
                value={categoryFilter}
                onSelect={setCategoryFilter}
              />
              <FilterDropdown
                label="Supplier"
                placeholder="All suppliers"
                options={supplierOptions}
                value={supplierFilter}
                onSelect={setSupplierFilter}
              />
              <FilterDropdown
                label="Expiry status"
                placeholder="All expiry states"
                options={EXPIRY_FILTERS}
                value={expiryFilter}
                onSelect={setExpiryFilter}
              />
              <FilterDropdown
                label="Stock level"
                placeholder="All stock levels"
                options={STOCK_FILTERS}
                value={stockFilter}
                onSelect={setStockFilter}
              />
              <FilterDropdown
                label="Sort"
                placeholder="Newest updated"
                options={SORT_OPTIONS}
                value={sortValue}
                onSelect={setSortValue}
              />
            </View>

            <View style={[styles.quickRow, !responsive.isMdUp && styles.stackColumn]}>
              <AppButton
                label="Reset filters"
                variant="secondary"
                onPress={() => {
                  setSearchText('');
                  setStatusFilter('active');
                  setCategoryFilter('');
                  setSupplierFilter('');
                  setExpiryFilter('');
                  setStockFilter('');
                  setSortValue(SORT_OPTIONS[0].value);
                }}
                style={styles.quickButton}
              />
              <AppButton
                label="View expiry queue"
                variant="secondary"
                onPress={() => router.push(appRoutes.medicineExpiry as Href)}
                style={styles.quickButton}
              />
            </View>
          </View>
        </AppCard>

        <View style={styles.metaStrip}>
          <AppText variant="caption">
            {meta?.total ?? items.length} medicines
            {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
            {categoryFilter ? ` in ${categoryFilter}` : ''}
            {supplierFilter ? ` from ${supplierFilter}` : ''}
            {statusFilter ? ` with status ${STATUS_FILTERS.find((filter) => filter.value === statusFilter)?.label}` : ''}.
          </AppText>
        </View>

        {medicinesQuery.error ? (
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
              {getErrorMessage(medicinesQuery.error, 'Unable to refresh the medicine list right now.')}
            </AppText>
          </View>
        ) : null}

        {!items.length ? (
          <EmptyState
            icon="medkit-outline"
            title="No medicines found"
            message={
              debouncedSearch ||
              categoryFilter ||
              supplierFilter ||
              expiryFilter ||
              stockFilter ||
              statusFilter !== 'active'
                ? 'Try another search term or clear some filters to broaden the result set.'
                : 'Start by adding a medicine and its opening stock so the catalog is ready for dispensing.'
            }
            actionLabel={permissions.canCreate ? 'Add medicine' : undefined}
            onAction={
              permissions.canCreate
                ? () => router.push(appRoutes.medicineAdd as Href)
                : undefined
            }
          />
        ) : responsive.isMdUp ? (
          <MedicineTable
            items={items}
            permissions={permissions}
            onOpen={(id) => router.push(`/(tabs)/medicines/${id}` as Href)}
            onEdit={(id) => router.push(`/(tabs)/medicines/edit/${id}` as Href)}
          />
        ) : (
          <View style={styles.mobileList}>
            {items.map((item, index) => (
              <MobileMedicineCard
                key={`${item.id}-${index}`}
                item={item}
                permissions={permissions}
                onOpen={() => router.push(`/(tabs)/medicines/${item.id}` as Href)}
                onEdit={() => router.push(`/(tabs)/medicines/edit/${item.id}` as Href)}
              />
            ))}
          </View>
        )}

        {medicinesQuery.hasNextPage ? (
          <AppButton
            label={medicinesQuery.isFetchingNextPage ? 'Loading more' : 'Load more medicines'}
            variant="secondary"
            loading={medicinesQuery.isFetchingNextPage}
            onPress={() => {
              void medicinesQuery.fetchNextPage();
            }}
          />
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

function MedicineTable({
  items,
  permissions,
  onOpen,
  onEdit,
}: {
  items: MedicineItem[];
  permissions: ReturnType<typeof getMedicinePermissions>;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const theme = useAppTheme();

  return (
    <AppCard
      variant="subtle"
      contentStyle={styles.tableShell}
      style={{ borderColor: `${theme.colors.success}22`, borderWidth: 1 }}
    >
      <View
        style={[
          styles.tableHeader,
          {
            backgroundColor: `${theme.colors.success}10`,
            borderColor: `${theme.colors.success}20`,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <HeaderCell label="Medicine" flex={2.5} />
        <HeaderCell label="Category" flex={1.1} />
        <HeaderCell label="Supplier" flex={1.2} />
        <HeaderCell label="Stock" flex={1.1} />
        <HeaderCell label="Price" flex={1} />
        <HeaderCell label="Expiry" flex={1.2} />
        <HeaderCell label="Actions" flex={1.55} align="right" />
      </View>

      {items.map((item, index) => (
        <MedicineTableRow
          key={`${item.id}-${index}`}
          item={item}
          permissions={permissions}
          onOpen={() => onOpen(item.id)}
          onEdit={() => onEdit(item.id)}
        />
      ))}
    </AppCard>
  );
}

function MedicineTableRow({
  item,
  permissions,
  onOpen,
  onEdit,
}: {
  item: MedicineItem;
  permissions: ReturnType<typeof getMedicinePermissions>;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const theme = useAppTheme();
  const archiveMutation = useArchiveMedicine(item.id);
  const restoreMutation = useRestoreMedicine(item.id);
  const quantity =
    item.stockQty ?? item.quantity ?? item.stock ?? item.inventorySnapshot?.stockOnHand ?? 0;
  const actionError = archiveMutation.error || restoreMutation.error;

  return (
    <View
      style={[
        styles.tableRow,
        {
          borderBottomColor: theme.colors.borderSoft,
          opacity: item.isDeleted ? 0.72 : 1,
        },
      ]}
    >
      <Cell flex={2.5}>
        <AppText variant="label">{getMedicineDisplayName(item)}</AppText>
        <AppText variant="caption">{getMedicineIdentityLine(item)}</AppText>
        <AppText variant="caption">{item.medicineId || 'No ID'}</AppText>
      </Cell>
      <Cell flex={1.1}>
        <AppText>{item.category || 'General'}</AppText>
      </Cell>
      <Cell flex={1.2}>
        <AppText>{item.supplier || 'Not set'}</AppText>
      </Cell>
      <Cell flex={1.1}>
        <AppText variant="label">{String(quantity)}</AppText>
        <StockBadge status={item.stockStatus} />
      </Cell>
      <Cell flex={1}>
        <AppText>{formatMedicineCurrency(item.unitPrice)}</AppText>
      </Cell>
      <Cell flex={1.2}>
        <AppText>{formatMedicineDate(item.expiryDate || item.inventorySnapshot?.nextExpiryDate)}</AppText>
        <MedicineExpiryBadge medicine={item} />
      </Cell>
      <Cell flex={1.55} align="right">
        <View style={styles.rowActions}>
          <RowActionButton icon="eye-outline" label="View" onPress={onOpen} tone="neutral" />
          {!item.isDeleted && permissions.canEdit ? (
            <RowActionButton
              icon="create-outline"
              label="Edit"
              onPress={onEdit}
              tone="success"
            />
          ) : null}
          {!item.isDeleted && permissions.canArchive ? (
            <RowActionButton
              icon="archive-outline"
              label="Archive"
              loading={archiveMutation.isPending}
              onPress={() => {
                void archiveMutation.mutateAsync();
              }}
              tone="danger"
            />
          ) : null}
          {item.isDeleted && permissions.canRestore ? (
            <RowActionButton
              icon="refresh-outline"
              label="Restore"
              loading={restoreMutation.isPending}
              onPress={() => {
                void restoreMutation.mutateAsync();
              }}
              tone="success"
            />
          ) : null}
        </View>
        {actionError ? (
          <AppText variant="caption" style={{ color: theme.colors.danger, textAlign: 'right' }}>
            {getErrorMessage(actionError, 'Action failed')}
          </AppText>
        ) : null}
      </Cell>
    </View>
  );
}

function MobileMedicineCard({
  item,
  permissions,
  onOpen,
  onEdit,
}: {
  item: MedicineItem;
  permissions: ReturnType<typeof getMedicinePermissions>;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const theme = useAppTheme();
  const archiveMutation = useArchiveMedicine(item.id);
  const restoreMutation = useRestoreMedicine(item.id);
  const actionError = archiveMutation.error || restoreMutation.error;

  return (
    <View style={styles.mobileCard}>
      <MedicineListItem item={item} onPress={onOpen} />
      <View style={styles.mobileActions}>
        <AppButton label="View" variant="secondary" onPress={onOpen} style={styles.flexButton} />
        {!item.isDeleted && permissions.canEdit ? (
          <AppButton
            label="Edit"
            variant="success"
            onPress={onEdit}
            style={styles.flexButton}
          />
        ) : null}
        {!item.isDeleted && permissions.canArchive ? (
          <AppButton
            label="Archive"
            variant="destructive"
            loading={archiveMutation.isPending}
            onPress={() => {
              void archiveMutation.mutateAsync();
            }}
            style={styles.flexButton}
          />
        ) : null}
        {item.isDeleted && permissions.canRestore ? (
          <AppButton
            label="Restore"
            variant="success"
            loading={restoreMutation.isPending}
            onPress={() => {
              void restoreMutation.mutateAsync();
            }}
            style={styles.flexButton}
          />
        ) : null}
      </View>
      {actionError ? (
        <AppText variant="caption" style={{ color: theme.colors.danger }}>
          {getErrorMessage(actionError, 'Action failed')}
        </AppText>
      ) : null}
    </View>
  );
}

function FilterDropdown({
  label,
  placeholder,
  options,
  value,
  onSelect,
}: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const selectedLabel =
    options.find((option) => option.value === value)?.label || placeholder;

  return (
    <View style={styles.dropdownField}>
      <AppText variant="caption" style={styles.dropdownLabel}>
        {label}
      </AppText>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.dropdownTrigger,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <AppText numberOfLines={1} style={{ flex: 1 }}>
          {selectedLabel}
        </AppText>
        <Ionicons color={theme.colors.primary} name="chevron-down-outline" size={18} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.borderStrong,
                borderRadius: theme.radius.lg,
                shadowColor: theme.colors.shadowStrong,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText variant="subtitle">{label}</AppText>
              <AppText variant="caption">Choose a filter option</AppText>
            </View>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalOptions}>
                {options.map((option) => {
                  const active = option.value === value;
                  return (
                    <Pressable
                      key={`${label}-${option.value || 'all'}`}
                      onPress={() => {
                        onSelect(option.value);
                        setOpen(false);
                      }}
                      style={[
                        styles.modalOption,
                        {
                          backgroundColor: active ? theme.colors.primarySoft : theme.colors.surfaceMuted,
                          borderColor: active ? `${theme.colors.primary}35` : theme.colors.borderSoft,
                          borderRadius: theme.radius.md,
                        },
                      ]}
                    >
                      <AppText
                        variant="label"
                        style={{ color: active ? theme.colors.primary : theme.colors.text, flex: 1 }}
                      >
                        {option.label}
                      </AppText>
                      {active ? (
                        <Ionicons color={theme.colors.primary} name="checkmark-outline" size={18} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MetricCard({
  label,
  value,
  tone = 'success',
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const theme = useAppTheme();
  const color =
    tone === 'danger'
      ? theme.colors.danger
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'neutral'
          ? theme.colors.primary
          : theme.colors.success;

  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: `${color}12`,
          borderColor: `${color}24`,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <AppText variant="caption">{label}</AppText>
      <AppText variant="subtitle" style={{ color }}>
        {value}
      </AppText>
    </View>
  );
}

function HeaderCell({
  label,
  flex,
  align = 'left',
}: {
  label: string;
  flex: number;
  align?: 'left' | 'right';
}) {
  return (
    <View style={[styles.headerCell, { flex, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }]}>
      <AppText variant="label">{label}</AppText>
    </View>
  );
}

function Cell({
  children,
  flex,
  align = 'left',
}: React.PropsWithChildren<{ flex: number; align?: 'left' | 'right' }>) {
  return (
    <View style={[styles.cell, { flex, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }]}>
      {children}
    </View>
  );
}

function StockBadge({ status }: { status?: MedicineItem['stockStatus'] }) {
  const theme = useAppTheme();
  const label = getStockStatusLabel(status);
  const color =
    status === 'out_of_stock'
      ? theme.colors.danger
      : status === 'low_stock'
        ? theme.colors.warning
        : theme.colors.success;

  return (
    <View
      style={[
        styles.stockBadge,
        {
          backgroundColor: `${color}12`,
          borderColor: `${color}28`,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <AppText variant="caption" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

function RowActionButton({
  icon,
  label,
  loading = false,
  onPress,
  tone,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  loading?: boolean;
  onPress: () => void;
  tone: 'success' | 'danger' | 'neutral';
}) {
  const theme = useAppTheme();
  const color =
    tone === 'danger'
      ? theme.colors.danger
      : tone === 'success'
        ? theme.colors.success
        : theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[
        styles.rowActionButton,
        {
          backgroundColor: `${color}12`,
          borderColor: `${color}28`,
          borderRadius: theme.radius.md,
          opacity: loading ? 0.7 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons color={color} name={icon} size={16} />
      )}
      <AppText variant="caption" style={{ color }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 24,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'space-between',
  },
  stackColumn: {
    flexDirection: 'column',
  },
  heroCopy: {
    flex: 1,
    gap: 10,
  },
  heroActions: {
    alignItems: 'stretch',
    gap: 10,
    minWidth: 196,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    borderWidth: 1,
    gap: 4,
    minWidth: 110,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterBlock: {
    gap: 14,
  },
  chipRow: {
    gap: 10,
  },
  dropdownGrid: {
    gap: 12,
  },
  dropdownGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dropdownField: {
    flex: 1,
    minWidth: 180,
  },
  dropdownLabel: {
    fontWeight: '700',
    marginBottom: 8,
  },
  dropdownTrigger: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderWidth: 1,
    maxWidth: 420,
    padding: 18,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: '100%',
  },
  modalHeader: {
    gap: 4,
    marginBottom: 14,
  },
  modalOptions: {
    gap: 8,
  },
  modalOption: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickButton: {
    flex: 1,
  },
  metaStrip: {
    paddingHorizontal: 6,
  },
  errorBox: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tableShell: {
    gap: 0,
    padding: 0,
  },
  tableHeader: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerCell: {
    minWidth: 0,
  },
  tableRow: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  cell: {
    gap: 6,
    minWidth: 0,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  rowActionButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stockBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mobileList: {
    gap: 12,
  },
  mobileCard: {
    gap: 10,
  },
  mobileActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
});
