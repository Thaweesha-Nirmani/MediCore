const AppError = require('../../../core/app-error');

const PAYMENT_METHOD_ALIASES = {
  cash: 'cash',
  card: 'card',
  digital_wallet: 'digital_wallet',
  wallet: 'digital_wallet',
  insurance: 'insurance',
  credit: 'credit',
  other: 'other',
};

function trimString(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function roundQuantity(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 1000) / 1000;
}

function toMoney(value, fieldName, { required = false, min = 0 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(`${fieldName} is required`, 422);
    }

    return null;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new AppError(`${fieldName} must be a valid number`, 422);
  }

  const normalized = roundMoney(numeric);

  if (min !== null && normalized < min) {
    throw new AppError(`${fieldName} must be greater than or equal to ${min}`, 422);
  }

  return normalized;
}

function toQuantity(value, fieldName, { required = false, min = 0.001 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(`${fieldName} is required`, 422);
    }

    return null;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new AppError(`${fieldName} must be a valid number`, 422);
  }

  const normalized = roundQuantity(numeric);

  if (min !== null && normalized < min) {
    throw new AppError(`${fieldName} must be greater than 0`, 422);
  }

  return normalized;
}

function normalizePaymentMethod(value, fallback = 'cash') {
  const normalized = trimString(value).toLowerCase().replace(/\s+/g, '_');
  return PAYMENT_METHOD_ALIASES[normalized] || fallback;
}

function extractRawItems(payload = {}) {
  if (Array.isArray(payload.items) && payload.items.length) {
    return payload.items;
  }

  if (Array.isArray(payload.medicines) && payload.medicines.length) {
    return payload.medicines;
  }

  return [];
}

function buildSoldByLabel(user, payload = {}) {
  return (
    trimString(payload.soldBy) ||
    trimString(user?.name) ||
    trimString(user?.email) ||
    'Cashier'
  );
}

function generateBillNumber(prefix = 'PHARM') {
  return `${prefix}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
}

function moneyMatches(left, right, tolerance = 0.01) {
  return Math.abs(roundMoney(left) - roundMoney(right)) <= tolerance;
}

module.exports = {
  trimString,
  escapeRegex,
  roundMoney,
  roundQuantity,
  toMoney,
  toQuantity,
  normalizePaymentMethod,
  extractRawItems,
  buildSoldByLabel,
  generateBillNumber,
  moneyMatches,
};
