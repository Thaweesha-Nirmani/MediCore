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
import { getRoleLabel } from '@/constants/auth';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { UserListItem } from '@/features/users/components/UserListItem';
import { useUsersList } from '@/features/users/hooks/useUsers';
import { getUserPermissions } from '@/features/users/utils/user-access';
import { formatUserStatus } from '@/features/users/utils/user-display';
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '@/features/users/utils/user-form';

import type { UserItem, UserListQuery } from '@/features/users/types';

const STATUS_FILTERS: Array<{
  label: string;
  value: NonNullable<UserListQuery['status']> | '';
}> = [{ label: 'All', value: '' }].concat(
  USER_STATUS_OPTIONS.map((value) => ({
    label: formatUserStatus(value),
    value,
  }))
);

const ROLE_FILTERS: Array<{
  label: string;
  value: NonNullable<UserListQuery['role']> | '';
}> = [{ label: 'All roles', value: '' }].concat(
  USER_ROLE_OPTIONS.map((value) => ({
    label: getRoleLabel(value),
    value,
  }))
);

export function UsersListScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const permissions = getUserPermissions(user?.role, user?.id, user?.id);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('');
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]['value']>('');
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  const usersQuery = useUsersList({
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    role: roleFilter || undefined,
    sortBy: debouncedSearch ? 'name' : 'createdAt',
    sortOrder: debouncedSearch ? 'asc' : 'desc',
  });

  const users = useMemo(
    () => usersQuery.data?.pages.flatMap((page) => page.items) || [],
    [usersQuery.data]
  );
  const meta = usersQuery.data?.pages[0]?.meta;
  const activeCount = useMemo(
    () => users.filter((item) => String(item.status).toLowerCase() === 'active').length,
    [users]
  );
  const pendingCount = useMemo(
    () => users.filter((item) => String(item.status).toLowerCase() === 'pending').length,
    [users]
  );

  if (!permissions.canManage) {
    return (
      <ErrorState
        title="Access restricted"
        message="Only administrators can manage staff records on mobile."
        actionLabel="Back to More"
        onAction={() => router.replace(appRoutes.more as Href)}
      />
    );
  }

  function openUser(id: string) {
    router.push(`/(tabs)/more/users/${id}` as Href);
  }

  function renderUser({ item }: { item: UserItem }) {
    return <UserListItem item={item} onPress={() => openUser(item.id)} />;
  }

  const listHeader = (
    <View style={styles.headerContainer}>
      <AppCard variant="hero">
        <View style={styles.heroBlock}>
          <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
            <View style={styles.titleBlock}>
              <AppText variant="caption">Staff management</AppText>
              <AppText variant="title">People, roles, and account status</AppText>
              <AppText>
                Review staff access, update profile details, and keep role visibility aligned with
                the web reference.
              </AppText>
            </View>
            <AppButton label="Add staff" onPress={() => router.push(appRoutes.userAdd as Href)} />
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
              <AppText variant="subtitle">{users.length}</AppText>
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
              <AppText variant="caption">Pending</AppText>
              <AppText variant="subtitle">{pendingCount}</AppText>
            </View>
          </View>
        </View>
      </AppCard>

      <AppCard variant="subtle">
        <AppTextField
          label="Search staff"
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search name, email, phone, or user ID"
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {ROLE_FILTERS.map((filter) => (
            <InventoryFilterChip
              key={filter.value || 'all-role'}
              label={filter.label}
              active={roleFilter === filter.value}
              onPress={() => setRoleFilter(filter.value)}
            />
          ))}
        </ScrollView>
      </AppCard>

      {meta ? (
        <View style={styles.metaStrip}>
          <AppText variant="caption">
            {meta.total} staff records
            {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
            {statusFilter ? ` in ${formatUserStatus(statusFilter)}` : ''}.
          </AppText>
        </View>
      ) : null}

      {usersQuery.error ? (
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
            {getErrorMessage(usersQuery.error, 'Unable to load staff records right now.')}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  const listEmpty = usersQuery.isLoading ? (
    <View style={styles.stateBox}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <AppText>Loading staff records...</AppText>
    </View>
  ) : (
    <EmptyState
      icon="people-circle-outline"
      title="No staff records found"
      message={
        debouncedSearch || statusFilter || roleFilter
          ? 'Try another search term or clear the filters.'
          : 'Add the first staff member to begin managing mobile-visible roles.'
      }
      actionLabel="Add staff"
      onAction={() => router.push(appRoutes.userAdd as Href)}
    />
  );

  return (
    <AppScreen contentWidth="wide">
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={() => {
          if (usersQuery.hasNextPage && !usersQuery.isFetchingNextPage) {
            void usersQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={usersQuery.isRefetching}
            onRefresh={() => {
              void usersQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={
          usersQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <AppText variant="caption">Loading more staff...</AppText>
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
