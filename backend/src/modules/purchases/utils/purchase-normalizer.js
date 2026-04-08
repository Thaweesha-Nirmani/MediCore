const AppError = require('../../../core/app-error');

function trimString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
}

function toNumber(value, fieldName, { required = false, min = null } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(`${fieldName} is required`, 422);
    }

    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new AppError(`${fieldName} must be a valid number`, 422);
  }

  if (min !== null && parsed < min) {
    throw new AppError(`${fieldName} must be greater than ${min}`, 422);
  }

  return parsed;
}

function toDate(value, fieldName, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(`${fieldName} is required`, 422);
    }

    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 422);
  }

  return parsed;
}

function ensureDateOrder(startDate, endDate, message = 'expectedDeliveryDate must be after purchaseDate') {
  if (!startDate || !endDate) {
    return;
  }

  if (startDate > endDate) {
    throw new AppError(message, 422);
  }
}

function normalizeOrderStatus(value, current = 'placed') {
  const normalized = trimString(value);

  if (!normalized) {
    return current;
  }

  const byKey = {
    draft: 'draft',
    placed: 'placed',
    partially_received: 'partially_received',
    received: 'received',
    cancelled: 'cancelled',
  };

  const resolved = byKey[normalized.toLowerCase()];

  if (!resolved) {
    throw new AppError('orderStatus is invalid', 422);
  }

  return resolved;
}

function generatePurchaseNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `PO-${year}${month}${day}-${random}`;
}

module.exports = {
  trimString,
  toNumber,
  toDate,
  ensureDateOrder,
  normalizeOrderStatus,
  generatePurchaseNumber,
};
