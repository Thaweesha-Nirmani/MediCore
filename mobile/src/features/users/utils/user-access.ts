import { appRoles, normalizeAppRole } from '@/constants/auth';

export function getUserPermissions(role?: string | null, currentUserId?: string | null, targetUserId?: string | null) {
  const normalizedRole = normalizeAppRole(role);
  const isSelf = Boolean(currentUserId && targetUserId && currentUserId === targetUserId);
  const canManage = normalizedRole === appRoles.admin;
  const canRead = canManage || isSelf;
  const canCreate = canManage;
  const canUpdateStatus = canManage;

  return {
    role: normalizedRole,
    isSelf,
    canRead,
    canCreate,
    canManage,
    canUpdateStatus,
  };
}
