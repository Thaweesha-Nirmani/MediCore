export const appRoles = {
  admin: 'admin',
  pharmacist: 'pharmacist',
  cashier: 'cashier',
  inventoryManager: 'inventory_manager',
  purchasingManager: 'purchasing_manager',
  supplierManager: 'supplier_manager',
} as const;

export type AppRole = (typeof appRoles)[keyof typeof appRoles];

const roleAliases: Record<string, AppRole> = {
  admin: appRoles.admin,
  administrator: appRoles.admin,
  pharmacist: appRoles.pharmacist,
  staff: appRoles.pharmacist,
  cashier: appRoles.cashier,
  inventory_manager: appRoles.inventoryManager,
  'inventory manager': appRoles.inventoryManager,
  inventorymanager: appRoles.inventoryManager,
  purchasing_manager: appRoles.purchasingManager,
  'purchasing manager': appRoles.purchasingManager,
  purchase_manager: appRoles.purchasingManager,
  buyer: appRoles.purchasingManager,
  supplier_manager: appRoles.supplierManager,
  'supplier manager': appRoles.supplierManager,
};

const roleLabels: Record<AppRole, string> = {
  [appRoles.admin]: 'Administrator',
  [appRoles.pharmacist]: 'Pharmacist',
  [appRoles.cashier]: 'Cashier',
  [appRoles.inventoryManager]: 'Inventory Manager',
  [appRoles.purchasingManager]: 'Purchasing Manager',
  [appRoles.supplierManager]: 'Supplier Manager',
};

export function normalizeAppRole(role?: string | null): AppRole | null {
  const normalized = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (!normalized) {
    return null;
  }

  return roleAliases[normalized] || roleAliases[normalized.replace(/_/g, ' ')] || null;
}

export function getRoleLabel(role?: string | null) {
  const normalized = normalizeAppRole(role);
  return normalized ? roleLabels[normalized] : 'Team Member';
}
