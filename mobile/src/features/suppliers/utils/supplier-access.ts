import { appRoles, normalizeAppRole } from '@/constants/auth';

export function getSupplierPermissions(role?: string | null) {
  const normalizedRole = normalizeAppRole(role);
  const canRead =
    normalizedRole === appRoles.admin ||
    normalizedRole === appRoles.pharmacist ||
    normalizedRole === appRoles.inventoryManager ||
    normalizedRole === appRoles.purchasingManager ||
    normalizedRole === appRoles.supplierManager;
  const canManage = canRead;

  return {
    role: normalizedRole,
    canRead,
    canManage,
  };
}
