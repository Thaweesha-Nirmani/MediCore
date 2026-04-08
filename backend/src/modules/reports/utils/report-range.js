const AppError = require('../../../core/app-error');

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

function daysAgo(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function normalizeDateRange(query = {}, { defaultDays = 30 } = {}) {
  const dateFrom = query.dateFrom ? new Date(query.dateFrom) : daysAgo(defaultDays - 1);
  const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();

  if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
    throw new AppError('dateFrom and dateTo must be valid ISO dates', 422);
  }

  if (dateFrom > dateTo) {
    throw new AppError('dateFrom cannot be later than dateTo', 422);
  }

  return {
    dateFrom,
    dateTo,
  };
}

function normalizeSalesQuery(query = {}) {
  return {
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    topLimit: toPositiveInt(query.topLimit, 5, { min: 1, max: 20 }),
  };
}

function normalizePurchaseQuery(query = {}) {
  return {
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    topLimit: toPositiveInt(query.topLimit, 5, { min: 1, max: 20 }),
  };
}

function normalizeStockQuery(query = {}) {
  return {
    page: toPositiveInt(query.page, 1, { min: 1, max: 100000 }),
    limit: toPositiveInt(query.limit, 25, { min: 1, max: 100 }),
    search: trimString(query.search).toLowerCase(),
    location: trimString(query.location).toUpperCase(),
    status: trimString(query.status).toLowerCase(),
    includeInactive: ['true', '1', 'yes'].includes(String(query.includeInactive || '').toLowerCase()),
  };
}

function normalizeExpiryQuery(query = {}) {
  return {
    page: toPositiveInt(query.page, 1, { min: 1, max: 100000 }),
    limit: toPositiveInt(query.limit, 25, { min: 1, max: 100 }),
    search: trimString(query.search).toLowerCase(),
    location: trimString(query.location).toUpperCase(),
    window: trimString(query.window) || 'all',
  };
}

module.exports = {
  normalizeDateRange,
  normalizeSalesQuery,
  normalizeStockQuery,
  normalizeExpiryQuery,
  normalizePurchaseQuery,
};
