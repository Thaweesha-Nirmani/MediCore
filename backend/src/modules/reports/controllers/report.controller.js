const { ok } = require('../../../core/api-response');
const asyncHandler = require('../../../core/async-handler');
const reportService = require('../services/report.service');

const listReports = asyncHandler(async (_req, res) => {
  const reports = reportService.listReports();
  return ok(res, reports.items, reports.meta);
});

const getSalesReport = asyncHandler(async (req, res) => {
  const report = await reportService.getSalesReport(req.query);
  return ok(res, report);
});

const getStockReport = asyncHandler(async (req, res) => {
  const report = await reportService.getStockReport(req.query);
  return ok(res, report.items, report.meta);
});

const getExpiryReport = asyncHandler(async (req, res) => {
  const report = await reportService.getExpiryReport(req.query);
  return ok(res, report.items, report.meta);
});

const getPurchaseReport = asyncHandler(async (req, res) => {
  const report = await reportService.getPurchaseReport(req.query);
  return ok(res, report);
});

module.exports = {
  listReports,
  getSalesReport,
  getStockReport,
  getExpiryReport,
  getPurchaseReport,
};
