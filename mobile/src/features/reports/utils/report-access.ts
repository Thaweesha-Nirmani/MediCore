import { appRoles, normalizeAppRole } from '@/constants/auth';

export function getReportPermissions(role?: string | null) {
  const normalizedRole = normalizeAppRole(role);
  const canRead =
    normalizedRole === appRoles.admin ||
    normalizedRole === appRoles.pharmacist ||
    normalizedRole === appRoles.inventoryManager ||
    normalizedRole === appRoles.purchasingManager ||
    normalizedRole === appRoles.supplierManager;

  return {
    role: normalizedRole,
    canRead,
  };
}
