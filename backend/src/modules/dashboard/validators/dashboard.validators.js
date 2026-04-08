const { query } = require('express-validator');

const validate = require('../../../validations/validate');

const summary = [
  query('activityLimit').optional().isInt({ min: 1, max: 25 }).toInt(),
  query('fastMovingLimit').optional().isInt({ min: 1, max: 20 }).toInt(),
  query('fastMovingDays').optional().isInt({ min: 1, max: 365 }).toInt(),
  validate,
];

const activity = [
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  validate,
];

const fastMoving = [
  query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
  query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
  validate,
];

module.exports = {
  summary,
  activity,
  fastMoving,
};
