const AppError = require('../../../core/app-error');

function trimString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
}

function normalizeEmail(value) {
  const normalized = trimString(value);
  return normalized ? normalized.toLowerCase() : '';
}

function normalizePhone(value, fieldName = 'contactNumber', { required = false } = {}) {
  const normalized = trimString(value);

  if (!normalized) {
    if (required) {
      throw new AppError(`${fieldName} is required`, 422);
    }

    return '';
  }

  const digits = normalized.replace(/[^\d+]/g, '');

  if (digits.length < 7) {
    throw new AppError(`${fieldName} must be a valid contact number`, 422);
  }

  return digits;
}

function normalizeAddress(payload = {}) {
  const source = payload.address && typeof payload.address === 'object' ? payload.address : payload;

  return {
    street: trimString(source.street) || '',
    city: trimString(source.city) || '',
    state: trimString(source.state) || '',
    postalCode: trimString(source.postalCode) || '',
    country: trimString(source.country) || 'Sri Lanka',
  };
}

function normalizeStatus(value, currentStatus = 'Active') {
  const normalized = trimString(value);

  if (!normalized) {
    return currentStatus;
  }

  const byKey = {
    active: 'Active',
    inactive: 'Inactive',
    archived: 'Archived',
  };

  const resolved = byKey[normalized.toLowerCase()];

  if (!resolved) {
    throw new AppError('status must be Active, Inactive, or Archived', 422);
  }

  return resolved;
}

function buildSearchText(parts) {
  return parts
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean)
    .join(' ');
}

module.exports = {
  trimString,
  normalizeEmail,
  normalizePhone,
  normalizeAddress,
  normalizeStatus,
  buildSearchText,
};
