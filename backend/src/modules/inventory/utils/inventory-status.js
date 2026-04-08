function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isExpired(expiryDate) {
  if (!expiryDate) {
    return false;
  }

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return expiry < startOfToday();
}

function daysToExpire(expiryDate) {
  if (!expiryDate) {
    return null;
  }

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - startOfToday()) / (1000 * 60 * 60 * 24));
}

function getComputedStockStatus(entry, reorderLevel = 0) {
  const quantity = Number(entry.quantity || 0);
  const manualStatus = entry.stockStatus;

  if (entry.active === false || manualStatus === 'archived') {
    return 'archived';
  }

  if (manualStatus === 'disposed') {
    return 'disposed';
  }

  if (manualStatus === 'damaged') {
    return 'damaged';
  }

  if (manualStatus === 'quarantined') {
    return 'quarantined';
  }

  if (isExpired(entry.expiryDate)) {
    return 'expired';
  }

  if (quantity <= 0) {
    return 'out_of_stock';
  }

  if (quantity <= reorderLevel) {
    return 'low_stock';
  }

  return 'available';
}

function getAvailableQuantity(entry, reorderLevel = 0) {
  const status = getComputedStockStatus(entry, reorderLevel);

  if (['expired', 'disposed', 'damaged', 'quarantined', 'archived', 'out_of_stock'].includes(status)) {
    return 0;
  }

  return Math.max(0, Number(entry.quantity || 0));
}

function getExpiryBucket(expiryDate) {
  const days = daysToExpire(expiryDate);

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

module.exports = {
  startOfToday,
  isExpired,
  daysToExpire,
  getComputedStockStatus,
  getAvailableQuantity,
  getExpiryBucket,
};
