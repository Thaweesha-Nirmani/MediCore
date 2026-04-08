import { appRoles, normalizeAppRole } from '@/constants/auth';

export function getPurchasePermissions(role?: string | null) {
  const normalizedRole = normalizeAppRole(role);
  const canRead =
    normalizedRole === appRoles.admin ||
    normalizedRole === appRoles.pharmacist ||
    normalizedRole === appRoles.inventoryManager ||
    normalizedRole === appRoles.purchasingManager;
  const canManage = canRead;
  const canReceive = canRead;

  return {
    role: normalizedRole,
    canRead,
    canManage,
    canReceive,
  };
}
