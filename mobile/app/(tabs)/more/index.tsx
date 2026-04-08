import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { ThemePreferenceControl } from '@/components/ui/ThemePreferenceControl';
import { appRoles, getRoleLabel, normalizeAppRole } from '@/constants/auth';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { getDisplayInitials } from '@/features/auth/utils/user-display';
import { getPurchasePermissions } from '@/features/purchases/utils/purchase-access';
import { getReportPermissions } from '@/features/reports/utils/report-access';
import { getReviewPermissions } from '@/features/reviews/utils/review-access';
import { getSupplierPermissions } from '@/features/suppliers/utils/supplier-access';
import { getUserPermissions } from '@/features/users/utils/user-access';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getAccessibleTabs, getDefaultAppRoute } from '@/navigation/tabs';
import { useAppTheme } from '@/theme/useAppTheme';

function formatLastLogin(value?: string | null) {
  if (!value) {
    return 'Current session active';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Current session active';
  }

  return date.toLocaleString('en-LK', {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

type HubCardItem = {
  title: string;
  caption: string;
  description: string;
  primaryLabel: string;
  primaryRoute: Href;
  secondaryLabel?: string;
  secondaryRoute?: Href;
};

type WorkspaceItem = {
  title: string;
  description: string;
  route: Href;
  isDefault?: boolean;
};

type Role = ReturnType<typeof normalizeAppRole>;

export default function MoreIndexRoute() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const logoutMutation = useLogout();
  const { user } = useAuthSession();
  const role = normalizeAppRole(user?.role);
  const accessibleTabs = getAccessibleTabs(user?.role).filter((tab) => tab.name !== 'more');
  const supplierPermissions = getSupplierPermissions(user?.role);
  const purchasePermissions = getPurchasePermissions(user?.role);
  const reportPermissions = getReportPermissions(user?.role);
  const reviewPermissions = getReviewPermissions(user?.role);
  const userPermissions = getUserPermissions(user?.role, user?.id, user?.id);
  const defaultRoute = getDefaultAppRoute(user?.role) as Href;
  const appearanceLabel =
    theme.themePreference === 'system'
      ? `System (${theme.resolvedThemeMode === 'dark' ? 'Dark' : 'Light'})`
      : theme.resolvedThemeMode === 'dark'
        ? 'Dark'
        : 'Light';

  const navigationFlags = {
    canOpenMedicines: accessibleTabs.some((tab) => tab.name === 'medicines'),
    canOpenInventory: accessibleTabs.some((tab) => tab.name === 'inventory'),
    canOpenSales: accessibleTabs.some((tab) => tab.name === 'sales'),
    canOpenSuppliers: supplierPermissions.canRead,
    canManageSuppliers: supplierPermissions.canManage,
    canOpenPurchases: purchasePermissions.canRead,
    canManagePurchases: purchasePermissions.canManage,
    canOpenReports: reportPermissions.canRead,
    canOpenUsers: userPermissions.canManage,
    canOpenReviews: reviewPermissions.canRead,
  };

  const hero = getHubHero(role);
  const primaryTasks = getPrimaryTaskCards(role, navigationFlags);
  const operationsCards = getOperationsCards(role, navigationFlags);
  const workspaces = getWorkspaceCards(accessibleTabs, defaultRoute);

  function handleLogout() {
    if (logoutMutation.isPending) {
      return;
    }

    if (Platform.OS === 'web') {
      const confirmed =
        typeof globalThis.confirm === 'function'
          ? globalThis.confirm('This will remove the current session from this device.')
          : true;

      if (confirmed) {
        logoutMutation.mutate();
      }

      return;
    }

    Alert.alert(
      'Sign out',
      'This will remove the current session from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => logoutMutation.mutate(),
        },
      ],
      { cancelable: true }
    );
  }

  return (
    <AppScreen contentWidth="wide">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AppCard variant="hero">
          <View style={styles.heroContent}>
            <View style={[styles.header, !responsive.isMdUp && styles.headerStack]}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: user?.color || theme.colors.primary,
                    borderColor: theme.colors.borderStrong,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <AppText style={styles.avatarText}>{getDisplayInitials(user)}</AppText>
              </View>
              <View style={styles.headerCopy}>
                <AppText variant="caption">{hero.eyebrow}</AppText>
                <AppText variant="title">{hero.title}</AppText>
                <AppText>{hero.message}</AppText>
                <AppText variant="caption">{getRoleLabel(user?.role)}</AppText>
              </View>
            </View>

            <View style={styles.heroMetrics}>
              <View
                style={[
                  styles.metricCard,
                  responsive.isLgUp
                    ? styles.thirdWidth
                    : responsive.isMdUp
                      ? styles.halfWidth
                      : styles.fullWidth,
                ]}
              >
                <AppText variant="caption">Focus</AppText>
                <AppText variant="subtitle">{hero.focus}</AppText>
              </View>
              <View
                style={[
                  styles.metricCard,
                  responsive.isLgUp
                    ? styles.thirdWidth
                    : responsive.isMdUp
                      ? styles.halfWidth
                      : styles.fullWidth,
                ]}
              >
                <AppText variant="caption">Primary areas</AppText>
                <AppText variant="subtitle">{accessibleTabs.length}</AppText>
              </View>
              <View
                style={[
                  styles.metricCard,
                  responsive.isLgUp
                    ? styles.thirdWidth
                    : responsive.isMdUp
                      ? styles.halfWidth
                      : styles.fullWidth,
                ]}
              >
                <AppText variant="caption">Default landing</AppText>
                <AppText variant="subtitle">{getRouteLabel(defaultRoute)}</AppText>
              </View>
            </View>

            <View
              style={[
                styles.noticeCard,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.borderStrong,
                  borderRadius: theme.radius.lg,
                },
              ]}
            >
              <AppText variant="caption">
                Only tools available to your current role are shown here, so unavailable manager
                actions stay hidden instead of creating dead ends.
              </AppText>
            </View>
          </View>
        </AppCard>

        {primaryTasks.length ? (
          <AppCard variant="subtle">
            <SectionHeader
              title={getPrimarySectionTitle(role)}
              subtitle={getPrimarySectionSubtitle(role)}
            />
            <View style={styles.operationsList}>
              {primaryTasks.map((item) => (
                <OperationCard
                  key={`${item.title}-${item.primaryLabel}`}
                  title={item.title}
                  caption={item.caption}
                  description={item.description}
                  primaryLabel={item.primaryLabel}
                  secondaryLabel={item.secondaryLabel}
                  stackActions={!responsive.isMdUp}
                  onPrimaryPress={() => router.push(item.primaryRoute)}
                  onSecondaryPress={
                    item.secondaryRoute ? () => router.push(item.secondaryRoute as Href) : undefined
                  }
                />
              ))}
            </View>
          </AppCard>
        ) : null}

        {operationsCards.length ? (
          <AppCard variant="subtle">
            <SectionHeader
              title={getOperationsSectionTitle(role)}
              subtitle={getOperationsSectionSubtitle(role)}
            />
            <View style={styles.operationsList}>
              {operationsCards.map((item) => (
                <OperationCard
                  key={`${item.title}-${item.primaryLabel}`}
                  title={item.title}
                  caption={item.caption}
                  description={item.description}
                  primaryLabel={item.primaryLabel}
                  secondaryLabel={item.secondaryLabel}
                  stackActions={!responsive.isMdUp}
                  onPrimaryPress={() => router.push(item.primaryRoute)}
                  onSecondaryPress={
                    item.secondaryRoute ? () => router.push(item.secondaryRoute as Href) : undefined
                  }
                />
              ))}
            </View>
          </AppCard>
        ) : null}

        <AppCard variant="subtle">
          <SectionHeader
            title="Primary workspaces"
            subtitle="Your visible tabs stay task-first and role-scoped for faster mobile movement."
          />
          <View style={styles.workspaceList}>
            {workspaces.map((item) => (
              <WorkspaceCard
                key={`${item.title}-${item.route}`}
                item={item}
                stacked={!responsive.isMdUp}
                onPress={() => router.push(item.route)}
              />
            ))}
          </View>
        </AppCard>

        <AppCard variant="subtle">
          <SectionHeader
            title="Account summary"
            subtitle="Quick session context without turning this hub into a settings dump."
          />
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Session</AppText>
            <AppText>{formatLastLogin(user?.lastLogin)}</AppText>
          </View>
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Role access</AppText>
            <AppText>{accessibleTabs.length} primary areas ready</AppText>
          </View>
        </AppCard>

        <AppCard variant="subtle">
          <SectionHeader
            title="Session and settings"
            subtitle="Keep sign-out and session controls together so they are easy to find."
          />
          <View
            style={[
              styles.settingPanel,
              responsive.isMdUp && styles.settingPanelWide,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.borderStrong,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <View style={[styles.settingPanelCopy, responsive.isMdUp && styles.settingPanelCopyWide]}>
              <AppText style={styles.infoLabel}>Appearance</AppText>
              <AppText numberOfLines={responsive.isMdUp ? 3 : undefined} variant="caption">
                Available to every role and saved on this device. Current mode: {appearanceLabel}.
              </AppText>
            </View>
            <ThemePreferenceControl
              includeSystem
              style={[styles.themeControl, responsive.isMdUp ? styles.themeControlWide : null]}
            />
          </View>
          <View style={styles.actionsStack}>
            <AppButton
              label={logoutMutation.isPending ? 'Signing out' : 'Sign out'}
              loading={logoutMutation.isPending}
              variant="destructive"
              onPress={handleLogout}
            />
          </View>
        </AppCard>
      </ScrollView>
    </AppScreen>
  );
}

function getHubHero(role: Role) {
  if (role === appRoles.cashier) {
    return {
      eyebrow: 'Account and support',
      title: 'Counter support hub',
      message:
        'Keep session actions, invoice review, and quick lookup tools close without crowding the POS tab.',
      focus: 'Sales desk',
    };
  }

  if (role === appRoles.inventoryManager) {
    return {
      eyebrow: 'Stock operations',
      title: 'Operational stock hub',
      message:
        'Use this space for stock-linked follow-up tasks, procurement support, and session access.',
      focus: 'Stock control',
    };
  }

  if (role === appRoles.purchasingManager) {
    return {
      eyebrow: 'Procurement hub',
      title: 'Orders and supplier flow',
      message:
        'This hub keeps supplier, purchase, and reporting actions together so procurement work starts in the right place.',
      focus: 'Purchasing',
    };
  }

  if (role === appRoles.supplierManager) {
    return {
      eyebrow: 'Supplier operations',
      title: 'Vendor coordination hub',
      message:
        'Open supplier records, follow purchase activity, and review reports without digging through unrelated tools.',
      focus: 'Supplier management',
    };
  }

  if (role === appRoles.pharmacist) {
    return {
      eyebrow: 'Clinical operations',
      title: 'Secondary operations hub',
      message:
        'Keep procurement, reporting, and account actions available here while your main care workflows stay in the primary tabs.',
      focus: 'Pharmacy ops',
    };
  }

    return {
      eyebrow: 'Operations hub',
      title: 'Administrative control hub',
      message:
      'Move into staff access, procurement, reporting, and account actions from one role-aware secondary workspace.',
      focus: 'System overview',
    };
}

function getPrimaryTaskCards(
  role: Role,
  flags: {
    canOpenMedicines: boolean;
    canOpenInventory: boolean;
    canOpenSales: boolean;
    canOpenSuppliers: boolean;
    canManageSuppliers: boolean;
    canOpenPurchases: boolean;
    canManagePurchases: boolean;
    canOpenReports: boolean;
    canOpenUsers: boolean;
    canOpenReviews: boolean;
  }
): HubCardItem[] {
  const items: HubCardItem[] = [];
  const add = (enabled: boolean, item: HubCardItem) => enabled && items.push(item);

  if (role === appRoles.admin) {
    add(flags.canOpenUsers, {
      title: 'Staff directory',
      caption: 'Access control',
      description: 'Review role assignments, account status, and staff profile updates from mobile.',
      primaryLabel: 'Open staff',
      primaryRoute: appRoutes.users as Href,
      secondaryLabel: 'Add staff',
      secondaryRoute: appRoutes.userAdd,
    });
  }

  if (role === appRoles.cashier) {
    add(flags.canOpenSales, {
      title: 'POS',
      caption: 'Fast return',
      description: 'Jump back into billing immediately when you open More by mistake or need to resume sales.',
      primaryLabel: 'Open POS',
      primaryRoute: appRoutes.sales,
      secondaryLabel: 'Sales history',
      secondaryRoute: appRoutes.salesHistory,
    });
    add(flags.canOpenMedicines, {
      title: 'Medicine lookup',
      caption: 'Counter support',
      description: 'Check medicine details or search the catalog without exposing manager-only tools.',
      primaryLabel: 'Open medicines',
      primaryRoute: appRoutes.medicines,
    });
    return items;
  }

  if (role === appRoles.inventoryManager) {
    add(flags.canOpenInventory, {
      title: 'Low stock',
      caption: 'Shortage response',
      description: 'Open the low-stock queue first when replenishment pressure is building.',
      primaryLabel: 'Open low stock',
      primaryRoute: appRoutes.inventoryLowStock,
      secondaryLabel: 'Expiry',
      secondaryRoute: appRoutes.inventoryExpiry,
    });
    add(flags.canOpenInventory, {
      title: 'Stock movement',
      caption: 'Audit trail',
      description: 'Review recent inventory movements and follow adjustments or receiving updates quickly.',
      primaryLabel: 'Open movements',
      primaryRoute: appRoutes.inventoryMovements,
      secondaryLabel: 'Open stock',
      secondaryRoute: appRoutes.inventory,
    });
    add(flags.canOpenPurchases, {
      title: 'Purchases',
      caption: 'Receiving support',
      description: 'Track open purchase orders and coordinate with receiving without leaving the stock workflow.',
      primaryLabel: 'Open purchases',
      primaryRoute: appRoutes.purchases,
    });
    return items;
  }

  if (role === appRoles.purchasingManager) {
    add(flags.canOpenPurchases, {
      title: 'Purchases',
      caption: 'Primary workflow',
      description: 'Open purchase orders first and move directly into new orders or receiving follow-up.',
      primaryLabel: 'Open purchases',
      primaryRoute: appRoutes.purchases,
      secondaryLabel: flags.canManagePurchases ? 'New purchase' : undefined,
      secondaryRoute: flags.canManagePurchases ? appRoutes.purchaseAdd : undefined,
    });
    add(flags.canOpenSuppliers, {
      title: 'Suppliers',
      caption: 'Vendor coordination',
      description: 'Keep supplier records close for contact checks and procurement communication.',
      primaryLabel: 'Open suppliers',
      primaryRoute: appRoutes.suppliers,
    });
    return items;
  }

  if (role === appRoles.supplierManager) {
    add(flags.canOpenSuppliers, {
      title: 'Suppliers',
      caption: 'Primary workflow',
      description: 'Start from supplier records and move into add/edit work without exposing unrelated actions.',
      primaryLabel: 'Open suppliers',
      primaryRoute: appRoutes.suppliers,
      secondaryLabel: flags.canManageSuppliers ? 'Add supplier' : undefined,
      secondaryRoute: flags.canManageSuppliers ? appRoutes.supplierAdd : undefined,
    });
    add(flags.canOpenPurchases, {
      title: 'Purchases',
      caption: 'Order coordination',
      description: 'Review purchase activity that depends on current supplier records and follow-up.',
      primaryLabel: 'Open purchases',
      primaryRoute: appRoutes.purchases,
    });
    return items;
  }

  return items;
}

function getOperationsCards(
  role: Role,
  flags: {
    canOpenMedicines: boolean;
    canOpenInventory: boolean;
    canOpenSales: boolean;
    canOpenSuppliers: boolean;
    canManageSuppliers: boolean;
    canOpenPurchases: boolean;
    canManagePurchases: boolean;
    canOpenReports: boolean;
    canOpenUsers: boolean;
    canOpenReviews: boolean;
  }
): HubCardItem[] {
  const items: HubCardItem[] = [];
  const add = (enabled: boolean, item: HubCardItem) => enabled && items.push(item);

  if (role === appRoles.purchasingManager || role === appRoles.supplierManager) {
    add(flags.canOpenReports, {
      title: 'Reports',
      caption: 'Procurement insight',
      description: 'Review concise purchasing and stock-related reports sized for mobile decision-making.',
      primaryLabel: 'Open reports',
      primaryRoute: appRoutes.reports,
    });
    add(flags.canOpenMedicines, {
      title: 'Catalog',
      caption: 'Reference lookup',
      description: 'Check medicine records while reviewing suppliers or purchase lines.',
      primaryLabel: 'Open catalog',
      primaryRoute: appRoutes.medicines,
    });
    add(flags.canOpenReviews, {
      title: 'Reviews',
      caption: 'Operational feedback',
      description: 'Track current mobile feedback and report procurement issues without leaving the app.',
      primaryLabel: 'Open reviews',
      primaryRoute: appRoutes.reviews as Href,
      secondaryLabel: 'New review',
      secondaryRoute: appRoutes.reviewAdd,
    });
    return items;
  }

  if (role === appRoles.inventoryManager) {
    add(flags.canOpenReports, {
      title: 'Reports',
      caption: 'Trend review',
      description: 'Open stock and expiry reports when low-stock or batch issues need broader context.',
      primaryLabel: 'Open reports',
      primaryRoute: appRoutes.reports,
    });
    add(flags.canOpenReviews, {
      title: 'Reviews',
      caption: 'Operational feedback',
      description: 'Capture stock and receiving issues directly from the mobile operations flow.',
      primaryLabel: 'Open reviews',
      primaryRoute: appRoutes.reviews as Href,
      secondaryLabel: 'New review',
      secondaryRoute: appRoutes.reviewAdd,
    });
    return items;
  }

  add(flags.canOpenUsers, {
    title: 'Staff access',
    caption: 'Administrative controls',
    description: 'Manage staff roles and account status from the same mobile hub used for reporting and procurement.',
    primaryLabel: 'Open staff',
    primaryRoute: appRoutes.users as Href,
    secondaryLabel: 'Add staff',
    secondaryRoute: appRoutes.userAdd,
  });

  add(flags.canOpenSuppliers, {
    title: 'Suppliers',
    caption: 'Business contacts',
    description: 'Browse supplier records, verify contact details, and keep procurement communication current.',
    primaryLabel: 'Open suppliers',
    primaryRoute: appRoutes.suppliers,
    secondaryLabel: flags.canManageSuppliers ? 'Add supplier' : undefined,
    secondaryRoute: flags.canManageSuppliers ? appRoutes.supplierAdd : undefined,
  });

  add(flags.canOpenPurchases, {
    title: 'Purchases',
    caption: 'Orders and receiving',
    description: 'Create purchase orders, track receiving progress, and move deliveries into inventory.',
    primaryLabel: 'Open purchases',
    primaryRoute: appRoutes.purchases,
    secondaryLabel: flags.canManagePurchases ? 'New purchase' : undefined,
    secondaryRoute: flags.canManagePurchases ? appRoutes.purchaseAdd : undefined,
  });

  add(flags.canOpenReports, {
    title: 'Reports',
    caption: 'Mobile reporting',
    description: 'Review concise sales, stock, expiry, and purchase reports with mobile-sized filters.',
    primaryLabel: 'Open reports',
    primaryRoute: appRoutes.reports,
  });

  add(flags.canOpenReviews, {
    title: 'Reviews',
    caption: 'Workflow feedback',
    description: 'Capture issues, suggestions, and workflow notes in the same system used by the web reference app.',
    primaryLabel: 'Open reviews',
    primaryRoute: appRoutes.reviews as Href,
    secondaryLabel: 'New review',
    secondaryRoute: appRoutes.reviewAdd,
  });

  return items;
}

function getWorkspaceCards(
  tabs: ReturnType<typeof getAccessibleTabs>,
  defaultRoute: Href
): WorkspaceItem[] {
  return tabs.map((tab) => ({
    title: tab.label,
    description: tab.description,
    route: tab.route as Href,
    isDefault: tab.route === defaultRoute,
  }));
}

function getRouteLabel(route: Href) {
  if (route === appRoutes.sales) return 'POS';
  if (route === appRoutes.inventory) return 'Stock';
  if (route === appRoutes.purchases) return 'Purchases';
  if (route === appRoutes.suppliers) return 'Suppliers';
  if (route === appRoutes.dashboard) return 'Home';
  return 'Workspace';
}

function getPrimarySectionTitle(role: Role) {
  if (role === appRoles.cashier) return 'Counter support';
  if (role === appRoles.inventoryManager) return 'Stock-first tasks';
  if (role === appRoles.purchasingManager) return 'Core procurement tasks';
  if (role === appRoles.supplierManager) return 'Core supplier tasks';
  return 'Role focus';
}

function getPrimarySectionSubtitle(role: Role) {
  if (role === appRoles.cashier) return 'Quick routes for the tasks that matter around the counter.';
  if (role === appRoles.inventoryManager) return 'High-frequency stock actions without unnecessary navigation.';
  if (role === appRoles.purchasingManager) return 'Start where orders and vendor coordination happen most often.';
  if (role === appRoles.supplierManager) return 'Keep supplier records and related order work one tap away.';
  return 'Task-first shortcuts shaped by your current role.';
}

function getOperationsSectionTitle(role: Role) {
  if (role === appRoles.purchasingManager || role === appRoles.supplierManager) {
    return 'Supporting operations';
  }

  return 'Operations modules';
}

function getOperationsSectionSubtitle(role: Role) {
  if (role === appRoles.purchasingManager || role === appRoles.supplierManager) {
    return 'Secondary tools that support the main procurement flow without crowding it.';
  }

  return 'Secondary workflows grouped here so the main tabs stay focused.';
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="subtitle">{title}</AppText>
      <AppText variant="caption">{subtitle}</AppText>
    </View>
  );
}

function OperationCard({
  title,
  caption,
  description,
  primaryLabel,
  secondaryLabel,
  stackActions = false,
  onPrimaryPress,
  onSecondaryPress,
}: {
  title: string;
  caption: string;
  description: string;
  primaryLabel: string;
  secondaryLabel?: string;
  stackActions?: boolean;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
}) {
  return (
    <View style={styles.operationCard}>
      <View style={styles.operationCopy}>
        <AppText variant="caption">{caption}</AppText>
        <AppText variant="subtitle">{title}</AppText>
        <AppText>{description}</AppText>
      </View>
      <View style={[styles.actionsRow, stackActions && styles.actionsRowStack]}>
        <AppButton label={primaryLabel} onPress={onPrimaryPress} style={styles.actionButton} />
        {secondaryLabel ? (
          <AppButton
            label={secondaryLabel}
            variant="secondary"
            onPress={onSecondaryPress}
            style={styles.actionButton}
          />
        ) : null}
      </View>
    </View>
  );
}

function WorkspaceCard({
  item,
  stacked = false,
  onPress,
}: {
  item: WorkspaceItem;
  stacked?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={[styles.workspaceRow, stacked && styles.workspaceRowStack]}>
      <View style={styles.workspaceCopy}>
        <View style={styles.workspaceTitleRow}>
          <AppText style={styles.infoLabel}>{item.title}</AppText>
          {item.isDefault ? <AppText variant="caption">Default</AppText> : null}
        </View>
        <AppText variant="caption">{item.description}</AppText>
      </View>
      <AppButton label="Open" variant="secondary" onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 24,
  },
  heroContent: {
    gap: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  headerStack: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  avatar: {
    alignItems: 'center',
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    gap: 4,
    minWidth: 0,
  },
  fullWidth: {
    flexBasis: '100%',
  },
  halfWidth: {
    flexBasis: '48%',
  },
  thirdWidth: {
    flexBasis: '31.5%',
  },
  noticeCard: {
    borderWidth: 1,
    padding: 14,
  },
  sectionHeader: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontWeight: '700',
  },
  operationsList: {
    gap: 14,
  },
  operationCard: {
    gap: 12,
  },
  operationCopy: {
    gap: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionsRowStack: {
    flexDirection: 'column',
  },
  actionButton: {
    flex: 1,
  },
  workspaceList: {
    gap: 12,
  },
  workspaceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  workspaceRowStack: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  workspaceCopy: {
    flex: 1,
    gap: 3,
  },
  workspaceTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionsStack: {
    gap: 10,
  },
  settingPanel: {
    alignItems: 'stretch',
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  settingPanelWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  settingPanelCopy: {
    flexGrow: 1,
    flexShrink: 1,
    gap: 4,
    minWidth: 0,
  },
  settingPanelCopyWide: {
    flexBasis: 240,
    maxWidth: 420,
    minWidth: 220,
  },
  themeControl: {
    minWidth: 0,
    width: '100%',
  },
  themeControlWide: {
    flexShrink: 0,
    width: 320,
  },
});
