function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function toDateOrNull(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysToExpire(value) {
  const date = toDateOrNull(value);

  if (!date) {
    return null;
  }

  const today = startOfToday();
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function getExpiryStatus(value) {
  const days = daysToExpire(value);

  if (days === null) {
    return 'no_expiry';
  }

  if (days < 0) {
    return 'expired';
  }

  if (days <= 7) {
    return 'expiring_in_7_days';
  }

  if (days <= 30) {
    return 'expiring_in_30_days';
  }

  return 'valid';
}

function getExpiryInsight(value) {
  return {
    expiryStatus: getExpiryStatus(value),
    daysToExpire: daysToExpire(value),
  };
}

module.exports = {
  startOfToday,
  daysToExpire,
  getExpiryStatus,
  getExpiryInsight,
};
