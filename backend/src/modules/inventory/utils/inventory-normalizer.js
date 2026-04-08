const AppError = require('../../../core/app-error');

function trimString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
}

function upperString(value) {
  const normalized = trimString(value);
  return normalized ? normalized.toUpperCase() : null;
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
    throw new AppError(`${fieldName} must be ${min === 0 ? '0 or greater' : `greater than ${min}`}`, 422);
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

function normalizeLocation(value) {
  return upperString(value) || 'MAIN_STORE';
}

function ensureDateOrder(manufactureDate, expiryDate) {
  if (!manufactureDate || !expiryDate) {
    return;
  }

  if (manufactureDate >= expiryDate) {
    throw new AppError('manufactureDate must be before expiryDate', 422);
  }
}

function normalizeBatchNumber(value) {
  return upperString(value);
}

module.exports = {
  trimString,
  upperString,
  toNumber,
  toDate,
  normalizeLocation,
  ensureDateOrder,
  normalizeBatchNumber,
};
