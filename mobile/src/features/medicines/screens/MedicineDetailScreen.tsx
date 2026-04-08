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
import { getErrorMessage } from '@/utils/error';

import { MedicineExpiryBadge } from '@/features/medicines/components/MedicineExpiryBadge';
import {
  useArchiveMedicine,
  useMedicineDetail,
  useRestoreMedicine,
} from '@/features/medicines/hooks/useMedicines';
import { getMedicinePermissions } from '@/features/medicines/utils/medicine-access';
import {
  formatMedicineCurrency,
  formatMedicineDate,
  getExpiryStatusLabel,
  getMedicineDisplayName,
  getMedicineIdentityLine,
  getMedicineTagValues,
  getStockStatusLabel,
} from '@/features/medicines/utils/medicine-display';

export function MedicineDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthSession();
  const permissions = getMedicinePermissions(user?.role);
  const medicineQuery = useMedicineDetail(params.id);
  const archiveMutation = useArchiveMedicine(String(params.id || ''));
  const restoreMutation = useRestoreMedicine(String(params.id || ''));

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to open medicine details."
      />
    );
  }

  if (medicineQuery.isLoading) {
    return (
      <LoadingState
        title="Loading medicine"
        message="Fetching medicine, stock, and expiry data."
      />
    );
  }

  if (medicineQuery.isError || !medicineQuery.data) {
    return (
      <ErrorState
        title="Medicine unavailable"
        message="We couldn't load this medicine right now."
        actionLabel="Back to medicines"
        onAction={() => router.replace(appRoutes.medicines as Href)}
      />
    );
  }

  const medicine = medicineQuery.data;
  const tags = getMedicineTagValues(medicine);
  const quantity = medicine.inventorySnapshot?.stockOnHand ?? medicine.quantity ?? 0;
  const actionError = archiveMutation.error || restoreMutation.error;

  return (
    <AppScreen contentWidth="wide">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
          <View style={styles.actionRow}>
            {!medicine.isDeleted && permissions.canEdit ? (
              <AppButton
                label="Edit medicine"
                onPress={() => router.push(`/(tabs)/medicines/edit/${medicine.id}` as Href)}
                variant="success"
              />
            ) : null}
            {!medicine.isDeleted && permissions.canArchive ? (
              <AppButton
                label="Archive"
                variant="destructive"
                loading={archiveMutation.isPending}
                onPress={() => {
                  void archiveMutation.mutateAsync();
                }}
              />
            ) : null}
            {medicine.isDeleted && permissions.canRestore ? (
              <AppButton
                label="Restore"
                variant="success"
                loading={restoreMutation.isPending}
                onPress={() => {
                  void restoreMutation.mutateAsync();
                }}
              />
            ) : null}
          </View>
        </View>

        {actionError ? (
          <AppCard variant="subtle">
            <View
              style={[
                styles.feedbackRow,
                {
                  backgroundColor: `${theme.colors.danger}10`,
                  borderColor: `${theme.colors.danger}35`,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Ionicons color={theme.colors.danger} name="alert-circle-outline" size={18} />
              <View style={styles.feedbackCopy}>
                <AppText variant="label" style={{ color: theme.colors.danger }}>
                  Action failed
                </AppText>
                <AppText variant="caption">
                  {getErrorMessage(actionError, 'Unable to update this medicine action.')}
                </AppText>
              </View>
            </View>
          </AppCard>
        ) : null}

        <AppCard
          variant="hero"
          style={{ borderColor: `${theme.colors.success}30`, borderWidth: 1 }}
        >
          <View style={styles.hero}>
            <AppText variant="caption" style={{ color: theme.colors.success }}>
              Medicine details
            </AppText>
            <AppText variant="title">{getMedicineDisplayName(medicine)}</AppText>
            <AppText>{getMedicineIdentityLine(medicine)}</AppText>

            <View style={styles.chipRow}>
              <IdentityChip label={medicine.medicineId || 'No ID'} icon="pricetag-outline" />
              {tags.map((tag) => (
                <IdentityChip key={tag} label={tag} icon="leaf-outline" />
              ))}
              <IdentityChip label={medicine.barcode || 'No barcode'} icon="barcode-outline" />
              <IdentityChip
                label={medicine.isDeleted ? 'Archived' : medicine.status || 'Active'}
                icon={medicine.isDeleted ? 'archive-outline' : 'checkmark-circle-outline'}
              />
            </View>

            <View style={styles.heroMetrics}>
              <HeroMetric label="Unit price" value={formatMedicineCurrency(medicine.unitPrice)} />
              <HeroMetric label="Stock" value={`${quantity} units`} />
              <HeroMetric label="Stock status" value={getStockStatusLabel(medicine.stockStatus)} />
              <HeroMetric label="Next expiry" value={formatMedicineDate(medicine.expiryDate)} />
            </View>

            <View style={styles.heroBadges}>
              <StatusBadge label={getStockStatusLabel(medicine.stockStatus)} tone={medicine.stockStatus} />
              <MedicineExpiryBadge medicine={medicine} />
            </View>
          </View>
        </AppCard>

        <InfoSection title="Medicine identity" subtitle="Core fields used for searching, selection, and dispensing.">
          <DetailField label="Generic name" value={medicine.genericName || 'Not set'} />
          <DetailField label="Brand name" value={medicine.brandName || 'Not set'} />
          <DetailField label="Category" value={medicine.category || 'General'} />
          <DetailField label="Supplier" value={medicine.supplier || 'Not set'} />
          <DetailField label="Manufacturer" value={medicine.manufacturer || 'Not set'} />
          <DetailField label="Barcode" value={medicine.barcode || 'Not set'} />
        </InfoSection>

        <InfoSection title="Pricing and stock" subtitle="Medicine-level price with the initial stock-linked batch context.">
          <DetailField label="Medicine ID" value={medicine.medicineId || 'Not set'} />
          <DetailField label="Unit price" value={formatMedicineCurrency(medicine.unitPrice)} />
          <DetailField label="Stock quantity" value={`${quantity} units`} />
          <DetailField label="Stock status" value={getStockStatusLabel(medicine.stockStatus)} />
          <DetailField label="Batch number" value={medicine.batchNumber || 'Not set'} />
          <DetailField label="Status" value={medicine.isDeleted ? 'Archived' : medicine.status || 'Active'} />
        </InfoSection>

        <InfoSection title="Manufacture and expiry" subtitle="Dates that drive expiry alerts and stock safety.">
          <DetailField label="Manufacture date" value={formatMedicineDate(medicine.manufactureDate)} />
          <DetailField label="Expiry date" value={formatMedicineDate(medicine.expiryDate)} />
          <DetailField label="Expiry status" value={getExpiryStatusLabel(medicine)} />
          <DetailField label="Days to expiry" value={String(medicine.daysToExpire ?? 'N/A')} />
        </InfoSection>

        <InfoSection title="Description" subtitle="Short operational notes visible to pharmacy staff.">
          <View style={styles.descriptionBlock}>
            <AppText>{medicine.description || 'No description available.'}</AppText>
          </View>
        </InfoSection>

        <InfoSection title="Audit" subtitle="Record creation, update, and archive context.">
          <DetailField label="Created" value={formatMedicineDate(medicine.createdAt)} />
          <DetailField label="Updated" value={formatMedicineDate(medicine.updatedAt)} />
          <DetailField label="Deleted" value={formatMedicineDate(medicine.audit?.deletedAt)} />
          <View style={styles.auditRow}>
            <Ionicons color={theme.colors.mutedText} name="time-outline" size={16} />
            <AppText variant="caption">
              Audit trail entries: {medicine.audit?.auditTrailCount ?? medicine.auditTrail?.length ?? 0}
            </AppText>
          </View>
        </InfoSection>
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

function HeroMetric({ label, value }: { label: string; value: string }) {
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
      <AppText>{value}</AppText>
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
          borderColor: `${theme.colors.success}25`,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <Ionicons color={theme.colors.success} name={icon} size={14} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone?: 'available' | 'low_stock' | 'out_of_stock';
}) {
  const theme = useAppTheme();
  const color =
    tone === 'out_of_stock'
      ? theme.colors.danger
      : tone === 'low_stock'
        ? theme.colors.warning
        : theme.colors.success;

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: `${color}14`,
          borderColor: `${color}32`,
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
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  feedbackRow: {
    alignItems: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  feedbackCopy: {
    flex: 1,
    gap: 4,
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
    minWidth: 120,
    padding: 12,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
  descriptionBlock: {
    gap: 4,
    width: '100%',
  },
  auditRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
