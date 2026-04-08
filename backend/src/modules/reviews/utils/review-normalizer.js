const AppError = require('../../../core/app-error');
const { mapActor, normalizeRole, ROLES } = require('../../users/utils/user-normalizer');

const PRIVILEGED_ROLES = new Set([
  ROLES.ADMIN,
  ROLES.PHARMACIST,
  ROLES.INVENTORY_MANAGER,
  ROLES.PURCHASING_MANAGER,
  ROLES.SUPPLIER_MANAGER,
]);

const ALLOWED_STATUSES = new Set(['open', 'acknowledged', 'resolved', 'archived']);

function trimString(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function toPositiveInt(value, fallback, { min = 1, max = 100 } = {}) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(number), min), max);
}

function normalizeModuleSource(value) {
  const raw = trimString(value).toLowerCase().replace(/\s+/g, '_');

  if (!raw) {
    return 'general';
  }

  const aliases = {
    ims: 'medicines',
    im: 'inventory',
    pm: 'sales',
    sm: 'purchases',
    reports: 'reports',
    reviews: 'reviews',
    dashboard: 'dashboard',
    general: 'general',
  };

  return aliases[raw] || raw;
}

function normalizeReviewStatus(value, fallback = 'open') {
  const normalized = trimString(value).toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (!ALLOWED_STATUSES.has(normalized)) {
    throw new AppError('status is not supported', 422, {
      supportedStatuses: Array.from(ALLOWED_STATUSES),
    });
  }

  return normalized;
}

function normalizeReviewPayload(payload = {}, { partial = false, allowStatus = false } = {}) {
  const data = {};

  if (!partial || payload.title !== undefined) {
    const title = trimString(payload.title);

    if (!title) {
      throw new AppError('title is required', 422);
    }

    data.title = title;
  }

  if (!partial || payload.content !== undefined) {
    const content = trimString(payload.content);

    if (!content) {
      throw new AppError('content is required', 422);
    }

    data.content = content;
  }

  if (!partial || payload.rating !== undefined) {
    const rating = Number(payload.rating);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new AppError('rating must be between 1 and 5', 422);
    }

    data.rating = rating;
  }

  if (payload.moduleSource !== undefined) {
    data.moduleSource = normalizeModuleSource(payload.moduleSource);
  }

  if (payload.status !== undefined) {
    if (!allowStatus) {
      throw new AppError('status cannot be changed by this user', 403);
    }

    data.status = normalizeReviewStatus(payload.status);
  }

  return data;
}

function normalizeListQuery(query = {}) {
  return {
    page: toPositiveInt(query.page, 1, { min: 1, max: 100000 }),
    limit: toPositiveInt(query.limit, 25, { min: 1, max: 100 }),
    search: trimString(query.search),
    moduleSource: query.moduleSource ? normalizeModuleSource(query.moduleSource) : '',
    status: query.status ? normalizeReviewStatus(query.status) : '',
    mineOnly: ['true', '1', 'yes'].includes(String(query.mine || '').toLowerCase()),
    includeArchived: ['true', '1', 'yes'].includes(String(query.includeArchived || '').toLowerCase()),
  };
}

function canManageAnyReview(user) {
  return PRIVILEGED_ROLES.has(normalizeRole(user?.role, { fallback: null }));
}

function canAccessReview(review, user) {
  if (canManageAnyReview(user)) {
    return true;
  }

  return String(review.createdBy?.id || '') === String(user?.id || '');
}

module.exports = {
  normalizeListQuery,
  normalizeReviewPayload,
  normalizeModuleSource,
  normalizeReviewStatus,
  canManageAnyReview,
  canAccessReview,
  mapActor,
};
