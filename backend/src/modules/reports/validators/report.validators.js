const { query } = require('express-validator');

const validate = require('../../../validations/validate');

const baseDateRange = [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
];

const salesReport = [
  ...baseDateRange,
  query('topLimit').optional().isInt({ min: 1, max: 20 }).toInt(),
  validate,
];

const stockReport = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('location').optional().isString().trim().isLength({ max: 60 }),
  query('status').optional().isIn(['available', 'low_stock', 'out_of_stock', 'expired', 'damaged', 'quarantined', 'disposed', 'archived']),
  query('includeInactive').optional().isBoolean().toBoolean(),
  validate,
];

const expiryReport = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('location').optional().isString().trim().isLength({ max: 60 }),
  query('window').optional().isIn(['7', '30', 'all']),
  validate,
];

const purchaseReport = [
  ...baseDateRange,
  query('topLimit').optional().isInt({ min: 1, max: 20 }).toInt(),
  validate,
];

module.exports = {
  salesReport,
  stockReport,
  expiryReport,
  purchaseReport,
};
