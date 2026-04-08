import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';

import {
  formatReviewDate,
  formatReviewModule,
  formatReviewStatus,
  getReviewOwnerLine,
  getReviewStatusColor,
} from '@/features/reviews/utils/review-display';

import type { ReviewItem } from '@/features/reviews/types';

type ReviewListItemProps = {
  item: ReviewItem;
  onPress?: () => void;
};

export function ReviewListItem({ item, onPress }: ReviewListItemProps) {
  const theme = useAppTheme();
  const statusLabel = formatReviewStatus(item.status);
  const statusColor = getReviewStatusColor(item.status, {
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
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
          <AppText variant="subtitle">{item.title}</AppText>
          <AppText variant="caption">{getReviewOwnerLine(item)}</AppText>
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
          <AppText variant="caption">{formatReviewModule(item.moduleSource)}</AppText>
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
          <View style={styles.ratingRow}>
            <Ionicons color={theme.colors.warning} name="star" size={14} />
            <AppText variant="caption">{item.rating.toFixed(1)}</AppText>
          </View>
        </View>
        {item.mine ? (
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
            <AppText variant="caption">Mine</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.metaBlock}>
        <AppText numberOfLines={3}>{item.content}</AppText>
        <AppText variant="caption">Updated {formatReviewDate(item.updatedAt || item.createdAt)}</AppText>
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
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  metaBlock: {
    gap: 6,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
