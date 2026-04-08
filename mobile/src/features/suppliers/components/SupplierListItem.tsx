import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';

import {
  formatSupplierAddress,
  formatSupplierStatus,
  getSupplierContactLine,
} from '@/features/suppliers/utils/supplier-display';

import type { SupplierItem } from '@/features/suppliers/types';

type SupplierListItemProps = {
  item: SupplierItem;
  onPress?: () => void;
};

export function SupplierListItem({ item, onPress }: SupplierListItemProps) {
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const status = formatSupplierStatus(item.status);
  const statusColor =
    status === 'Archived'
      ? theme.colors.danger
      : status === 'Inactive'
        ? theme.colors.warning
        : theme.colors.success;

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
      <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
        <View style={styles.titleBlock}>
          <AppText variant="subtitle">{item.name}</AppText>
          <AppText variant="caption">{getSupplierContactLine(item)}</AppText>
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
            {status}
          </AppText>
        </View>
      </View>

      <View style={styles.identityRow}>
        {item.contactNumber || item.contact ? (
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
            <AppText variant="caption">{item.contactNumber || item.contact}</AppText>
          </View>
        ) : null}
        {item.email ? (
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
            <AppText variant="caption">{item.email}</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.metaBlock}>
        <AppText variant="caption">Address</AppText>
        <AppText>{formatSupplierAddress(item)}</AppText>
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
  stackColumn: {
    flexDirection: 'column',
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
