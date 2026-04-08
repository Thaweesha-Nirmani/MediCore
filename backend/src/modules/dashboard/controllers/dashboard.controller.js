const { ok } = require('../../../core/api-response');
const asyncHandler = require('../../../core/async-handler');
const dashboardService = require('../services/dashboard.service');

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary(req.query);
  return ok(res, summary);
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const activity = await dashboardService.getRecentActivity(req.query);
  return ok(res, activity.items, activity.meta);
});

const getFastMovingMedicines = asyncHandler(async (req, res) => {
  const result = await dashboardService.getFastMovingMedicines(req.query);
  return ok(res, result.items, result.meta);
});

module.exports = {
  getSummary,
  getRecentActivity,
  getFastMovingMedicines,
};
