function toPositiveInt(value, fallback, { min = 1, max = 100 } = {}) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(number), min), max);
}

function normalizeSummaryQuery(query = {}) {
  return {
    activityLimit: toPositiveInt(query.activityLimit, 8, { min: 1, max: 25 }),
    fastMovingLimit: toPositiveInt(query.fastMovingLimit, 5, { min: 1, max: 20 }),
    fastMovingDays: toPositiveInt(query.fastMovingDays, 30, { min: 1, max: 365 }),
  };
}

function normalizeActivityQuery(query = {}) {
  return {
    limit: toPositiveInt(query.limit, 10, { min: 1, max: 50 }),
  };
}

function normalizeFastMovingQuery(query = {}) {
  return {
    limit: toPositiveInt(query.limit, 5, { min: 1, max: 20 }),
    days: toPositiveInt(query.days, 30, { min: 1, max: 365 }),
  };
}

module.exports = {
  normalizeSummaryQuery,
  normalizeActivityQuery,
  normalizeFastMovingQuery,
};
