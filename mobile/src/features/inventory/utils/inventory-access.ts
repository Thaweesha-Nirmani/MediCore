import { appRoles, normalizeAppRole } from '@/constants/auth';

export function getInventoryPermissions(role?: string | null) {
  const normalizedRole = normalizeAppRole(role);
  const canRead =
    normalizedRole === appRoles.admin ||
    normalizedRole === appRoles.pharmacist ||
    normalizedRole === appRoles.inventoryManager ||
    normalizedRole === appRoles.cashier;
  const canManage =
    normalizedRole === appRoles.admin ||
    normalizedRole === appRoles.pharmacist ||
    normalizedRole === appRoles.inventoryManager;

  return {
    role: normalizedRole,
    canRead,
    canManage,
  };
}
