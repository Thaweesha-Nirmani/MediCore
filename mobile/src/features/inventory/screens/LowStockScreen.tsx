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

import { LowStockAlertItem } from '@/features/inventory/components/LowStockAlertItem';
import { useLowStock } from '@/features/inventory/hooks/useInventory';
import { getInventoryPermissions } from '@/features/inventory/utils/inventory-access';

export function LowStockScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthSession();
  const permissions = getInventoryPermissions(user?.role);
  const lowStockQuery = useLowStock();

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to view low stock alerts."
      />
    );
  }

  if (lowStockQuery.isLoading) {
    return (
      <LoadingState
        title="Loading low stock"
        message="Checking medicine thresholds and available stock across batches."
      />
    );
  }

  if (lowStockQuery.isError || !lowStockQuery.data) {
    return (
      <ErrorState
        title="Low stock unavailable"
        message="We couldn't load low stock alerts right now."
        actionLabel="Back to inventory"
        onAction={() => router.replace(appRoutes.inventory as Href)}
      />
    );
  }

  const { items, summary } = lowStockQuery.data;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
        </View>

        <AppCard variant="hero">
          <View style={styles.copyBlock}>
            <AppText variant="caption">Low stock</AppText>
            <AppText variant="title">Critical inventory alerts</AppText>
            <AppText>
              Surface shortage pressure early so pharmacy staff can replenish before stock blocks
              dispensing.
            </AppText>
          </View>
        </AppCard>

        <View style={styles.summaryGrid}>
          <SummaryCard icon="warning-outline" label="Alerts" value={summary.totalAlerts} tone="warning" />
          <SummaryCard icon="alert-circle-outline" label="Critical" value={summary.critical} tone="warning" />
          <SummaryCard icon="close-circle-outline" label="Out of stock" value={summary.outOfStock} tone="danger" />
        </View>

        <AppCard variant="subtle">
          <View style={styles.inlineGuide}>
            <Ionicons color={theme.colors.primary} name="information-circle-outline" size={18} />
            <AppText variant="caption" style={{ flex: 1 }}>
              Low-stock alerts combine medicine threshold awareness with linked batch visibility.
            </AppText>
          </View>
        </AppCard>

        <View style={styles.list}>
          {items.length ? (
            items.map((item) => (
              <LowStockAlertItem
                key={item.medicine?.id || item.medicine?.medicineId || `${item.threshold}`}
                item={item}
                onPress={() =>
                  item.medicine?.id
                    ? router.push(`/(tabs)/inventory/medicine/${item.medicine.id}` as Href)
                    : undefined
                }
              />
            ))
          ) : (
            <AppCard variant="subtle">
              <AppText>No low stock alerts right now.</AppText>
            </AppCard>
          )}
        </View>
      </ScrollView>
    </AppScreen>
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
  tone: 'warning' | 'danger';
}) {
  const theme = useAppTheme();
  const color = tone === 'danger' ? theme.colors.danger : theme.colors.warning;

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
  list: {
    gap: 12,
  },
});
