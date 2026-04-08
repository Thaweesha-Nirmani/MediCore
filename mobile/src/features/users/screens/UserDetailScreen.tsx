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

import { useUserDetail, useUpdateUserStatus } from '@/features/users/hooks/useUsers';
import { getUserPermissions } from '@/features/users/utils/user-access';
import {
  formatUserLastLogin,
  formatUserRole,
  formatUserStatus,
  getUserStatusColor,
} from '@/features/users/utils/user-display';
import { USER_STATUS_OPTIONS } from '@/features/users/utils/user-form';

export function UserDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();
  const userQuery = useUserDetail(params.id);
  const detail = userQuery.data;
  const permissions = getUserPermissions(user?.role, user?.id, params.id);
  const statusMutation = useUpdateUserStatus(params.id);

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="You do not have permission to view this staff profile."
        actionLabel="Back to More"
        onAction={() => router.replace(appRoutes.more as Href)}
      />
    );
  }

  if (userQuery.isLoading) {
    return (
      <AppScreen contentWidth="page">
        <View style={styles.stateBox}>
          <AppText>Loading staff profile...</AppText>
        </View>
      </AppScreen>
    );
  }

  if (userQuery.isError || !detail) {
    return (
      <ErrorState
        title="Staff profile unavailable"
        message={getErrorMessage(userQuery.error, "We couldn't load this staff record.")}
        actionLabel="Back to staff"
        onAction={() => router.replace(appRoutes.users as Href)}
      />
    );
  }

  const staff = detail;

  const statusLabel = formatUserStatus(staff.status);
  const statusColor = getUserStatusColor(staff.status, {
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
  });

  function confirmStatusChange(nextStatus: (typeof USER_STATUS_OPTIONS)[number]) {
    if (statusMutation.isPending || nextStatus === String(staff.status).toLowerCase()) {
      return;
    }

    const action = () => statusMutation.mutate({ status: nextStatus });
    const message =
      nextStatus === 'active'
        ? 'This will restore active access for this account.'
        : `This will change the account status to ${formatUserStatus(nextStatus).toLowerCase()}.`;

    if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
      if (globalThis.confirm(message)) {
        action();
      }
      return;
    }

    Alert.alert('Change account status', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: action },
    ]);
  }

  return (
    <AppScreen contentWidth="page">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
          {permissions.canManage ? (
            <AppButton
              label="Edit profile"
              onPress={() => router.push(`/(tabs)/more/users/edit/${staff.id}` as Href)}
            />
          ) : null}
        </View>

        <AppCard variant="hero">
          <View style={styles.heroBlock}>
            <View style={styles.heroHeader}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: staff.color || theme.colors.primary,
                    borderColor: theme.colors.borderStrong,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <AppText style={styles.avatarText}>{staff.initials || 'MC'}</AppText>
              </View>
              <View style={styles.heroCopy}>
                <AppText variant="caption">Staff profile</AppText>
                <AppText variant="title">{staff.name}</AppText>
                <AppText>{staff.email}</AppText>
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
                    {statusLabel}
                  </AppText>
                </View>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <AppText variant="caption">Role</AppText>
                <AppText variant="subtitle">{formatUserRole(staff.role)}</AppText>
              </View>
              <View style={styles.metricCard}>
                <AppText variant="caption">User ID</AppText>
                <AppText variant="subtitle">{staff.userId || 'Not assigned'}</AppText>
              </View>
              <View style={styles.metricCard}>
                <AppText variant="caption">Last login</AppText>
                <AppText variant="subtitle">{formatUserLastLogin(staff.lastLogin)}</AppText>
              </View>
            </View>
          </View>
        </AppCard>

        {statusMutation.error ? (
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
                {getErrorMessage(statusMutation.error, 'Unable to change account status.')}
              </AppText>
            </View>
          </AppCard>
        ) : null}

        {permissions.canUpdateStatus ? (
          <AppCard variant="subtle">
            <AppText variant="subtitle">Account status</AppText>
            <AppText variant="caption">
              Use status changes instead of deleting accounts so history remains traceable.
            </AppText>
            <View style={styles.chipRow}>
              {USER_STATUS_OPTIONS.map((status) => (
                <InventoryFilterChip
                  key={status}
                  label={formatUserStatus(status)}
                  active={String(staff.status).toLowerCase() === status}
                  onPress={() => confirmStatusChange(status)}
                />
              ))}
            </View>
          </AppCard>
        ) : null}

        <AppCard variant="subtle">
          <AppText variant="subtitle">Contact and audit</AppText>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Phone</AppText>
            <AppText>{staff.contactNumber || 'Not set'}</AppText>
          </View>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Created</AppText>
            <AppText>{formatUserLastLogin(staff.createdAt)}</AppText>
          </View>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Updated</AppText>
            <AppText>{formatUserLastLogin(staff.updatedAt)}</AppText>
          </View>
        </AppCard>
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
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 14,
  },
  avatar: {
    alignItems: 'center',
    borderWidth: 1,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flexBasis: '31.5%',
    gap: 4,
    minWidth: 0,
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
