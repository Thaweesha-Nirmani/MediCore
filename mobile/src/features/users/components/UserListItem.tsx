import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';

import {
  formatUserLastLogin,
  formatUserRole,
  formatUserStatus,
  getUserMetaLine,
  getUserStatusColor,
} from '@/features/users/utils/user-display';

import type { UserItem } from '@/features/users/types';

type UserListItemProps = {
  item: UserItem;
  onPress?: () => void;
};

export function UserListItem({ item, onPress }: UserListItemProps) {
  const theme = useAppTheme();
  const statusLabel = formatUserStatus(item.status);
  const statusColor = getUserStatusColor(item.status, {
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
  });

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceStrong,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <AppText variant="subtitle">{item.name}</AppText>
          <AppText variant="caption">{item.email}</AppText>
        </View>
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

      <View style={styles.identityRow}>
        <View
          style={[
            styles.identityPill,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.borderSoft,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="caption">{formatUserRole(item.role)}</AppText>
        </View>
        <View
          style={[
            styles.identityPill,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.borderSoft,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="caption">{getUserMetaLine(item)}</AppText>
        </View>
      </View>

      <View style={styles.metaBlock}>
        <AppText variant="caption">Last login</AppText>
        <AppText>{formatUserLastLogin(item.lastLogin)}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    gap: 10,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.12,
    shadowRadius: 22,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  identityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  identityPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaBlock: {
    gap: 3,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
