import type { ComponentProps } from 'react';

import { Ionicons } from '@expo/vector-icons';

import { appRoles, normalizeAppRole, type AppRole } from '@/constants/auth';
import { appRoutes } from '@/constants/routes';

export type AppTabName = 'dashboard' | 'medicines' | 'inventory' | 'sales' | 'more';

type TabIconName = ComponentProps<typeof Ionicons>['name'];

type TabDefinition = {
  name: AppTabName;
  label: string;
  route: string;
  icon: TabIconName;
  activeIcon: TabIconName;
  description: string;
  roles?: string[];
};

const roleTabOrder: Partial<Record<AppRole, AppTabName[]>> = {
  [appRoles.admin]: ['dashboard', 'medicines', 'inventory', 'sales', 'more'],
  [appRoles.pharmacist]: ['dashboard', 'medicines', 'inventory', 'sales', 'more'],
  [appRoles.cashier]: ['sales', 'dashboard', 'medicines', 'more'],
  [appRoles.inventoryManager]: ['inventory', 'dashboard', 'more'],
  [appRoles.purchasingManager]: ['more', 'dashboard'],
  [appRoles.supplierManager]: ['more', 'dashboard'],
};

const roleTabOverrides: Partial<
  Record<AppRole, Partial<Record<AppTabName, Partial<Pick<TabDefinition, 'label' | 'description'>>>>>
> = {
  [appRoles.cashier]: {
    dashboard: {
      label: 'Home',
      description: 'Sales pulse and role-aware counter shortcuts.',
    },
    medicines: {
      description: 'Medicine lookup for faster billing and product confirmation.',
    },
    sales: {
      label: 'POS',
      description: 'Fast cashier billing, invoice history, and cart flow.',
    },
    more: {
      label: 'Account',
      description: 'Session actions, sales history shortcuts, and secondary tools.',
    },
  },
  [appRoles.inventoryManager]: {
    dashboard: {
      label: 'Home',
      description: 'Stock pressure, expiry risk, and receiving awareness.',
    },
    inventory: {
      label: 'Stock',
      description: 'Batch-first stock control, shortages, expiry, and movements.',
    },
    more: {
      label: 'Ops',
      description: 'Procurement links, account actions, and secondary operations.',
    },
  },
  [appRoles.purchasingManager]: {
    dashboard: {
      label: 'Home',
      description: 'Procurement summary with open-order awareness.',
    },
    more: {
      label: 'Ops',
      description: 'Suppliers, purchases, reports, and procurement tools.',
    },
  },
  [appRoles.supplierManager]: {
    dashboard: {
      label: 'Home',
      description: 'Supplier activity, order signals, and procurement awareness.',
    },
    more: {
      label: 'Ops',
      description: 'Supplier records, purchases, reports, and session tools.',
    },
  },
};

export const tabDefinitions: TabDefinition[] = [
  {
    name: 'dashboard',
    label: 'Home',
    route: appRoutes.dashboard,
    icon: 'grid-outline',
    activeIcon: 'grid',
    description: 'Role-aware home with alerts, recent movement, and quick actions.',
  },
  {
    name: 'medicines',
    label: 'Medicines',
    route: appRoutes.medicines,
    icon: 'medkit-outline',
    activeIcon: 'medkit',
    description: 'Medicine catalog lookup, search, and controlled product updates.',
    roles: [appRoles.admin, appRoles.pharmacist, appRoles.cashier],
  },
  {
    name: 'inventory',
    label: 'Stock',
    route: appRoutes.inventory,
    icon: 'cube-outline',
    activeIcon: 'cube',
    description: 'Operational stock, batch controls, low-stock monitoring, and expiry checks.',
    roles: [appRoles.admin, appRoles.pharmacist, appRoles.inventoryManager],
  },
  {
    name: 'sales',
    label: 'POS',
    route: appRoutes.sales,
    icon: 'receipt-outline',
    activeIcon: 'receipt',
    description: 'POS billing, medicine lookup, and fast cashier workflows.',
    roles: [appRoles.admin, appRoles.pharmacist, appRoles.cashier],
  },
  {
    name: 'more',
    label: 'More',
    route: appRoutes.more,
    icon: 'ellipsis-horizontal-circle-outline',
    activeIcon: 'ellipsis-horizontal-circle',
    description: 'Role-scoped tools, account access, and secondary operations.',
  },
];

function applyTabOverrides(tab: TabDefinition, role?: AppRole | null): TabDefinition {
  if (!role) {
    return tab;
  }

  const overrides = roleTabOverrides[role]?.[tab.name];
  if (!overrides) {
    return tab;
  }

  return {
    ...tab,
    ...overrides,
  };
}

function sortTabsByRole(tabs: TabDefinition[], role?: AppRole | null) {
  const order = role ? roleTabOrder[role] || [] : [];

  if (!order.length) {
    return tabs;
  }

  return [...tabs].sort((left, right) => {
    const leftIndex = order.indexOf(left.name);
    const rightIndex = order.indexOf(right.name);
    const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    return normalizedLeft - normalizedRight;
  });
}

export function getAccessibleTabs(role?: string | null) {
  const normalizedRole = normalizeAppRole(role);

  const visibleTabs = tabDefinitions.filter((tab) => {
    if (!tab.roles?.length) {
      return true;
    }

    return normalizedRole ? tab.roles.includes(normalizedRole) : false;
  });

  return sortTabsByRole(visibleTabs, normalizedRole).map((tab) =>
    applyTabOverrides(tab, normalizedRole)
  );
}

export function canAccessTab(name: string | undefined, role?: string | null) {
  if (!name) {
    return false;
  }

  return getAccessibleTabs(role).some((tab) => tab.name === name);
}

export function getDefaultAppRoute(role?: string | null) {
  const normalizedRole = normalizeAppRole(role);

  if (normalizedRole === appRoles.cashier) {
    return appRoutes.sales;
  }

  if (normalizedRole === appRoles.inventoryManager) {
    return appRoutes.inventory;
  }

  if (normalizedRole === appRoles.purchasingManager) {
    return appRoutes.purchases;
  }

  if (normalizedRole === appRoles.supplierManager) {
    return appRoutes.suppliers;
  }

  return appRoutes.dashboard;
}
