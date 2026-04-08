import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { AppScreen } from '@/components/layout/AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useAppTheme } from '@/theme/useAppTheme';

import { InventoryBatchItem } from '@/features/inventory/components/InventoryBatchItem';
import { useExpiryInventory } from '@/features/inventory/hooks/useInventory';
import { getInventoryPermissions } from '@/features/inventory/utils/inventory-access';
import type { InventoryBatch } from '@/features/inventory/types';

export function ExpiryStockScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthSession();
  const permissions = getInventoryPermissions(user?.role);
  const expiryQuery = useExpiryInventory();

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to view expiry stock."
      />
    );
  }

  if (expiryQuery.isLoading) {
    return (
      <LoadingState
        title="Loading expiry stock"
        message="Reviewing batches that are expired or expiring soon."
      />
    );
  }

  if (expiryQuery.isError || !expiryQuery.data) {
    return (
      <ErrorState
        title="Expiry view unavailable"
        message="We couldn't load the expiry stock view right now."
        actionLabel="Back to inventory"
        onAction={() => router.replace(appRoutes.inventory as Href)}
      />
    );
  }

  const { expired, expiringIn7Days, expiringIn30Days, summary } = expiryQuery.data;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
        </View>

        <AppCard variant="hero">
          <View style={styles.copyBlock}>
            <AppText variant="caption">Expiry stock</AppText>
            <AppText variant="title">Monitor expiring batches</AppText>
            <AppText>
              Keep expiry risk visible at the batch level so disposal, transfer, and replenishment
              decisions are safer.
            </AppText>
          </View>
        </AppCard>

        <View style={styles.summaryGrid}>
          <SummaryCard icon="alert-circle-outline" label="Expired" value={summary.expired} tone="danger" />
          <SummaryCard icon="timer-outline" label="Next 7 days" value={summary.expiringIn7Days} tone="warning" />
          <SummaryCard icon="calendar-outline" label="Next 30 days" value={summary.expiringIn30Days} tone="info" />
        </View>

        <AppCard variant="subtle">
          <View style={styles.inlineGuide}>
            <Ionicons color={theme.colors.primary} name="shield-checkmark-outline" size={18} />
            <AppText variant="caption" style={{ flex: 1 }}>
              Expiry views are ordered for action priority: expired first, then 7-day, then 30-day risk.
            </AppText>
          </View>
        </AppCard>

        <ExpirySection title="Expired" items={expired} onOpen={(id) => router.push(`/(tabs)/inventory/${id}` as Href)} />
        <ExpirySection
          title="Expiring in 7 days"
          items={expiringIn7Days}
          onOpen={(id) => router.push(`/(tabs)/inventory/${id}` as Href)}
        />
        <ExpirySection
          title="Expiring in 30 days"
          items={expiringIn30Days}
          onOpen={(id) => router.push(`/(tabs)/inventory/${id}` as Href)}
        />
      </ScrollView>
    </AppScreen>
  );
}

function ExpirySection({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: InventoryBatch[];
  onOpen: (id: string) => void;
}) {
  return (
    <AppCard variant="subtle">
      <View style={styles.sectionHeader}>
        <AppText variant="subtitle">{title}</AppText>
      </View>
      {items.length ? (
        <View style={styles.list}>
          {items.map((item) => (
            <InventoryBatchItem key={item.id} item={item} onPress={() => onOpen(item.id)} />
          ))}
        </View>
      ) : (
        <AppText>No batches in this expiry window.</AppText>
      )}
    </AppCard>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number;
  tone: 'danger' | 'warning' | 'info';
}) {
  const theme = useAppTheme();
  const color =
    tone === 'danger'
      ? theme.colors.danger
      : tone === 'warning'
        ? theme.colors.warning
        : theme.colors.primary;

  return (
    <AppCard style={styles.summaryCard}>
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor: `${color}14`,
            borderColor: `${color}30`,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Ionicons color={color} name={icon} size={18} />
      </View>
      <AppText variant="caption">{label}</AppText>
      <AppText variant="title">{String(value)}</AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyBlock: {
    gap: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: 96,
  },
  summaryIcon: {
    alignItems: 'center',
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  inlineGuide: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  sectionHeader: {
    gap: 4,
  },
  list: {
    gap: 12,
  },
});
