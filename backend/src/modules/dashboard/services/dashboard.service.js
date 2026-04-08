const dashboardRepository = require('../repositories/dashboard.repository');
const {
  toRecentActivityItem,
  toFastMovingMedicine,
} = require('../mappers/dashboard.mapper');
const {
  normalizeSummaryQuery,
  normalizeActivityQuery,
  normalizeFastMovingQuery,
} = require('../utils/dashboard-normalizer');

async function getSummary(query = {}) {
  const options = normalizeSummaryQuery(query);

  const [
    totalMedicines,
    lowStockCount,
    expiredStockCount,
    salesSummary,
    purchaseSummary,
    salesActivity,
    purchaseActivity,
    inventoryActivity,
    fastMovingRows,
  ] = await Promise.all([
    dashboardRepository.countActiveMedicines(),
    dashboardRepository.countLowStockMedicines(),
    dashboardRepository.countExpiredStockMedicines(),
    dashboardRepository.getSalesSummary(),
    dashboardRepository.getPurchaseSummary(),
    dashboardRepository.getRecentSales(options.activityLimit),
    dashboardRepository.getRecentPurchases(options.activityLimit),
    dashboardRepository.getRecentInventoryMovements(options.activityLimit),
    dashboardRepository.getFastMovingMedicines(options.fastMovingDays, options.fastMovingLimit),
  ]);

  const recentActivity = [
    ...salesActivity.map((item) => toRecentActivityItem('sale', item)),
    ...purchaseActivity.map((item) => toRecentActivityItem('purchase', item)),
    ...inventoryActivity.map((item) => toRecentActivityItem('inventory', item)),
  ]
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, options.activityLimit);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      totalMedicines,
      lowStockCount,
      expiredStockCount,
    },
    salesSummary,
    purchaseSummary,
    recentActivity,
    fastMovingMedicines: fastMovingRows.map(toFastMovingMedicine),
  };
}

async function getRecentActivity(query = {}) {
  const options = normalizeActivityQuery(query);

  const [salesActivity, purchaseActivity, inventoryActivity] = await Promise.all([
    dashboardRepository.getRecentSales(options.limit),
    dashboardRepository.getRecentPurchases(options.limit),
    dashboardRepository.getRecentInventoryMovements(options.limit),
  ]);

  const items = [
    ...salesActivity.map((item) => toRecentActivityItem('sale', item)),
    ...purchaseActivity.map((item) => toRecentActivityItem('purchase', item)),
    ...inventoryActivity.map((item) => toRecentActivityItem('inventory', item)),
  ]
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, options.limit);

  return {
    items,
    meta: {
      limit: options.limit,
      total: items.length,
    },
  };
}

async function getFastMovingMedicines(query = {}) {
  const options = normalizeFastMovingQuery(query);
  const rows = await dashboardRepository.getFastMovingMedicines(options.days, options.limit);

  return {
    items: rows.map(toFastMovingMedicine),
    meta: {
      limit: options.limit,
      days: options.days,
      total: rows.length,
    },
  };
}

module.exports = {
  getSummary,
  getRecentActivity,
  getFastMovingMedicines,
};
