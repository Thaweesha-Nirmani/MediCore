import { appRoles, normalizeAppRole } from '@/constants/auth';

export function getSalesPermissions(role?: string | null) {
  const normalizedRole = normalizeAppRole(role);
  const canRead =
    normalizedRole === appRoles.admin ||
    normalizedRole === appRoles.pharmacist ||
    normalizedRole === appRoles.cashier;
  const canSell = canRead;

  return {
    role: normalizedRole,
    canRead,
    canSell,
  };
}
