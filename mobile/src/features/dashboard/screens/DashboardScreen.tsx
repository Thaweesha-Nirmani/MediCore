import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { appRoles, getRoleLabel, normalizeAppRole } from '@/constants/auth';
import { appRoutes } from '@/constants/routes';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { getFirstName } from '@/features/auth/utils/user-display';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getPurchasePermissions } from '@/features/purchases/utils/purchase-access';
import { getReportPermissions } from '@/features/reports/utils/report-access';
import { getSupplierPermissions } from '@/features/suppliers/utils/supplier-access';
import { canAccessTab } from '@/navigation/tabs';
import { useAppTheme } from '@/theme/useAppTheme';

import {
  useDashboardActivity,
  useDashboardSummary,
  useFastMovingMedicines,
} from '@/features/dashboard/hooks/useDashboard';
import {
  formatActivityType,
  formatDashboardCurrency,
  formatDashboardDateTime,
  getActivityAmountLabel,
  getFastMovingCaption,
} from '@/features/dashboard/utils/dashboard-display';

import type { DashboardActivityItem, DashboardFastMovingMedicine, DashboardSummary } from '@/features/dashboard/types';

type Role = ReturnType<typeof normalizeAppRole>;
type QuickAction = {
  label: string;
  caption: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: Href;
};
type MiniMetric = {
  label: string;
  value: string;
  caption: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};
type AlertItem = {
  label: string;
  value: string;
  caption: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route?: Href;
  tone: 'danger' | 'warning' | 'success';
};
type FocusPanelItem = {
  title: string;
  message: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  primaryLabel: string;
  primaryRoute: Href;
  secondaryLabel?: string;
  secondaryRoute?: Href;
};
type PulseRow = {
  label: string;
  value: string;
};
type PulseCardItem = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  rows: PulseRow[];
};

const HERO_COPY: Record<string, { eyebrow: string; message: string }> = {
  [appRoles.admin]: {
    eyebrow: 'System overview',
    message: 'Move quickly across medicines, stock, sales, and procurement without opening every module.',
  },
  [appRoles.pharmacist]: {
    eyebrow: 'Clinical operations',
    message: 'Keep medicines, expiry risk, and sales access close while preserving a calm pharmacy workflow.',
  },
  [appRoles.cashier]: {
    eyebrow: 'Sales desk',
    message: 'Start billing fast, review recent invoices, and avoid admin clutter that slows the counter down.',
  },
  [appRoles.inventoryManager]: {
    eyebrow: 'Stock control',
    message: 'See shortages, expiry risk, and procurement pressure before opening the stock tools.',
  },
  [appRoles.purchasingManager]: {
    eyebrow: 'Procurement overview',
    message: 'Start from suppliers, orders, and receiving movement instead of a generic admin summary.',
  },
  [appRoles.supplierManager]: {
    eyebrow: 'Supplier operations',
    message: 'Keep vendor records, open orders, and stock-linked procurement signals visible at a glance.',
  },
};

export function DashboardScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const role = normalizeAppRole(user?.role);
  const purchasePermissions = getPurchasePermissions(user?.role);
  const supplierPermissions = getSupplierPermissions(user?.role);
  const reportPermissions = getReportPermissions(user?.role);
  const canOpenInventory = canAccessTab('inventory', user?.role);
  const canOpenSales = canAccessTab('sales', user?.role);
  const canOpenMedicines = canAccessTab('medicines', user?.role);
  const canOpenPurchases = purchasePermissions.canRead;
  const canOpenSuppliers = supplierPermissions.canRead;
  const canOpenReports = reportPermissions.canRead;

  const summaryQuery = useDashboardSummary();
  const activityQuery = useDashboardActivity(8);
  const fastMovingQuery = useFastMovingMedicines(5, 30);

  const isInitialLoading =
    summaryQuery.isLoading && !summaryQuery.data && !activityQuery.data && !fastMovingQuery.data;

  if (isInitialLoading) {
    return (
      <LoadingState
        title="Loading dashboard"
        message="Preparing today's stock, expiry, procurement, and sales summary."
      />
    );
  }

  if (summaryQuery.isError && !summaryQuery.data) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message="We couldn't load the operational summary right now."
        actionLabel="Retry"
        onAction={() => {
          void Promise.all([summaryQuery.refetch(), activityQuery.refetch(), fastMovingQuery.refetch()]);
        }}
      />
    );
  }

  const summary = summaryQuery.data;
  const activity = filterActivity(role, activityQuery.data?.items || summary?.recentActivity || []);
  const fastMoving = filterFastMoving(role, fastMovingQuery.data?.items || summary?.fastMovingMedicines || []);

  const quickActions = summary
    ? getQuickActions(role, {
        canOpenMedicines,
        canOpenInventory,
        canOpenSales,
        canOpenPurchases,
        canOpenSuppliers,
        canOpenReports,
      })
    : [];
  const alerts = summary
    ? getAlerts(summary, role, { canOpenInventory, canOpenPurchases, canOpenReports })
    : [];
  const metrics = summary ? getMetrics(summary, role) : [];
  const focusPanel = summary
    ? getFocusPanel(summary, role, {
        canOpenMedicines,
        canOpenInventory,
        canOpenSales,
        canOpenPurchases,
        canOpenSuppliers,
      })
    : null;
  const pulseCard = summary ? getPulseCard(summary, role) : null;
  const alertsFirst =
    role === appRoles.inventoryManager ||
    role === appRoles.purchasingManager ||
    role === appRoles.supplierManager;

  const heroCopy = HERO_COPY[role || appRoles.admin] || HERO_COPY[appRoles.admin];
  const cardWidthStyle = responsive.isLgUp
    ? styles.quarterWidth
    : responsive.isMdUp
      ? styles.halfWidth
      : styles.fullWidth;
  const detailWidthStyle = responsive.isLgUp
    ? styles.quarterWidth
    : responsive.isMdUp
      ? styles.halfWidth
      : styles.fullWidth;
  const heroMetricWidthStyle = responsive.isLgUp
    ? styles.thirdWidth
    : responsive.isMdUp
      ? styles.halfWidth
      : styles.fullWidth;

  return (
    <AppScreen contentWidth="wide">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={summaryQuery.isRefetching || activityQuery.isRefetching || fastMovingQuery.isRefetching}
            onRefresh={() => {
              void Promise.all([summaryQuery.refetch(), activityQuery.refetch(), fastMovingQuery.refetch()]);
            }}
            tintColor={theme.colors.primary}
          />
        }
      >
        <AppCard variant="hero">
          <View style={styles.hero}>
            <AppText variant="caption">{heroCopy.eyebrow}</AppText>
            <AppText variant="title">{heroTitle(role, user?.name)}</AppText>
            <AppText>{heroCopy.message}</AppText>
            {focusPanel ? <FocusPanel item={focusPanel} onPress={(route) => router.push(route)} /> : null}
            <View style={styles.heroMeta}>
              <MetaPill icon="person-circle-outline" text={getRoleLabel(user?.role)} accent />
              {summary ? <MetaPill icon="time-outline" text={`Updated ${formatDashboardDateTime(summary.generatedAt)}`} /> : null}
            </View>
          </View>
        </AppCard>

        {metrics.length ? (
          <View style={styles.grid}>
            {metrics.map((item) => (
              <MetricCard key={item.label} item={item} style={cardWidthStyle} />
            ))}
          </View>
        ) : null}

        {alertsFirst && alerts.length ? (
          <AppCard variant="subtle">
            <SectionTitle title="Priority alerts" subtitle={alertSubtitle(role)} />
            <View style={styles.alertList}>
              {alerts.map((item) => {
                const route = item.route;
                return (
                  <AlertCard
                    key={item.label}
                    item={item}
                    onPress={route ? () => router.push(route) : undefined}
                    style={cardWidthStyle}
                  />
                );
              })}
            </View>
          </AppCard>
        ) : null}

        {quickActions.length ? (
          <View style={styles.section}>
            <SectionTitle title={quickTitle(role)} subtitle={quickSubtitle(role)} />
            <View style={styles.grid}>
              {quickActions.map((item) => (
                <QuickActionCard
                  key={item.label}
                  item={item}
                  onPress={() => router.push(item.route)}
                  style={cardWidthStyle}
                />
              ))}
            </View>
          </View>
        ) : null}

        {!alertsFirst && alerts.length ? (
          <AppCard variant="subtle">
            <SectionTitle title="Priority alerts" subtitle={alertSubtitle(role)} />
            <View style={styles.alertList}>
              {alerts.map((item) => {
                const route = item.route;
                return (
                  <AlertCard
                    key={item.label}
                    item={item}
                    onPress={route ? () => router.push(route) : undefined}
                    style={cardWidthStyle}
                  />
                );
              })}
            </View>
          </AppCard>
        ) : null}

        {pulseCard ? <PulseCard item={pulseCard} detailStyle={detailWidthStyle} /> : null}

        {summary ? (
          <AppCard variant="subtle">
            <SectionTitle title={summaryTitle(role)} subtitle={summarySubtitle(role)} />
            <View style={styles.summaryGrid}>
              {getSummaryRows(summary, role).map((item) => (
                <DetailField
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  style={detailWidthStyle}
                />
              ))}
            </View>
          </AppCard>
        ) : null}

        {showFastMoving(role) ? (
          <AppCard variant="subtle">
            <SectionTitle
              title={role === appRoles.cashier ? 'Counter favourites' : 'Fast-moving medicines'}
              subtitle={role === appRoles.cashier ? 'Useful for faster sales lookup.' : 'Useful for stocking and reordering decisions.'}
            />
            <View style={styles.list}>
              {fastMoving.length ? (
                fastMoving.map((item) => (
                <RowPair
                  key={`${item.medicineId}-${item.catalogMedicineId}`}
                  leftTitle={item.name || item.catalogMedicineId || 'Medicine'}
                  leftMeta={getFastMovingCaption(item)}
                  rightTitle={`${item.unitsSold} sold`}
                  rightMeta={formatDashboardCurrency(item.revenue)}
                  stacked={!responsive.isMdUp}
                />
              ))
            ) : (
                <AppText variant="caption">No fast-moving medicines available for this period.</AppText>
              )}
            </View>
          </AppCard>
        ) : null}

        {activity.length ? (
          <AppCard variant="subtle">
            <SectionTitle title={activityTitle(role)} subtitle={activitySubtitle(role)} />
            <View style={styles.list}>
              {activity.map((item) => (
                <RowPair
                  key={`${item.type}-${item.id}`}
                  leftTitle={item.label}
                  leftMeta={`${formatActivityType(item.type)} | ${item.subtitle} | ${formatDashboardDateTime(item.at)}`}
                  rightTitle={getActivityAmountLabel(item)}
                  rightMeta={item.status}
                  stacked={!responsive.isMdUp}
                />
              ))}
            </View>
          </AppCard>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

function heroTitle(role: Role, name?: string | null) {
  const first = getFirstName(name);
  if (role === appRoles.cashier) return `${first}, the counter is ready`;
  if (role === appRoles.inventoryManager) return `${first}, stock needs your attention`;
  if (role === appRoles.purchasingManager) return `${first}, procurement at a glance`;
  if (role === appRoles.supplierManager) return `${first}, supplier work at a glance`;
  if (role === appRoles.pharmacist) return `${first}, today's pharmacy pulse`;
  return `Welcome, ${first}`;
}

function quickTitle(role: Role) {
  if (role === appRoles.cashier) return 'Cashier shortcuts';
  if (role === appRoles.inventoryManager) return 'Stock shortcuts';
  if (role === appRoles.purchasingManager) return 'Procurement shortcuts';
  if (role === appRoles.supplierManager) return 'Supplier shortcuts';
  return 'Quick actions';
}

function quickSubtitle(role: Role) {
  if (role === appRoles.cashier) return 'Minimal taps to start billing or review invoices.';
  if (role === appRoles.inventoryManager) return 'Open the screens that resolve stock pressure fastest.';
  if (role === appRoles.purchasingManager) return 'Purchases, suppliers, and reports without menu hunting.';
  if (role === appRoles.supplierManager) return 'Supplier records first, with orders and reports one tap away.';
  return 'Cross-module movement for the tasks this role handles most.';
}

function alertSubtitle(role: Role) {
  if (role === appRoles.inventoryManager) return 'High-signal stock issues surfaced before routine browsing.';
  if (role === appRoles.purchasingManager || role === appRoles.supplierManager) return 'Procurement signals shaped by shortages and open orders.';
  return 'Useful alerts without turning the dashboard into a warning wall.';
}

function summaryTitle(role: Role) {
  if (role === appRoles.cashier) return 'Recent sales summary';
  if (role === appRoles.inventoryManager) return 'Inventory and procurement summary';
  if (role === appRoles.purchasingManager || role === appRoles.supplierManager) return 'Procurement summary';
  return 'Operational summary';
}

function summarySubtitle(role: Role) {
  if (role === appRoles.cashier) return 'A compact sales pulse instead of a report-heavy home screen.';
  if (role === appRoles.inventoryManager) return 'Stock awareness plus receiving context.';
  if (role === appRoles.purchasingManager || role === appRoles.supplierManager) return 'What has been ordered and received recently.';
  return 'A concise operational snapshot without extra charts.';
}

function activityTitle(role: Role) {
  if (role === appRoles.cashier) return 'Recent sales activity';
  if (role === appRoles.inventoryManager) return 'Recent stock movement';
  if (role === appRoles.purchasingManager || role === appRoles.supplierManager) return 'Recent procurement movement';
  return 'Recent activity';
}

function activitySubtitle(role: Role) {
  if (role === appRoles.cashier) return 'Recent invoices and sale completions from the counter.';
  if (role === appRoles.inventoryManager) return 'Inventory and receiving movement most relevant to stock control.';
  if (role === appRoles.purchasingManager || role === appRoles.supplierManager) return 'Purchase and receiving events that matter to supplier operations.';
  return 'Latest business movement across the connected modules.';
}

function showFastMoving(role: Role) {
  return role !== appRoles.purchasingManager && role !== appRoles.supplierManager;
}

function getQuickActions(
  role: Role,
  flags: {
    canOpenMedicines: boolean;
    canOpenInventory: boolean;
    canOpenSales: boolean;
    canOpenPurchases: boolean;
    canOpenSuppliers: boolean;
    canOpenReports: boolean;
  }
): QuickAction[] {
  const items: QuickAction[] = [];
  const add = (enabled: boolean, item: QuickAction) => enabled && items.push(item);

  if (role === appRoles.cashier) {
    add(flags.canOpenSales, { label: 'Start sale', caption: 'Open POS', icon: 'receipt-outline', route: appRoutes.sales });
    add(flags.canOpenSales, { label: 'History', caption: 'Recent invoices', icon: 'time-outline', route: appRoutes.salesHistory });
    add(flags.canOpenMedicines, { label: 'Medicines', caption: 'Lookup before billing', icon: 'medkit-outline', route: appRoutes.medicines });
    return items;
  }

  if (role === appRoles.inventoryManager) {
    add(flags.canOpenInventory, { label: 'Inventory', caption: 'Batch stock view', icon: 'cube-outline', route: appRoutes.inventory });
    add(flags.canOpenInventory, { label: 'Low stock', caption: 'Resolve shortages', icon: 'warning-outline', route: appRoutes.inventoryLowStock });
    add(flags.canOpenInventory, { label: 'Expiry', caption: 'Review expiring batches', icon: 'timer-outline', route: appRoutes.inventoryExpiry });
    add(flags.canOpenPurchases, { label: 'Purchases', caption: 'Follow receiving', icon: 'bag-handle-outline', route: appRoutes.purchases });
    return items;
  }

  if (role === appRoles.purchasingManager) {
    add(flags.canOpenPurchases, { label: 'Purchases', caption: 'Open orders', icon: 'bag-handle-outline', route: appRoutes.purchases });
    add(flags.canOpenSuppliers, { label: 'Suppliers', caption: 'Vendor records', icon: 'people-outline', route: appRoutes.suppliers });
    add(flags.canOpenReports, { label: 'Reports', caption: 'Procurement data', icon: 'analytics-outline', route: appRoutes.reports });
    add(flags.canOpenMedicines, { label: 'Medicines', caption: 'Catalog lookup', icon: 'medkit-outline', route: appRoutes.medicines });
    return items;
  }

  if (role === appRoles.supplierManager) {
    add(flags.canOpenSuppliers, { label: 'Suppliers', caption: 'Vendor records', icon: 'people-outline', route: appRoutes.suppliers });
    add(flags.canOpenPurchases, { label: 'Purchases', caption: 'Order coordination', icon: 'bag-handle-outline', route: appRoutes.purchases });
    add(flags.canOpenReports, { label: 'Reports', caption: 'Supplier data', icon: 'analytics-outline', route: appRoutes.reports });
    add(flags.canOpenMedicines, { label: 'Medicines', caption: 'Catalog lookup', icon: 'medkit-outline', route: appRoutes.medicines });
    return items;
  }

  if (role === appRoles.pharmacist) {
    add(flags.canOpenMedicines, { label: 'Medicines', caption: 'Catalog and search', icon: 'medkit-outline', route: appRoutes.medicines });
    add(flags.canOpenInventory, { label: 'Expiry alerts', caption: 'Expiring stock', icon: 'timer-outline', route: appRoutes.inventoryExpiry });
    add(flags.canOpenSales, { label: 'POS', caption: 'Open billing', icon: 'receipt-outline', route: appRoutes.sales });
    add(flags.canOpenInventory, { label: 'Low stock', caption: 'Shortage list', icon: 'warning-outline', route: appRoutes.inventoryLowStock });
    return items;
  }

  add(flags.canOpenMedicines, { label: 'Medicines', caption: 'Catalog and lookup', icon: 'medkit-outline', route: appRoutes.medicines });
  add(flags.canOpenInventory, { label: 'Inventory', caption: 'Stock and batches', icon: 'cube-outline', route: appRoutes.inventory });
  add(flags.canOpenSales, { label: 'Sales', caption: 'POS and invoices', icon: 'receipt-outline', route: appRoutes.sales });
  add(flags.canOpenPurchases, { label: 'Purchases', caption: 'Procurement flow', icon: 'bag-handle-outline', route: appRoutes.purchases });
  add(flags.canOpenReports, { label: 'Reports', caption: 'Business visibility', icon: 'analytics-outline', route: appRoutes.reports });
  return items;
}

function getFocusPanel(
  summary: DashboardSummary,
  role: Role,
  flags: {
    canOpenMedicines: boolean;
    canOpenInventory: boolean;
    canOpenSales: boolean;
    canOpenPurchases: boolean;
    canOpenSuppliers: boolean;
  }
): FocusPanelItem | null {
  if (role === appRoles.cashier && flags.canOpenSales) {
    return {
      title: 'Counter ready',
      message: `${summary.salesSummary.today.saleCount} invoices today with ${summary.salesSummary.today.unitsSold} units billed.`,
      icon: 'receipt-outline',
      primaryLabel: 'Start sale',
      primaryRoute: appRoutes.sales,
      secondaryLabel: 'View history',
      secondaryRoute: appRoutes.salesHistory,
    };
  }

  if (role === appRoles.inventoryManager && flags.canOpenInventory) {
    const primaryRoute =
      summary.totals.expiredStockCount > 0 ? appRoutes.inventoryExpiry : appRoutes.inventoryLowStock;

    return {
      title: 'Stock pressure needs review',
      message: `${summary.totals.lowStockCount} low-stock items, ${summary.totals.expiredStockCount} expired batches, and ${summary.purchaseSummary.openOrders} open orders.`,
      icon: 'cube-outline',
      primaryLabel: summary.totals.expiredStockCount > 0 ? 'Open expiry' : 'Open low stock',
      primaryRoute,
      secondaryLabel: flags.canOpenPurchases ? 'Open purchases' : undefined,
      secondaryRoute: flags.canOpenPurchases ? appRoutes.purchases : undefined,
    };
  }

  if (role === appRoles.purchasingManager && flags.canOpenPurchases) {
    return {
      title: 'Procurement needs follow-up',
      message: `${summary.purchaseSummary.openOrders} active orders, ${summary.totals.lowStockCount} shortage signals, and ${summary.purchaseSummary.last30Days.unitsReceived} units received recently.`,
      icon: 'bag-handle-outline',
      primaryLabel: 'Open purchases',
      primaryRoute: appRoutes.purchases,
      secondaryLabel: flags.canOpenSuppliers ? 'Open suppliers' : undefined,
      secondaryRoute: flags.canOpenSuppliers ? appRoutes.suppliers : undefined,
    };
  }

  if (role === appRoles.supplierManager && flags.canOpenSuppliers) {
    return {
      title: 'Supplier records need follow-up',
      message: `${summary.purchaseSummary.openOrders} open orders, ${summary.totals.lowStockCount} shortage signals, and supplier coordination should stay ahead of receiving pressure.`,
      icon: 'people-outline',
      primaryLabel: 'Open suppliers',
      primaryRoute: appRoutes.suppliers,
      secondaryLabel: flags.canOpenPurchases ? 'Open purchases' : undefined,
      secondaryRoute: flags.canOpenPurchases ? appRoutes.purchases : undefined,
    };
  }

  if (role === appRoles.pharmacist) {
    const primaryRoute =
      summary.totals.expiredStockCount > 0 && flags.canOpenInventory
        ? appRoutes.inventoryExpiry
        : flags.canOpenMedicines
          ? appRoutes.medicines
          : flags.canOpenSales
            ? appRoutes.sales
            : null;

    if (!primaryRoute) {
      return null;
    }

    return {
      title: 'Clinical operations pulse',
      message: `${summary.totals.lowStockCount} shortage alerts, ${summary.totals.expiredStockCount} expiry risks, and ${summary.salesSummary.today.saleCount} sales handled today.`,
      icon: 'medkit-outline',
      primaryLabel:
        primaryRoute === appRoutes.inventoryExpiry ? 'Review expiry' : primaryRoute === appRoutes.sales ? 'Open POS' : 'Open medicines',
      primaryRoute,
      secondaryLabel: flags.canOpenSales ? 'Open POS' : undefined,
      secondaryRoute: flags.canOpenSales ? appRoutes.sales : undefined,
    };
  }

  if (flags.canOpenInventory || flags.canOpenSales || flags.canOpenPurchases) {
    const primaryRoute =
      summary.totals.expiredStockCount > 0 && flags.canOpenInventory
        ? appRoutes.inventoryExpiry
        : summary.totals.lowStockCount > 0 && flags.canOpenInventory
          ? appRoutes.inventoryLowStock
          : flags.canOpenSales
            ? appRoutes.sales
            : flags.canOpenPurchases
              ? appRoutes.purchases
              : null;

    if (!primaryRoute) {
      return null;
    }

    return {
      title: 'Operational overview',
      message: `${summary.totals.totalMedicines} medicines, ${summary.totals.lowStockCount} shortage alerts, ${summary.salesSummary.today.saleCount} sales today, and ${summary.purchaseSummary.openOrders} open purchase orders.`,
      icon: 'grid-outline',
      primaryLabel:
        primaryRoute === appRoutes.inventoryExpiry
          ? 'Review expiry'
          : primaryRoute === appRoutes.inventoryLowStock
            ? 'Review shortages'
            : primaryRoute === appRoutes.purchases
              ? 'Open purchases'
              : 'Open sales',
      primaryRoute,
      secondaryLabel: flags.canOpenMedicines ? 'Open medicines' : undefined,
      secondaryRoute: flags.canOpenMedicines ? appRoutes.medicines : undefined,
    };
  }

  return null;
}

function getPulseCard(summary: DashboardSummary, role: Role): PulseCardItem | null {
  if (role === appRoles.cashier || role === appRoles.pharmacist || role === appRoles.admin) {
    return {
      title: role === appRoles.cashier ? 'Recent sales pulse' : 'Sales pulse',
      subtitle:
        role === appRoles.cashier
          ? 'Keep the counter moving without opening full reports.'
          : 'Revenue and dispensing movement condensed for a quick read.',
      icon: 'pulse-outline',
      rows: [
        { label: 'Today revenue', value: formatDashboardCurrency(summary.salesSummary.today.totalSales) },
        { label: 'Invoices today', value: String(summary.salesSummary.today.saleCount) },
        { label: 'Units sold', value: String(summary.salesSummary.today.unitsSold) },
        { label: '7-day revenue', value: formatDashboardCurrency(summary.salesSummary.last7Days.totalSales) },
      ],
    };
  }

  if (role === appRoles.inventoryManager || role === appRoles.purchasingManager || role === appRoles.supplierManager) {
    return {
      title: 'Procurement pulse',
      subtitle: 'Receiving and order movement that affect stock continuity.',
      icon: 'bag-check-outline',
      rows: [
        { label: 'Open orders', value: String(summary.purchaseSummary.openOrders) },
        { label: 'Received orders', value: String(summary.purchaseSummary.receivedOrders) },
        { label: 'Units ordered', value: String(summary.purchaseSummary.last30Days.unitsOrdered) },
        { label: 'Units received', value: String(summary.purchaseSummary.last30Days.unitsReceived) },
      ],
    };
  }

  return null;
}

function getAlerts(
  summary: DashboardSummary,
  role: Role,
  flags: { canOpenInventory: boolean; canOpenPurchases: boolean; canOpenReports: boolean }
): AlertItem[] {
  if (role === appRoles.cashier) return [];
  const inventoryRoute = flags.canOpenInventory ? (appRoutes.inventoryLowStock as Href) : flags.canOpenReports ? (appRoutes.reports as Href) : undefined;
  const expiryRoute = flags.canOpenInventory ? (appRoutes.inventoryExpiry as Href) : flags.canOpenReports ? (appRoutes.reports as Href) : undefined;
  const items: AlertItem[] = [
    {
      label: 'Low stock',
      value: String(summary.totals.lowStockCount),
      caption: summary.totals.lowStockCount ? 'Medicines need replenishment' : 'No shortage signals',
      icon: 'warning-outline',
      route: inventoryRoute,
      tone: summary.totals.lowStockCount ? 'warning' : 'success',
    },
    {
      label: 'Expiry risk',
      value: String(summary.totals.expiredStockCount),
      caption: summary.totals.expiredStockCount ? 'Expired batches are present' : 'No expired batches',
      icon: 'timer-outline',
      route: expiryRoute,
      tone: summary.totals.expiredStockCount ? 'danger' : 'success',
    },
  ];
  if (flags.canOpenPurchases || role === appRoles.purchasingManager || role === appRoles.supplierManager) {
    items.push({
      label: 'Open orders',
      value: String(summary.purchaseSummary.openOrders),
      caption: summary.purchaseSummary.openOrders ? 'Purchase follow-up required' : 'No open orders',
      icon: 'bag-handle-outline',
      route: flags.canOpenPurchases ? (appRoutes.purchases as Href) : undefined,
      tone: summary.purchaseSummary.openOrders ? 'warning' : 'success',
    });
  }
  return items;
}

function getMetrics(summary: DashboardSummary, role: Role): MiniMetric[] {
  if (role === appRoles.cashier) {
    return [
      { label: 'Sales today', value: formatDashboardCurrency(summary.salesSummary.today.totalSales), caption: `${summary.salesSummary.today.saleCount} invoices`, icon: 'wallet-outline' },
      { label: 'Units sold', value: String(summary.salesSummary.today.unitsSold), caption: 'Medicines billed today', icon: 'medkit-outline' },
      { label: 'Average sale', value: formatDashboardCurrency(summary.salesSummary.today.averageSaleValue), caption: 'Today at the counter', icon: 'stats-chart-outline' },
      { label: '7-day revenue', value: formatDashboardCurrency(summary.salesSummary.last7Days.totalSales), caption: 'Short rolling pulse', icon: 'calendar-outline' },
    ];
  }
  if (role === appRoles.inventoryManager) {
    return [
      { label: 'Low stock', value: String(summary.totals.lowStockCount), caption: 'Medicines under threshold', icon: 'warning-outline' },
      { label: 'Expired', value: String(summary.totals.expiredStockCount), caption: 'Batches past expiry', icon: 'timer-outline' },
      { label: 'Open orders', value: String(summary.purchaseSummary.openOrders), caption: 'Awaiting follow-up', icon: 'bag-handle-outline' },
      { label: 'Received orders', value: String(summary.purchaseSummary.receivedOrders), caption: 'Completed receipts', icon: 'checkmark-done-outline' },
    ];
  }
  if (role === appRoles.purchasingManager || role === appRoles.supplierManager) {
    return [
      { label: '30-day spend', value: formatDashboardCurrency(summary.purchaseSummary.last30Days.totalAmount), caption: `${summary.purchaseSummary.last30Days.purchaseCount} orders`, icon: 'cash-outline' },
      { label: 'Open orders', value: String(summary.purchaseSummary.openOrders), caption: 'Still active', icon: 'bag-handle-outline' },
      { label: 'Units ordered', value: String(summary.purchaseSummary.last30Days.unitsOrdered), caption: 'Recent volume', icon: 'layers-outline' },
      { label: 'Units received', value: String(summary.purchaseSummary.last30Days.unitsReceived), caption: 'Delivered to ops', icon: 'download-outline' },
    ];
  }
  if (role === appRoles.pharmacist) {
    return [
      { label: 'Medicines', value: String(summary.totals.totalMedicines), caption: 'Active catalog records', icon: 'medkit-outline' },
      { label: 'Low stock', value: String(summary.totals.lowStockCount), caption: 'Need replenishment', icon: 'warning-outline' },
      { label: 'Sales today', value: formatDashboardCurrency(summary.salesSummary.today.totalSales), caption: `${summary.salesSummary.today.saleCount} invoices`, icon: 'receipt-outline' },
      { label: 'Units sold', value: String(summary.salesSummary.today.unitsSold), caption: 'Dispensed today', icon: 'pulse-outline' },
    ];
  }
  return [
    { label: 'Medicines', value: String(summary.totals.totalMedicines), caption: 'Active catalog', icon: 'medkit-outline' },
    { label: 'Sales today', value: formatDashboardCurrency(summary.salesSummary.today.totalSales), caption: `${summary.salesSummary.today.saleCount} invoices`, icon: 'receipt-outline' },
    { label: '7-day revenue', value: formatDashboardCurrency(summary.salesSummary.last7Days.totalSales), caption: 'Commerce pulse', icon: 'stats-chart-outline' },
    { label: '30-day spend', value: formatDashboardCurrency(summary.purchaseSummary.last30Days.totalAmount), caption: 'Procurement outflow', icon: 'bag-handle-outline' },
  ];
}

function getSummaryRows(summary: DashboardSummary, role: Role) {
  if (role === appRoles.cashier) {
    return [
      { label: 'Today sales', value: formatDashboardCurrency(summary.salesSummary.today.totalSales) },
      { label: 'Invoices today', value: String(summary.salesSummary.today.saleCount) },
      { label: '30-day average sale', value: formatDashboardCurrency(summary.salesSummary.last30Days.averageSaleValue) },
      { label: '7-day units sold', value: String(summary.salesSummary.last7Days.unitsSold) },
    ];
  }
  if (role === appRoles.inventoryManager) {
    return [
      { label: 'Open purchase orders', value: String(summary.purchaseSummary.openOrders) },
      { label: 'Received orders', value: String(summary.purchaseSummary.receivedOrders) },
      { label: 'Units received (30d)', value: String(summary.purchaseSummary.last30Days.unitsReceived) },
      { label: 'Units ordered (30d)', value: String(summary.purchaseSummary.last30Days.unitsOrdered) },
    ];
  }
  if (role === appRoles.purchasingManager || role === appRoles.supplierManager) {
    return [
      { label: 'Open orders', value: String(summary.purchaseSummary.openOrders) },
      { label: 'Received orders', value: String(summary.purchaseSummary.receivedOrders) },
      { label: 'Units ordered', value: String(summary.purchaseSummary.last30Days.unitsOrdered) },
      { label: 'Units received', value: String(summary.purchaseSummary.last30Days.unitsReceived) },
    ];
  }
  return [
    { label: 'Today sales', value: formatDashboardCurrency(summary.salesSummary.today.totalSales) },
    { label: 'Today units', value: String(summary.salesSummary.today.unitsSold) },
    { label: '7-day revenue', value: formatDashboardCurrency(summary.salesSummary.last7Days.totalSales) },
    { label: 'Open orders', value: String(summary.purchaseSummary.openOrders) },
  ];
}

function filterActivity(role: Role, items: DashboardActivityItem[]) {
  if (role === appRoles.cashier) return items.filter((item) => item.type === 'sale').slice(0, 4);
  if (role === appRoles.inventoryManager) return items.filter((item) => item.type !== 'sale').slice(0, 5);
  if (role === appRoles.purchasingManager || role === appRoles.supplierManager) {
    return items.filter((item) => item.type === 'purchase' || item.type === 'inventory').slice(0, 5);
  }
  return items.slice(0, 6);
}

function filterFastMoving(role: Role, items: DashboardFastMovingMedicine[]) {
  if (!showFastMoving(role)) return [];
  return items.slice(0, role === appRoles.cashier ? 4 : 5);
}

function FocusPanel({ item, onPress }: { item: FocusPanelItem; onPress: (route: Href) => void }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.focusPanel,
        {
          backgroundColor: theme.colors.surfaceStrong,
          borderColor: theme.colors.borderStrong,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <View style={styles.focusPanelHeader}>
        <View
          style={[
            styles.focusIconShell,
            {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Ionicons color={theme.colors.primary} name={item.icon} size={20} />
        </View>
        <View style={styles.focusPanelCopy}>
          <AppText variant="label">{item.title}</AppText>
          <AppText variant="caption">{item.message}</AppText>
        </View>
      </View>
      <View style={styles.focusActions}>
        <Pressable
          onPress={() => onPress(item.primaryRoute)}
          style={[
            styles.focusPrimaryAction,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.pill,
              shadowColor: theme.colors.shadowStrong,
            },
          ]}
        >
          <AppText variant="label" style={{ color: '#FFFFFF' }}>
            {item.primaryLabel}
          </AppText>
        </Pressable>
        {item.secondaryLabel && item.secondaryRoute ? (
          <Pressable
            onPress={() => onPress(item.secondaryRoute as Href)}
            style={[
              styles.focusSecondaryAction,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.borderStrong,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="label" style={{ color: theme.colors.primary }}>
              {item.secondaryLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function PulseCard({
  item,
  detailStyle,
}: {
  item: PulseCardItem;
  detailStyle?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();

  return (
    <AppCard variant="subtle">
      <View style={styles.pulseHeader}>
        <View style={styles.pulseHeaderCopy}>
          <AppText variant="subtitle">{item.title}</AppText>
          <AppText variant="caption">{item.subtitle}</AppText>
        </View>
        <View
          style={[
            styles.iconShell,
            {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Ionicons color={theme.colors.primary} name={item.icon} size={18} />
        </View>
      </View>
      <View style={styles.summaryGrid}>
        {item.rows.map((row) => (
          <DetailField key={row.label} label={row.label} value={row.value} style={detailStyle} />
        ))}
      </View>
    </AppCard>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="subtitle">{title}</AppText>
      <AppText variant="caption">{subtitle}</AppText>
    </View>
  );
}

function MetaPill({ icon, text, accent = false }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string; accent?: boolean }) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.metaPill,
        {
          backgroundColor: accent ? theme.colors.primarySoft : theme.colors.surfaceMuted,
          borderColor: accent ? theme.colors.borderStrong : theme.colors.borderSoft,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <Ionicons color={accent ? theme.colors.primary : theme.colors.mutedText} name={icon} size={16} />
      <AppText variant={accent ? 'label' : 'caption'} style={accent ? { color: theme.colors.primary } : undefined}>
        {text}
      </AppText>
    </View>
  );
}

function MetricCard({
  item,
  style,
}: {
  item: MiniMetric;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  return (
    <AppCard variant="subtle" style={[styles.metricCard, style]}>
      <View style={[styles.iconShell, { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md }]}>
        <Ionicons color={theme.colors.primary} name={item.icon} size={18} />
      </View>
      <AppText variant="caption">{item.label}</AppText>
      <AppText variant="title">{item.value}</AppText>
      <AppText variant="caption">{item.caption}</AppText>
    </AppCard>
  );
}

function QuickActionCard({
  item,
  onPress,
  style,
}: {
  item: QuickAction;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionCard,
        style,
        {
          backgroundColor: theme.colors.surfaceStrong,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={[styles.iconShell, { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md }]}>
        <Ionicons color={theme.colors.primary} name={item.icon} size={20} />
      </View>
      <AppText variant="subtitle">{item.label}</AppText>
      <AppText variant="caption">{item.caption}</AppText>
      <View style={styles.actionFooter}>
        <AppText variant="caption" style={{ color: theme.colors.primary }}>
          Open
        </AppText>
        <Ionicons color={theme.colors.primary} name="arrow-forward-outline" size={16} />
      </View>
    </Pressable>
  );
}

function AlertCard({
  item,
  onPress,
  style,
}: {
  item: AlertItem;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const color = item.tone === 'danger' ? theme.colors.danger : item.tone === 'warning' ? theme.colors.warning : theme.colors.success;
  const body = (
    <View style={[styles.alertCard, { backgroundColor: theme.colors.surfaceStrong, borderColor: `${color}28`, borderRadius: theme.radius.lg, shadowColor: theme.colors.shadow }]}>
      <View style={styles.alertHeader}>
        <View style={[styles.alertIcon, { backgroundColor: `${color}14`, borderColor: `${color}28`, borderRadius: theme.radius.md }]}>
          <Ionicons color={color} name={item.icon} size={18} />
        </View>
        <AppText variant="label" style={{ color }}>{item.label}</AppText>
      </View>
      <AppText variant="title">{item.value}</AppText>
      <AppText variant="caption">{item.caption}</AppText>
      {onPress ? (
        <View style={styles.actionFooter}>
          <AppText variant="caption" style={{ color }}>
            Review
          </AppText>
          <Ionicons color={color} name="arrow-forward-outline" size={16} />
        </View>
      ) : null}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={[styles.alertWrapper, style]}>
      {body}
    </Pressable>
  ) : (
    <View style={[styles.alertWrapper, style]}>{body}</View>
  );
}

function RowPair({
  leftTitle,
  leftMeta,
  rightTitle,
  rightMeta,
  stacked = false,
}: {
  leftTitle: string;
  leftMeta: string;
  rightTitle: string;
  rightMeta: string;
  stacked?: boolean;
}) {
  return (
    <View style={[styles.row, stacked && styles.rowStack]}>
      <View style={styles.rowLeft}>
        <AppText>{leftTitle}</AppText>
        <AppText variant="caption">{leftMeta}</AppText>
      </View>
      <View style={[styles.rowRight, stacked && styles.rowRightStack]}>
        <AppText>{rightTitle}</AppText>
        <AppText variant="caption">{rightMeta}</AppText>
      </View>
    </View>
  );
}

function DetailField({
  label,
  value,
  style,
}: {
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.detailField, style]}>
      <AppText variant="caption">{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, paddingBottom: 24 },
  hero: { gap: 14, minWidth: 0 },
  focusPanel: { borderWidth: 1, gap: 14, padding: 14 },
  focusPanelHeader: { flexDirection: 'row', gap: 12 },
  focusPanelCopy: { flex: 1, gap: 4 },
  focusIconShell: { alignItems: 'center', borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  focusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  focusPrimaryAction: {
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 11,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  focusSecondaryAction: { borderWidth: 1, minHeight: 42, paddingHorizontal: 16, paddingVertical: 11 },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaPill: { alignItems: 'center', borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  section: { gap: 10 },
  sectionHeader: { gap: 4, paddingHorizontal: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fullWidth: { flexBasis: '100%' },
  halfWidth: { flexBasis: '48%' },
  thirdWidth: { flexBasis: '31.5%' },
  quarterWidth: { flexBasis: '23.5%' },
  metricCard: { minWidth: 0 },
  pulseHeader: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  pulseHeaderCopy: { flex: 1, gap: 4 },
  iconShell: { alignItems: 'center', borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  actionCard: { borderWidth: 1, gap: 10, minHeight: 126, minWidth: 0, padding: 16, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.12, shadowRadius: 22 },
  actionFooter: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 'auto' },
  alertList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  alertWrapper: { minWidth: 0 },
  alertCard: { borderWidth: 1, gap: 10, padding: 16, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.12, shadowRadius: 22 },
  alertHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  alertIcon: { alignItems: 'center', borderWidth: 1, height: 38, justifyContent: 'center', width: 38 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailField: { gap: 4, minWidth: 0 },
  list: { gap: 12 },
  row: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  rowStack: { alignItems: 'flex-start', flexDirection: 'column' },
  rowLeft: { flex: 1, gap: 3 },
  rowRight: { alignItems: 'flex-end', gap: 3 },
  rowRightStack: { alignItems: 'flex-start' },
});
