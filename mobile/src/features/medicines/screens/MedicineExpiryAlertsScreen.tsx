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

import { MedicineListItem } from '@/features/medicines/components/MedicineListItem';
import { useMedicineExpiryAlerts } from '@/features/medicines/hooks/useMedicines';
import { getMedicinePermissions } from '@/features/medicines/utils/medicine-access';
import type { MedicineItem } from '@/features/medicines/types';

export function MedicineExpiryAlertsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthSession();
  const permissions = getMedicinePermissions(user?.role);
  const expiryQuery = useMedicineExpiryAlerts();

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Access restricted"
        message="Your role does not have permission to view medicine expiry alerts."
      />
    );
  }

  if (expiryQuery.isLoading) {
    return (
      <LoadingState
        title="Loading expiry alerts"
        message="Reviewing medicine expiry windows from the catalog snapshot."
      />
    );
  }

  if (expiryQuery.isError || !expiryQuery.data) {
    return (
      <ErrorState
        title="Expiry alerts unavailable"
        message="We couldn't load expiry alerts right now."
        actionLabel="Back to medicines"
        onAction={() => router.replace(appRoutes.medicines as Href)}
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
            <AppText variant="caption">Medicine expiry</AppText>
            <AppText variant="title">Expiry alerts</AppText>
            <AppText>
              Surface the medicines that need action soon, so expiry review feels operational and
              calm instead of buried inside stock browsing.
            </AppText>
          </View>
        </AppCard>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="alert-circle-outline"
            label="Expired"
            value={summary.expired}
            tone="danger"
          />
          <SummaryCard
            icon="timer-outline"
            label="Next 7 days"
            value={summary.expiringIn7Days}
            tone="warning"
          />
          <SummaryCard
            icon="calendar-outline"
            label="Next 30 days"
            value={summary.expiringIn30Days}
            tone="info"
          />
        </View>

        <AppCard variant="subtle">
          <View style={styles.inlineGuide}>
            <Ionicons color={theme.colors.primary} name="shield-checkmark-outline" size={18} />
            <AppText variant="caption" style={{ flex: 1 }}>
              Expiry alerts are catalog-linked visibility only. Use inventory screens for batch-level
              operational actions.
            </AppText>
          </View>
        </AppCard>

        <ExpirySection
          title="Expired medicines"
          subtitle="Highest priority records that need immediate review."
          items={expired}
          onOpen={(id) => router.push(`/(tabs)/medicines/${id}` as Href)}
          emptyMessage="No medicines are currently marked as expired."
        />
        <ExpirySection
          title="Expiring in 7 days"
          subtitle="Short-term risk that should be checked during daily operations."
          items={expiringIn7Days}
          onOpen={(id) => router.push(`/(tabs)/medicines/${id}` as Href)}
          emptyMessage="Nothing is due to expire within 7 days."
        />
        <ExpirySection
          title="Expiring in 30 days"
          subtitle="Upcoming risk worth reviewing during procurement and stock planning."
          items={expiringIn30Days}
          onOpen={(id) => router.push(`/(tabs)/medicines/${id}` as Href)}
          emptyMessage="Nothing is due to expire within 30 days."
        />
      </ScrollView>
    </AppScreen>
  );
}

type ExpirySectionProps = {
  title: string;
  subtitle: string;
  items: MedicineItem[];
  emptyMessage: string;
  onOpen: (id: string) => void;
};

function ExpirySection({
  title,
  subtitle,
  items,
  emptyMessage,
  onOpen,
}: ExpirySectionProps) {
  return (
    <AppCard variant="subtle">
      <View style={styles.sectionHeader}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText variant="caption">{subtitle}</AppText>
      </View>
      {items.length ? (
        <View style={styles.sectionList}>
          {items.map((item, index) => (
            <MedicineListItem key={`${item.id}-${index}`} item={item} onPress={() => onOpen(item.id)} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyPanel}>
          <AppText>{emptyMessage}</AppText>
        </View>
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
  sectionList: {
    gap: 12,
  },
  emptyPanel: {
    paddingVertical: 10,
  },
});
