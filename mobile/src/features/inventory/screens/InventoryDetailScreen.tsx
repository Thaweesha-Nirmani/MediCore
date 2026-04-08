import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
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

import { InventoryStatusBadge } from '@/features/inventory/components/InventoryStatusBadge';
import { useInventoryItem } from '@/features/inventory/hooks/useInventory';
import { getInventoryPermissions } from '@/features/inventory/utils/inventory-access';
import {
  formatInventoryCurrency,
  formatInventoryDate,
  getExpirySignal,
  getInventoryDisplayName,
  getInventoryIdentityLine,
  getInventoryTagValues,
} from '@/features/inventory/utils/inventory-display';

export function InventoryDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthSession();
  const permissions = getInventoryPermissions(user?.role);
  const inventoryQuery = useInventoryItem(params.id);

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to open inventory details."
      />
    );
  }

  if (inventoryQuery.isLoading) {
    return (
      <LoadingState
        title="Loading batch"
        message="Fetching the latest stock, quantity, and expiry details."
      />
    );
  }

  if (inventoryQuery.isError || !inventoryQuery.data) {
    return (
      <ErrorState
        title="Batch unavailable"
        message="We couldn't load this stock batch right now."
        actionLabel="Back to inventory"
        onAction={() => router.replace(appRoutes.inventory as Href)}
      />
    );
  }

  const batch = inventoryQuery.data;
  const tags = getInventoryTagValues(batch);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
          {permissions.canManage ? (
            <AppButton
              label="Adjust stock"
              onPress={() => router.push(`/(tabs)/inventory/adjust/${batch.id}` as Href)}
            />
          ) : null}
        </View>

        <AppCard variant="hero">
          <View style={styles.hero}>
            <AppText variant="caption">Batch detail</AppText>
            <AppText variant="title">{getInventoryDisplayName(batch)}</AppText>
            <AppText>{getInventoryIdentityLine(batch)}</AppText>

            <View style={styles.chipRow}>
              <IdentityChip icon="pricetag-outline" label={batch.batchNumber || 'No batch'} />
              <IdentityChip icon="location-outline" label={batch.location || 'MAIN_STORE'} />
              {tags.map((tag) => (
                <IdentityChip key={tag} icon="ellipse-outline" label={tag} />
              ))}
            </View>

            <View style={styles.heroMetrics}>
              <HeroMetric label="On hand" value={String(batch.quantity)} emphasize />
              <HeroMetric label="Available" value={String(batch.availableQuantity)} />
              <HeroMetric label="Expiry" value={getExpirySignal(batch)} />
            </View>

            <InventoryStatusBadge status={batch.stockStatus} />
          </View>
        </AppCard>

        <InfoSection title="Quantity and control" subtitle="Use this section to verify safe stock levels before any adjustment.">
          <DetailField label="Quantity" value={String(batch.quantity)} />
          <DetailField label="Available" value={String(batch.availableQuantity)} />
          <DetailField label="Reorder level" value={String(batch.reorderLevel ?? 0)} />
          <DetailField label="Status" value={batch.stockStatus || 'Available'} />
        </InfoSection>

        <InfoSection title="Batch and expiry" subtitle="Batch identity and expiry visibility for safe inventory handling.">
          <DetailField label="Expiry date" value={formatInventoryDate(batch.expiryDate)} />
          <DetailField label="Manufacture date" value={formatInventoryDate(batch.manufactureDate)} />
          <DetailField label="Days to expire" value={batch.daysToExpire == null ? 'N/A' : String(batch.daysToExpire)} />
          <DetailField label="Supplier" value={batch.supplierId || 'Not set'} />
        </InfoSection>

        <InfoSection title="Pricing" subtitle="Batch-level purchasing and selling references.">
          <DetailField label="Purchase price" value={formatInventoryCurrency(batch.purchasePrice)} />
          <DetailField
            label="Selling price"
            value={
              batch.sellingPrice === null || batch.sellingPrice === undefined
                ? 'Not set'
                : formatInventoryCurrency(batch.sellingPrice)
            }
          />
        </InfoSection>

        <AppCard variant="subtle">
          <View style={styles.sectionHeader}>
            <AppText variant="subtitle">Related actions</AppText>
            <AppText variant="caption">
              Review movement history or all batches for the same medicine.
            </AppText>
          </View>
          <View style={styles.actionStack}>
            <AppButton
              label="View movement history"
              variant="secondary"
              onPress={() =>
                router.push(`/(tabs)/inventory/movements?inventoryId=${batch.id}` as Href)
              }
            />
            <AppButton
              label="View all batches for this medicine"
              variant="secondary"
              onPress={() => router.push(`/(tabs)/inventory/medicine/${batch.medicineId}` as Href)}
            />
          </View>
        </AppCard>

        {batch.notes ? (
          <AppCard variant="subtle">
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle">Notes</AppText>
            </View>
            <AppText>{batch.notes}</AppText>
          </AppCard>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

function InfoSection({
  title,
  subtitle,
  children,
}: React.PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <AppCard variant="subtle">
      <View style={styles.sectionHeader}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText variant="caption">{subtitle}</AppText>
      </View>
      <View style={styles.infoGrid}>{children}</View>
    </AppCard>
  );
}

function HeroMetric({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.heroMetric,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.borderSoft,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <AppText variant="caption">{label}</AppText>
      <AppText variant={emphasize ? 'title' : 'subtitle'}>{value}</AppText>
    </View>
  );
}

function IdentityChip({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.identityChip,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.borderStrong,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <Ionicons color={theme.colors.primary} name={icon} size={14} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <AppText variant="caption">{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  hero: {
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  identityChip: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroMetric: {
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 94,
    padding: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoBlock: {
    flexBasis: '47%',
    gap: 4,
  },
  actionStack: {
    gap: 10,
  },
});
