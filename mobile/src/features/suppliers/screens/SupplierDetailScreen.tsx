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

import { useSupplierDetail } from '@/features/suppliers/hooks/useSuppliers';
import { getSupplierPermissions } from '@/features/suppliers/utils/supplier-access';
import {
  formatSupplierAddress,
  formatSupplierDate,
  formatSupplierStatus,
  getSupplierContactLine,
} from '@/features/suppliers/utils/supplier-display';

export function SupplierDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthSession();
  const permissions = getSupplierPermissions(user?.role);
  const supplierQuery = useSupplierDetail(params.id);

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to open supplier details."
      />
    );
  }

  if (supplierQuery.isLoading) {
    return (
      <LoadingState
        title="Loading supplier"
        message="Fetching the latest supplier details and procurement contacts."
      />
    );
  }

  if (supplierQuery.isError || !supplierQuery.data) {
    return (
      <ErrorState
        title="Supplier unavailable"
        message="We couldn't load this supplier right now."
        actionLabel="Back to suppliers"
        onAction={() => router.replace(appRoutes.suppliers as Href)}
      />
    );
  }

  const supplier = supplierQuery.data;
  const status = formatSupplierStatus(supplier.status);
  const statusColor =
    status === 'Archived'
      ? theme.colors.danger
      : status === 'Inactive'
        ? theme.colors.warning
        : theme.colors.success;

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
          {permissions.canManage ? (
            <AppButton
              label="Edit supplier"
              onPress={() => router.push(`/(tabs)/more/suppliers/edit/${supplier.id}` as Href)}
            />
          ) : null}
        </View>

        <AppCard variant="hero">
          <View style={styles.hero}>
            <AppText variant="caption">Supplier details</AppText>
            <AppText variant="title">{supplier.name}</AppText>
            <AppText>{getSupplierContactLine(supplier)}</AppText>
            <View style={styles.heroBottomRow}>
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
              <View style={styles.addressShell}>
                <AppText variant="caption">Address</AppText>
                <AppText>{supplier.address?.city || supplier.address?.country || 'Not set'}</AppText>
              </View>
            </View>
          </View>
        </AppCard>

        <AppCard variant="subtle">
          <AppText variant="subtitle">Business identity</AppText>
          <View style={styles.infoGrid}>
            <DetailField label="Supplier name" value={supplier.name} />
            <DetailField
              label="Phone"
              value={supplier.contactNumber || supplier.contact || 'Not set'}
            />
            <DetailField label="Email" value={supplier.email || 'Not set'} />
            <DetailField label="Contact person" value={supplier.contactPerson || 'Not set'} />
            <DetailField label="Alternate" value={supplier.alternateContact || 'Not set'} />
            <DetailField label="Status" value={status} />
          </View>
        </AppCard>

        <AppCard variant="subtle">
          <AppText variant="subtitle">Address</AppText>
          <AppText>{formatSupplierAddress(supplier)}</AppText>
        </AppCard>

        {supplier.notes ? (
          <AppCard variant="subtle">
            <AppText variant="subtitle">Notes</AppText>
            <AppText>{supplier.notes}</AppText>
          </AppCard>
        ) : null}

        <AppCard variant="subtle">
          <AppText variant="subtitle">Record history</AppText>
          <View style={styles.infoGrid}>
            <DetailField
              label="Created"
              value={formatSupplierDate(supplier.createdAt || supplier.audit?.createdAt)}
            />
            <DetailField
              label="Updated"
              value={formatSupplierDate(supplier.updatedAt || supplier.audit?.updatedAt)}
            />
          </View>
        </AppCard>

        <AppCard variant="subtle">
          <AppText variant="subtitle">Next actions</AppText>
          <AppButton
            label="View suppliers"
            variant="secondary"
            onPress={() => router.push(appRoutes.suppliers as Href)}
          />
          <AppButton
            label="Create purchase order"
            onPress={() => router.push(`/(tabs)/more/purchases/add?supplierId=${supplier.id}` as Href)}
          />
        </AppCard>
      </ScrollView>
    </AppScreen>
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
    gap: 8,
  },
  heroBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addressShell: {
    alignItems: 'flex-end',
    gap: 3,
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
});
