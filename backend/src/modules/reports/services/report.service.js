const dashboardRepository = require('../../dashboard/repositories/dashboard.repository');
const reportRepository = require('../repositories/report.repository');
const {
  buildStockItem,
  buildTimelinePoint,
  buildPaymentMethodSummary,
  buildTopMedicineSummary,
  buildTopSupplierSummary,
} = require('../mappers/report.mapper');
const {
  normalizeDateRange,
  normalizeStockQuery,
  normalizeExpiryQuery,
  normalizeSalesQuery,
  normalizePurchaseQuery,
} = require('../utils/report-range');

function listReports() {
  const items = [
    {
      key: 'sales',
      endpoint: '/api/reports/sales',
      description: 'Sales totals, payment methods, top medicines, and date-based trend data.',
      filters: ['dateFrom', 'dateTo', 'topLimit'],
    },
    {
      key: 'stock',
      endpoint: '/api/reports/stock',
      description: 'Current operational stock report with quantity, status, and low-stock visibility.',
      filters: ['search', 'location', 'status', 'page', 'limit'],
    },
    {
      key: 'expiry',
      endpoint: '/api/reports/expiry',
      description: 'Expired and expiring stock report with 7-day and 30-day alert windows.',
      filters: ['search', 'location', 'window', 'page', 'limit'],
    },
    {
      key: 'purchases',
      endpoint: '/api/reports/purchases',
      description: 'Purchase totals, receiving progress, top suppliers, and date-based trend data.',
      filters: ['dateFrom', 'dateTo', 'topLimit'],
    },
  ];

  return {
    items,
    meta: {
      total: items.length,
    },
  };
}

async function getSalesReport(query = {}) {
  const options = normalizeSalesQuery(query);
  const dateRange = normalizeDateRange(options, { defaultDays: 30 });
  const [summary, paymentMethods, topMedicines, timeline, recentTopSellers] = await Promise.all([
    reportRepository.getSalesSummary(dateRange),
    reportRepository.getSalesPaymentMethods(dateRange),
    reportRepository.getTopSellingMedicines(dateRange, options.topLimit),
    reportRepository.getSalesTimeline(dateRange),
    dashboardRepository.getFastMovingMedicines(30, options.topLimit),
  ]);

  return {
    type: 'sales',
    range: dateRange,
    summary,
    paymentMethods: paymentMethods.map(buildPaymentMethodSummary),
    topMedicines: topMedicines.map(buildTopMedicineSummary),
    timeline: timeline.map(buildTimelinePoint),
    dashboardCrossCheck: {
      fastMovingPreview: recentTopSellers.map(buildTopMedicineSummary),
    },
  };
}

async function getStockReport(query = {}) {
  const options = normalizeStockQuery(query);
  const rows = await reportRepository.listInventoryBatches(options);
  const filteredItems = rows
    .map(buildStockItem)
    .filter((item) => {
      if (options.search && !item.searchText.includes(options.search.toLowerCase())) {
        return false;
      }

      if (options.status && item.stockStatus !== options.status) {
        return false;
      }

      return true;
    });

  const total = filteredItems.length;
  const pagedItems = filteredItems.slice((options.page - 1) * options.limit, options.page * options.limit);

  return {
    items: pagedItems,
    meta: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit) || 1,
      summary: {
        totalBatches: total,
        totalQuantity: filteredItems.reduce((sum, item) => sum + item.quantity, 0),
        availableQuantity: filteredItems.reduce((sum, item) => sum + item.availableQuantity, 0),
        lowStockCount: filteredItems.filter((item) => item.stockStatus === 'low_stock').length,
        outOfStockCount: filteredItems.filter((item) => item.stockStatus === 'out_of_stock').length,
        expiredCount: filteredItems.filter((item) => item.expiryStatus === 'expired').length,
      },
    },
  };
}

async function getExpiryReport(query = {}) {
  const options = normalizeExpiryQuery(query);
  const rows = await reportRepository.listInventoryBatches(options);
  const items = rows
    .map(buildStockItem)
    .filter((item) => {
      if (!['expired', 'expiring_in_7_days', 'expiring_in_30_days'].includes(item.expiryStatus)) {
        return false;
      }

      if (options.search && !item.searchText.includes(options.search.toLowerCase())) {
        return false;
      }

      if (options.window === '7') {
        return ['expired', 'expiring_in_7_days'].includes(item.expiryStatus);
      }

      if (options.window === '30') {
        return ['expired', 'expiring_in_7_days', 'expiring_in_30_days'].includes(item.expiryStatus);
      }

      return true;
    })
    .sort((left, right) => {
      const leftValue = left.daysToExpire === null ? Number.MAX_SAFE_INTEGER : left.daysToExpire;
      const rightValue = right.daysToExpire === null ? Number.MAX_SAFE_INTEGER : right.daysToExpire;
      return leftValue - rightValue;
    });

  const total = items.length;
  const pagedItems = items.slice((options.page - 1) * options.limit, options.page * options.limit);

  return {
    items: pagedItems,
    meta: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit) || 1,
      summary: {
        expired: items.filter((item) => item.expiryStatus === 'expired').length,
        expiringIn7Days: items.filter((item) => item.expiryStatus === 'expiring_in_7_days').length,
        expiringIn30Days: items.filter((item) => item.expiryStatus === 'expiring_in_30_days').length,
      },
    },
  };
}

async function getPurchaseReport(query = {}) {
  const options = normalizePurchaseQuery(query);
  const dateRange = normalizeDateRange(options, { defaultDays: 30 });
  const [summary, timeline, topSuppliers, statusBreakdown] = await Promise.all([
    reportRepository.getPurchaseSummary(dateRange),
    reportRepository.getPurchaseTimeline(dateRange),
    reportRepository.getTopSuppliers(dateRange, options.topLimit),
    reportRepository.getPurchaseStatusBreakdown(dateRange),
  ]);

  return {
    type: 'purchases',
    range: dateRange,
    summary,
    statusBreakdown,
    topSuppliers: topSuppliers.map(buildTopSupplierSummary),
    timeline: timeline.map(buildTimelinePoint),
  };
}

module.exports = {
  listReports,
  getSalesReport,
  getStockReport,
  getExpiryReport,
  getPurchaseReport,
};
