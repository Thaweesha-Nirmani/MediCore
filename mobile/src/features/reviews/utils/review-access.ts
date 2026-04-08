import { appRoles, normalizeAppRole } from '@/constants/auth';

import type { ReviewItem } from '@/features/reviews/types';

export function getReviewPermissions(role?: string | null, review?: ReviewItem | null) {
  const normalizedRole = normalizeAppRole(role);
  const canManageAll =
    normalizedRole === appRoles.admin ||
    normalizedRole === appRoles.pharmacist ||
    normalizedRole === appRoles.inventoryManager ||
    normalizedRole === appRoles.purchasingManager ||
    normalizedRole === appRoles.supplierManager;

  const canRead = Boolean(normalizedRole);
  const canCreate = canRead;
  const canEdit = canManageAll || Boolean(review?.mine);
  const canArchive = canManageAll || Boolean(review?.mine);

  return {
    role: normalizedRole,
    canRead,
    canCreate,
    canManageAll,
    canEdit,
    canArchive,
  };
}
