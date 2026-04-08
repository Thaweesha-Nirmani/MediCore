import { appRoles, normalizeAppRole } from '@/constants/auth';

export function getMedicinePermissions(role?: string | null) {
  const normalizedRole = normalizeAppRole(role);
  const canRead =
    normalizedRole === appRoles.admin ||
    normalizedRole === appRoles.pharmacist ||
    normalizedRole === appRoles.cashier ||
    normalizedRole === appRoles.inventoryManager;
  const canCreate =
    normalizedRole === appRoles.admin ||
    normalizedRole === appRoles.pharmacist ||
    normalizedRole === appRoles.inventoryManager;
  const canEdit = normalizedRole === appRoles.admin;
  const canArchive = normalizedRole === appRoles.admin;
  const canRestore = normalizedRole === appRoles.admin;

  return {
    role: normalizedRole,
    canRead,
    canCreate,
    canEdit,
    canArchive,
    canRestore,
  };
}
